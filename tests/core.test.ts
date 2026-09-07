import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sources } from '../src/lib/sources.ts';
import { normalize, mergeEvents, localLocation, safeUrl } from '../scripts/normalize.ts';
import { refreshSource } from '../scripts/pipeline.ts';
import { CollectionError } from '../scripts/http.ts';
import { today, periodRange } from '../src/lib/dates.ts';
import { filteredEvents, isCurrent, readFilters, writeFilters } from '../src/lib/events.ts';
import { collectTribe, collectTicketmaster, collectSkiddle, icalCandidates, ticketmasterCandidate, skiddleCandidate } from '../scripts/collectors.ts';
import type { HttpClient } from '../scripts/http.ts';

const now = new Date('2026-09-06T12:00:00Z');
const source = sources[0];
const candidate = { id: 'a', title: 'An event', url: 'https://example.com/event/a', start: '2026-09-07 20:30:00', timezone: 'Europe/London', venue: 'A venue', address: 'Chester, UK', categories: ['Music'] };
const event = () => normalize(candidate, source, now.toISOString())!;

test('London dates and presets do not depend on machine timezone', () => {
  assert.equal(today(new Date('2026-07-01T23:30:00Z')), '2026-07-02');
  assert.deepEqual(periodRange('weekend', '2026-09-06'), ['2026-09-06', '2026-09-06']);
  assert.deepEqual(periodRange('weekend', '2026-09-04'), ['2026-09-05', '2026-09-06']);
  assert.deepEqual(periodRange('30', '2026-09-06'), ['2026-09-06', '2026-10-05']);
});
test('normalizes summer/winter time, preserves unknowns, sanitizes source content', () => {
  const summer = event();
  assert.equal(summer.startUtc, '2026-09-07T19:30:00.000Z');
  assert.equal(summer.endUtc, null); assert.equal(summer.price, null);
  const winter = normalize({ ...candidate, start: '2026-12-07 20:30:00', title: '<b>Music &amp; dance</b>' }, source, now.toISOString())!;
  assert.equal(winter.startUtc, '2026-12-07T20:30:00.000Z'); assert.equal(winter.title, 'Music & dance');
  assert.equal(safeUrl('javascript:alert(1)'), null);
});
test('midnight placeholder is date-only and unknown date remains undated', () => {
  const midnight = normalize({ ...candidate, start: '2026-09-07 00:00:00' }, source, now.toISOString())!;
  assert.equal(midnight.startDate, '2026-09-07'); assert.equal(midnight.startTime, null); assert.equal(midnight.startUtc, null);
  assert.ok(midnight.issues.includes('Time not confirmed'));
  assert.equal(normalize({ ...candidate, start: 'TBC' }, source, now.toISOString())!.startDate, null);
});
test('strict location matching excludes nearby towns and foreign Chesters', () => {
  assert.equal(localLocation('Chester County', 'Chester', 'US'), false);
  assert.equal(localLocation('Kelsall, Chester'), false);
  assert.equal(localLocation('Chester', 'Chester', 'GB', 53.3, -2.9), false);
  assert.equal(localLocation('Handbridge, Chester, UK'), true);
  assert.equal(localLocation('Hoole'), false);
  assert.equal(localLocation('Somewhere, Cheshire'), false);
});
test('unknown category and vegan options do not become a vegan event', () => {
  const ordinary = normalize({ ...candidate, title: 'Wine tasting with vegan options', categories: [] }, source, now.toISOString())!;
  assert.deepEqual(ordinary.categories, ['Other']);
  assert.equal(normalize({ ...candidate, title: 'Business networking' }, source, now.toISOString()), null);
  assert.notEqual(normalize({ ...candidate, title: 'Family music day' }, source, now.toISOString()), null);
});
test('only strong duplicate evidence merges and all sources survive', () => {
  const first = event();
  const second = normalize({ ...candidate, id: 'b' }, sources[1], now.toISOString())!;
  const merged = mergeEvents([first, second]);
  assert.equal(merged.length, 1); assert.equal(merged[0].sources.length, 2);
  assert.equal(mergeEvents([first, { ...second, startTime: '21:30' }]).length, 2);
  const possible = normalize({ ...candidate, id: 'c', url: 'https://another.example/event' }, sources[1], now.toISOString())!;
  assert.equal(mergeEvents([first, possible]).length, 2);
});
test('expiry respects actual end, overnight events and missing end conservatively', () => {
  assert.equal(isCurrent({ ...event(), startDate: '2026-09-05', endDate: '2026-09-07' }, now), true);
  assert.equal(isCurrent({ ...event(), endUtc: '2026-09-06T11:00:00Z' }, now), false);
  assert.equal(isCurrent({ ...event(), startDate: '2026-09-06', endDate: null }, now), true);
  assert.equal(isCurrent({ ...event(), startDate: '2026-09-05', endDate: null }, now), false);
});
test('source failures, missing records and optional keys preserve future events', async () => {
  const previous = event();
  const failed = await refreshSource(source, [previous], undefined, async () => { throw new Error('secret=private'); }, now);
  assert.equal(failed.records.length, 1); assert.equal(failed.records[0].stale, true);
  assert.ok(!failed.status.message.includes('private'));
  const empty = await refreshSource(source, [previous], undefined, async () => [], now);
  assert.equal(empty.status.state, 'ok'); assert.equal(empty.status.count, 0); assert.equal(empty.records[0].status, 'scheduled');
  const skipped = await refreshSource(source, [previous], undefined, async () => { throw new Error('must not call'); }, now, false);
  assert.equal(skipped.status.state, 'not_configured'); assert.equal(skipped.records.length, 1);
});
test('one malformed event fails the source atomically', async () => {
  const result = await refreshSource(source, [event()], undefined, async () => [candidate, { ...candidate, url: 'bad' }], now);
  assert.equal(result.status.state, 'error'); assert.equal(result.records.length, 1);
});
test('URL state roundtrips and invalid input is contained', () => {
  const filters = readFilters(new URLSearchParams('view=calendar&month=2026-10&day=2026-10-08&category=Music&category=Dance&q=test'), '2026-09-06');
  assert.deepEqual(readFilters(writeFilters(filters), '2026-09-06'), filters);
  const invalid = readFilters(new URLSearchParams('month=garbage&category=bad&from=2026-02-31&period=custom'), '2026-09-06');
  assert.equal(invalid.month, '2026-09'); assert.equal(invalid.from, '2026-09-06'); assert.deepEqual(invalid.categories, []);
});
test('list and calendar include overlapping multi-day events and exclude past ones', () => {
  const spanning = { ...event(), startDate: '2026-08-31', endDate: '2026-09-08' };
  const filters = readFilters(new URLSearchParams('view=calendar&month=2026-09&day=2026-09-06'), '2026-09-06');
  assert.equal(filteredEvents([spanning, event()], filters, now).length, 1);
});
test('Tribe pagination visits all pages and rejects incomplete responses', async () => {
  let count = 0;
  const http = { json: async () => (++count === 1 ? { events: [], total: 0, total_pages: 2, next_rest_url: `${source.endpoint}?page=2` } : { events: [], total: 0, total_pages: 2 }) } as unknown as HttpClient;
  await collectTribe(source, http, '2026-09-06', '2026-10-06'); assert.equal(count, 2);
  await assert.rejects(() => collectTribe(source, { json: async () => ({ total: 3 }) } as unknown as HttpClient, '2026-09-06', '2026-10-06'), CollectionError);
});
test('iCalendar expands bounded recurrence, exclusions and exclusive all-day ends', () => {
  const ical = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:dance','DTSTART;VALUE=DATE:20260907','DTEND;VALUE=DATE:20260908','RRULE:FREQ=WEEKLY;COUNT=4','EXDATE;VALUE=DATE:20260914','SUMMARY:Dance','LOCATION:Hall\, Chester','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const records = icalCandidates(ical, 'https://example.com/dance', '2026-09-01', '2026-09-30');
  assert.equal(records.length, 3); assert.equal(records[0].end, '2026-09-07');
  assert.ok(!records.some(record => record.start === '2026-09-14'));
});
test('provider parsers preserve TBA dates, unknown prices and explicit doors times', () => {
  const tm = ticketmasterCandidate({ id: 'tm', name: 'Gig', url: 'https://example.com', dates: { start: { localDate: '2026-09-07', dateTBA: true } } });
  assert.equal(tm.start, null); assert.equal(tm.price, null);
  const sk = skiddleCandidate({ id: 1, eventname: 'Gig', date: '2026-09-07', openingtimes: { doorsopen: '19:00' } });
  assert.equal(sk.start, '2026-09-07T19:00'); assert.equal(sk.end, undefined); assert.ok(sk.issues?.[0].includes('doors'));
});

test('category labels, locality and explicit midnight need positive evidence', () => {
  assert.deepEqual(normalize({ ...candidate, categories: ['Vegan options'] }, source, now.toISOString())!.categories, ['Other']);
  assert.deepEqual(normalize({ ...candidate, categories: ['Vegan festival'] }, source, now.toISOString())!.categories, ['Vegan']);
  assert.equal(localLocation('Chester, Pennsylvania', 'Chester'), false);
  assert.equal(localLocation('Chester Road, Manchester', 'Manchester', 'GB'), false);
  assert.equal(localLocation('Hoole, Chester CH2 3NJ'), true);
  const midnight = normalize({ ...candidate, start: '2026-09-07T00:00:00', explicitTime: true }, source, now.toISOString())!;
  assert.equal(midnight.startTime, '00:00');
});
test('DST gaps, offsets and contradictory UTC facts stay honest', () => {
  const norm = (extra: object) => normalize({ ...candidate, ...extra }, source, now.toISOString())!;
  const gap = norm({ start: '2026-03-29T01:30:00' });
  assert.equal(gap.startDate, '2026-03-29'); assert.equal(gap.startTime, null); assert.equal(gap.startUtc, null);
  const offset = norm({ start: '2026-09-07T23:30:00-04:00' });
  assert.equal(offset.startDate, '2026-09-08'); assert.equal(offset.startTime, '04:30'); assert.equal(offset.timezone, 'Europe/London');
  const ambiguous = norm({ start: '2026-10-25T01:30:00' });
  assert.equal(ambiguous.startUtc, null); assert.ok(ambiguous.issues.includes('Ambiguous daylight-saving time'));
  assert.equal(norm({ start: '2026-10-25T01:30:00', utcStart: '2026-10-25T01:30:00Z' }).startUtc, '2026-10-25T01:30:00.000Z');
  assert.equal(norm({ utcStart: '2026-09-07T22:30:00Z' }).startUtc, null);
  assert.equal(norm({ end: '2026-09-07T22:00:00', utcEnd: '2026-09-07T17:00:00Z' }).endUtc, null);
});
test('successful corrections retire excluded occurrences and report coverage gaps', async () => {
  const result = await refreshSource(source, [event()], undefined, async () => [{ ...candidate, address: 'Wrexham, UK' }], now);
  assert.equal(result.records.length, 0); assert.equal(result.status.excluded?.locality, 1);
  assert.match(result.status.message, /locality could not be verified/);
});
test('iCalendar missing ends remain unknown and exceptions keep occurrence identity', () => {
  const feed = (lines: string[]) => ['BEGIN:VCALENDAR','VERSION:2.0', ...lines,'END:VCALENDAR'].join('\r\n');
  const single = ['BEGIN:VEVENT','UID:unknown-end','DTSTART:20260907T190000Z','SUMMARY:Dance','LOCATION:Hall, Chester, UK','END:VEVENT'];
  const records = icalCandidates(feed(single), 'https://example.com/dance', '2026-09-01', '2026-09-30');
  assert.equal(records[0].end, null);
  assert.equal(normalize(records[0], source, now.toISOString())!.endUtc, null);
  const recurring = ['BEGIN:VEVENT','UID:weekly','DTSTART:20260907T190000Z','DTEND:20260907T210000Z','RRULE:FREQ=WEEKLY;COUNT=2','SUMMARY:Dance','LOCATION:Hall, Chester, UK','END:VEVENT',
    'BEGIN:VEVENT','UID:weekly','RECURRENCE-ID:20260914T190000Z','DTSTART:20260915T200000Z','DTEND:20260915T220000Z','SUMMARY:Dance moved','LOCATION:Hall, Chester, UK','END:VEVENT'];
  const moved = icalCandidates(feed(recurring), 'https://example.com/dance', '2026-09-01', '2026-09-30');
  assert.equal(moved.length, 2); assert.match(moved[1].id, /2026-09-14/); assert.match(moved[1].start!, /^2026-09-15/);
});


test('optional providers paginate within explicit windows and reject missing pages', async () => {
  const tm = sources.find(source => source.kind === 'ticketmaster')!;
  const calls: URL[] = [];
  const http = { json: async (input: string, api: boolean) => {
    assert.equal(api, true);
    const url = new URL(input); calls.push(url);
    return { page: { totalPages: 2 }, _embedded: { events: [{ id: `event-${calls.length}`, name: 'Gig', url: 'https://example.com/gig' }] } };
  } } as unknown as HttpClient;
  assert.equal((await collectTicketmaster(tm, http, '2026-09-07', '2026-09-14', 'fixture-key')).length, 4);
  assert.deepEqual(calls.map(url => url.searchParams.get('page')), ['0', '1', '0', '1']);
  assert.equal(calls[0].searchParams.get('startDateTime'), '2026-09-06T23:00:00Z');
  assert.equal(calls[2].searchParams.get('endDateTime'), '2026-09-14T22:59:59Z');
  for (const payload of [{ page: { totalPages: 1 } }, { page: { totalPages: -1 } }, { page: { totalPages: 0, totalElements: 2 } }]) {
    await assert.rejects(() => collectTicketmaster(tm, { json: async () => payload } as unknown as HttpClient, '2026-09-07', '2026-09-08', 'fixture-key'), CollectionError);
  }
  const sk = sources.find(source => source.kind === 'skiddle')!;
  const offsets: string[] = [];
  const skHttp = { json: async (input: string, api: boolean) => {
    assert.equal(api, true); const url = new URL(input);
    assert.equal(url.searchParams.get('minDate'), '2026-09-07'); assert.equal(url.searchParams.get('maxDate'), '2026-09-14');
    offsets.push(url.searchParams.get('offset')!);
    return { results: Array.from({ length: offsets.length === 1 ? 100 : 1 }, (_, i) => ({ id: `${offsets.length}-${i}`, eventname: 'Gig' })) };
  } } as unknown as HttpClient;
  assert.equal((await collectSkiddle(sk, skHttp, '2026-09-07', '2026-09-14', 'fixture-key')).length, 101);
  assert.deepEqual(offsets, ['0', '100']);
  await assert.rejects(() => collectSkiddle(sk, { json: async () => ({ results: [{}] }) } as unknown as HttpClient, '2026-09-07', '2026-09-14', 'fixture-key'), CollectionError);
  await assert.rejects(() => collectTribe(source, { json: async () => ({ events: [], total: 2 }) } as unknown as HttpClient, '2026-09-07', '2026-09-14'), CollectionError);
});


test('BID curation supplies locality only when location fields are missing', () => {
  const missing = { ...candidate, address: '', venue: undefined };
  const accepted = normalize(missing, source, now.toISOString())!;
  assert.ok(accepted); assert.equal(accepted.venue, null); assert.equal(accepted.address, null);
  assert.equal(accepted.sources[0].localityBasis, 'source-curation');
  assert.equal(normalize(missing, sources[1], now.toISOString()), null);
  for (const extra of [{ country: 'US' }, { city: 'Wrexham' }, { address: 'Kelsall, Chester' }, { latitude: 53.3, longitude: -2.9 }, { venue: 'Hall, Wrexham' }]) {
    assert.equal(normalize({ ...missing, ...extra }, source, now.toISOString()), null);
  }
});
