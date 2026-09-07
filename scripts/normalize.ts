import { createHash } from 'node:crypto';
import { DateTime } from 'luxon';
import { load } from 'cheerio';
import he from 'he';
import type { Category, EventRecord, Source } from '../src/lib/model.ts';
import { ZONE, validDate } from '../src/lib/dates.ts';

export const text = (value: unknown, cap = 500) => he.decode(load(String(value ?? '')).text()).replace(/\s+/g, ' ').trim().slice(0, cap);
export function safeUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    url.hash = '';
    return url.href;
  } catch { return null; }
}
export function localLocation(address: string, city?: string, country?: string, lat?: number | null, lon?: number | null) {
  if (country && !/^(GB|UK|United Kingdom|Great Britain|England)$/i.test(country)) return false;
  if (/chester-le-street|chester county|chichester|kelsall|malpas|cholmondeley|ellesmere port|wrexham|tarvin|tarporley|mold|northwich/i.test(address)) return false;
  // Coordinates validate locality; a provider radius alone is never evidence.
  if (lat != null && lon != null && !(lat >= 53.16 && lat <= 53.225 && lon >= -2.94 && lon <= -2.84)) return false;
  if (city && !/^(chester|hoole|handbridge)$/i.test(city.trim())) return false;
  const localName = /^(chester|hoole|handbridge)$/i.test(city?.trim() ?? '') || /\b(chester|hoole|handbridge)\b/i.test(address);
  const ukEvidence = !!country || (lat != null && lon != null) || /\b(UK|GB|United Kingdom|England|Cheshire|CH[1-4]\s*\d[A-Z]{2})\b/i.test(address);
  return localName && ukEvidence;
}
const categoryMap: [RegExp, Category][] = [
  [/\b(music|gig|concert|jazz|folk|blues|rock|acoustic)\b/i, 'Music'],
  [/\b(dance|dancing|swing|lindy|salsa|ceilidh)\b/i, 'Dance'],
  [/\b(food|drink|tasting|dining|beer|wine)\b/i, 'Food & Drink'],
  [/^(vegan|vegan (event|festival|fair|market|tasting|dining|food)(s)?)$/i, 'Vegan'],
  [/\b(art|arts|culture|theatre|theater|comedy|exhibition|books|workshop|cinema|film)\b/i, 'Arts & Culture'],
  [/\b(community|quiz|games|charity)\b/i, 'Community'],
  [/\b(market|markets|fair|fairs)\b/i, 'Markets & Fairs'],
  [/\b(nightlife|club night|club nights|clubbing)\b/i, 'Nightlife'],
  [/\b(outdoors|walk|walking|nature)\b/i, 'Outdoors'],
];
export function classify(labels: string[]): Category[] {
  const mapped = categoryMap.filter(([pattern]) => labels.some(label => pattern.test(label))).map(([, category]) => category);
  return mapped.length ? mapped : ['Other'];
}
export interface Candidate {
  id: string;
  title: string;
  description?: string;
  url: string;
  bookingUrl?: string | null;
  start?: string | null;
  end?: string | null;
  utcStart?: string | null;
  utcEnd?: string | null;
  timezone?: string | null;
  allDay?: boolean;
  explicitTime?: boolean;
  venue?: string | null;
  address?: string | null;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  categories?: string[];
  price?: string | null;
  status?: string | null;
  modified?: string | null;
  seriesId?: string | null;
  issues?: string[];
}
export function usesSourceLocality(candidate: Candidate, source: Source) {
  return !!source.trustedLocality && !text(candidate.address) && !candidate.city && candidate.latitude == null && candidate.longitude == null;
}
export function candidateIsLocal(candidate: Candidate, source: Source) {
  const trusted = usesSourceLocality(candidate, source);
  return localLocation(`${candidate.venue ?? ''} ${candidate.address ?? ''} ${trusted ? source.trustedLocality : ''}`,
    trusted ? 'Chester' : candidate.city, candidate.country, candidate.latitude, candidate.longitude);
}
function parseTime(value: string | null | undefined, zone: string | null | undefined) {
  if (!value) return null;
  const date = DateTime.fromISO(value.replace(' ', 'T'), { zone: zone ?? ZONE, setZone: true });
  if (!date.isValid) return null;
  // Luxon shifts nonexistent DST wall times forward; reject that silent correction.
  const wall = value.replace(' ', 'T').match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (wall && !/(Z|[+-]\d{2}:?\d{2})$/i.test(value) && date.toFormat("yyyy-MM-dd'T'HH:mm") !== wall[1]) return null;
  return date;
}
export function normalize(candidate: Candidate, source: Source, checkedAt: string): EventRecord | null {
  const title = text(candidate.title, 180);
  const url = safeUrl(candidate.url);
  if (!title || !url || !candidate.id) throw new Error('Invalid event identity');
  if (!candidateIsLocal(candidate, source)) return null;
  if (/\b(business networking|children.only|kids.only|toddler|baby sensory|under.?5s|donation only|meal pre.order|private hire|membership)\b/i.test(`${title} ${(candidate.categories ?? []).join(' ')}`)) return null;
  const issues = [...candidate.issues ?? []];
  const parsedStart = parseTime(candidate.start, candidate.timezone);
  const start = parsedStart?.setZone(ZONE) ?? null;
  const end = parseTime(candidate.end, candidate.timezone)?.setZone(ZONE) ?? null;
  const dateOnly = !!candidate.allDay || !candidate.start?.includes(':') || (!candidate.explicitTime && !!candidate.start?.match(/[T ]00:00/));
  let startDate = start?.toISODate() ?? (validDate(candidate.start?.slice(0, 10) ?? null) ? candidate.start!.slice(0, 10) : null);
  if (candidate.start && !start && startDate) issues.push('Invalid source time — check source');
  if (!validDate(startDate)) startDate = null;
  if (!startDate) issues.push('Date to be confirmed');
  else if (dateOnly && !candidate.allDay) issues.push('Time not confirmed');
  if (!candidate.venue) issues.push('Venue not listed');
  const utcStart = parseTime(candidate.utcStart, 'UTC');
  const utcEnd = parseTime(candidate.utcEnd, 'UTC');
  if (start && !dateOnly && start.hour < 10) issues.push('Unusual start time — check source');
  if (start && start.getPossibleOffsets().length > 1 && !utcStart && !/(Z|[+-]\d{2}:?\d{2})$/i.test(candidate.start ?? '')) issues.push('Ambiguous daylight-saving time');
  let endDate = end?.toISODate() ?? null;
  let endUtc = end && !dateOnly ? (utcEnd ?? end).toUTC().toISO() : null;
  if (end && start && end < start) { issues.push('End precedes start'); endDate = null; endUtc = null; }
  const startConflict = !!(utcStart && start && !start.getPossibleOffsets().some(option => Math.abs(utcStart.toMillis() - option.toMillis()) < 60000));
  if (startConflict) issues.push('Source time and timezone conflict');
  if (utcEnd && end && !end.getPossibleOffsets().some(option => Math.abs(utcEnd.toMillis() - option.toMillis()) < 60000)) { issues.push('Source end time and timezone conflict'); endUtc = null; }
  if (end && end.getPossibleOffsets().length > 1 && !utcEnd && !/(Z|[+-]\d{2}:?\d{2})$/i.test(candidate.end ?? '')) { issues.push('Ambiguous end daylight-saving time'); endUtc = null; }
  if (endUtc && start && Date.parse(endUtc) < (utcStart ?? start).toMillis()) { issues.push('End precedes start'); endDate = null; endUtc = null; }
  const statusText = candidate.status?.toLowerCase() ?? '';
  const status: EventRecord['status'] = /cancel/.test(statusText) ? 'cancelled' : /postpon/.test(statusText) ? 'postponed' : /resched/.test(statusText) ? 'rescheduled' : /sold.?out|offsale/.test(statusText) ? (/sold.?out/.test(statusText) ? 'sold_out' : 'scheduled') : 'scheduled';
  const id = createHash('sha256').update(`${source.id}:${candidate.id}`).digest('hex').slice(0, 16);
  return {
    id, title, description: text(candidate.description, 280), startDate, endDate,
    startTime: start && !dateOnly ? start.toFormat('HH:mm') : null,
    startUtc: start && !dateOnly && !startConflict && !issues.includes('Ambiguous daylight-saving time') ? (utcStart ?? start).toUTC().toISO() : null,
    endUtc, timezone: startDate ? ZONE : null, allDay: candidate.allDay ?? false,
    venue: text(candidate.venue, 150) || null, address: text(candidate.address, 220) || null,
    latitude: candidate.latitude ?? null, longitude: candidate.longitude ?? null,
    categories: classify(candidate.categories ?? []), price: text(candidate.price, 100) || null,
    status, issues: [...new Set(issues)], stale: false, seriesId: candidate.seriesId ?? null,
    sources: [{ sourceId: source.id, sourceEventId: candidate.id, url, bookingUrl: safeUrl(candidate.bookingUrl), checkedAt, ...(usesSourceLocality(candidate, source) ? { localityBasis: 'source-curation' as const } : {}),
      original: { title, utcStart: candidate.utcStart ?? null, utcEnd: candidate.utcEnd ?? null, start: candidate.start ?? null, end: candidate.end ?? null, timezone: candidate.timezone ?? null,
        venue: text(candidate.venue, 150) || null, address: text(candidate.address, 220) || null,
        categories: candidate.categories ?? [], price: candidate.price ?? null, status: candidate.status ?? null, modified: candidate.modified ?? null } }],
  };
}
const canonical = (url: string | null) => url ? safeUrl(url)?.replace(/\/$/, '') : null;
export function mergeEvents(records: EventRecord[]) {
  const result: EventRecord[] = [];
  for (const record of records) {
    const links = record.sources.flatMap(source => [canonical(source.url), canonical(source.bookingUrl)]).filter(Boolean);
    const existing = result.find(event => event.sources.some(source => record.sources.some(other => source.sourceId === other.sourceId && source.sourceEventId === other.sourceEventId)) ||
      (event.startDate === record.startDate && event.startTime === record.startTime && event.sources.some(source => [canonical(source.url), canonical(source.bookingUrl)].some(link => link && links.includes(link)))));
    if (!existing) { result.push(structuredClone(record)); continue; }
    for (const key of ['startDate', 'startTime', 'venue', 'price', 'status'] as const) {
      if (existing[key] && record[key] && existing[key] !== record[key]) existing.issues.push(`Sources disagree on ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    }
    existing.issues = [...new Set([...existing.issues, ...record.issues])];
    existing.categories = [...new Set([...existing.categories, ...record.categories])];
    existing.sources.push(...record.sources.filter(source => !existing.sources.some(other => other.sourceId === source.sourceId && other.sourceEventId === source.sourceEventId)));
    existing.stale = existing.stale && record.stale;
  }
  return result.sort((a, b) => `${a.startDate ?? '9999'} ${a.startTime ?? ''} ${a.id}`.localeCompare(`${b.startDate ?? '9999'} ${b.startTime ?? ''} ${b.id}`));
}
