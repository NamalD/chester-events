import { load } from 'cheerio';
import ICAL from 'ical.js';
import { DateTime } from 'luxon';
import type { Source } from '../src/lib/model.ts';
import { addDays, ZONE } from '../src/lib/dates.ts';
import { type Candidate, text } from './normalize.ts';
import { CollectionError, HttpClient } from './http.ts';

type Raw = Record<string, any>;
const number = (value: unknown) => value != null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
export function tribeCandidate(raw: Raw): Candidate {
  if (!raw || typeof raw.title !== 'string' || raw.id == null) throw new CollectionError('Unrecognised event record');
  const venue = raw.venue && !Array.isArray(raw.venue) ? raw.venue : {};
  return {
    id: String(raw.id), title: raw.title, description: raw.excerpt || raw.description, url: raw.url, bookingUrl: raw.website,
    start: raw.start_date, end: raw.end_date, utcStart: raw.utc_start_date, utcEnd: raw.utc_end_date,
    timezone: raw.timezone, allDay: raw.all_day === true, venue: venue.venue,
    address: [venue.address, venue.city, venue.zip, venue.country].filter(Boolean).join(', '),
    city: venue.city, country: venue.country, latitude: number(venue.geo_lat), longitude: number(venue.geo_lng),
    categories: [...(raw.categories ?? []), ...(raw.tags ?? [])].map((category: Raw) => text(category.name)),
    price: raw.cost || null, status: raw.event_status || (raw.title.match(/\b(cancelled|postponed|rescheduled|sold out)\b/i)?.[1]),
    modified: raw.modified_utc, seriesId: raw.recurrence?.rules?.length ? String(raw.id) : null,
  };
}
export async function collectTribe(source: Source, http: HttpClient, from: string, to: string) {
  const result: Candidate[] = [];
  const initial = new URL(source.endpoint);
  initial.search = new URLSearchParams({ start_date: `${from} 00:00:00`, end_date: `${to} 23:59:59`, per_page: '50', page: '1' }).toString();
  let next: string | null = initial.href;
  const visited = new Set<string>();
  let total: number | undefined;
  while (next) {
    if (visited.has(next) || visited.size >= 100) throw new CollectionError('Feed pagination did not finish');
    const url = new URL(next);
    if (url.origin !== initial.origin || url.pathname.replace(/\/$/, '') !== initial.pathname) throw new CollectionError('Unexpected pagination route');
    visited.add(next);
    const page = await http.json(next);
    if (!Array.isArray(page.events) || !Number.isFinite(page.total)) throw new CollectionError('Unrecognised feed structure');
    if (!Number.isInteger(page.total) || page.total < 0 || (total != null && total !== page.total)) throw new CollectionError('Inconsistent feed total');
    total = page.total;
    result.push(...page.events.map(tribeCandidate));
    next = typeof page.next_rest_url === 'string' && page.next_rest_url ? page.next_rest_url : null;
    if (!next && Number(page.total_pages) > visited.size) throw new CollectionError('Incomplete feed pagination');
  }
  if (result.length !== total) throw new CollectionError('Incomplete feed results');
  return result;
}
export function icalCandidates(body: string, url: string, from: string, to: string): Candidate[] {
  const calendar = new ICAL.Component(ICAL.parse(body));
  if (calendar.name !== 'vcalendar') throw new CollectionError('Unrecognised iCalendar feed');
  for (const zone of calendar.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(new ICAL.Timezone(zone));
  const components = calendar.getAllSubcomponents('vevent');
  const result: Candidate[] = [];
  const format = (value: ICAL.Time) => value.toString();
  for (const component of components.filter(c => !c.hasProperty('recurrence-id'))) {
    const event = new ICAL.Event(component);
    for (const exception of components.filter(c => c.hasProperty('recurrence-id') && c.getFirstPropertyValue('uid') === event.uid)) event.relateException(new ICAL.Event(exception));
    if (!event.startDate) throw new CollectionError('iCalendar event missing start');
    const iterator = event.iterator();
    let iterations = 0;
    let occurrence: ICAL.Time | null;
    while ((occurrence = iterator.next())) {
      if (++iterations > 20000) throw new CollectionError('Recurrence expansion exceeds safety limit');
      const details = event.getOccurrenceDetails(occurrence);
      const start = details.startDate;
      const item = details.item;
      const end = item.component.hasProperty('dtend') || item.component.hasProperty('duration') ? details.endDate : null;
      const date = format(start).slice(0, 10);
      if (date > to) break;
      if (format(end ?? start).slice(0, 10) < from) continue;
      const zone = start.zone.tzid;
      const floating = zone === 'floating';
      const localStart = zone === 'UTC' ? DateTime.fromJSDate(start.toJSDate(), { zone: ZONE }).toISO() : format(start);
      const localEnd = end && (end.isDate ? addDays(format(end), -1) : zone === 'UTC' ? DateTime.fromJSDate(end.toJSDate(), { zone: ZONE }).toISO() : format(end));
      result.push({
        id: `${event.uid}:${format(occurrence)}`, title: item.summary, description: item.description,
        url: String(item.component.getFirstPropertyValue('url') ?? url),
        start: localStart, end: localEnd, allDay: start.isDate, explicitTime: !start.isDate,
        timezone: floating || zone === 'UTC' ? ZONE : zone,
        venue: item.location?.split(',')[0], address: item.location,
        categories: item.component.getAllProperties('categories').flatMap(property => property.getValues().map(String)),
        status: String(item.component.getFirstPropertyValue('status') ?? ''),
        seriesId: event.isRecurring() ? event.uid : null,
        issues: event.isRecurring() && !item.component.hasProperty('dtend') ? ['Recurrence end time not supplied'] : [],
      });
      if (!event.isRecurring()) break;
    }
  }
  return result;
}
export async function collectSwing(source: Source, http: HttpClient, from: string, to: string) {
  const html = load(await http.get(source.endpoint));
  const urls = new Set<string>();
  html('a[href]').each((_, element) => {
    const url = new URL(html(element).attr('href')!, source.endpoint);
    if (url.origin === new URL(source.endpoint).origin && url.searchParams.get('format') === 'ical') urls.add(url.href);
  });
  if (!urls.size) throw new CollectionError('No advertised iCalendar links found');
  if (urls.size > 150) throw new CollectionError('Calendar discovery exceeds safety limit');
  const result: Candidate[] = [];
  for (const url of urls) result.push(...icalCandidates(await http.get(url), url.split('?')[0], from, to));
  return result;
}
export function ticketmasterCandidate(raw: Raw): Candidate {
  if (!raw || typeof raw.id !== 'string' || !raw.id || typeof raw.name !== 'string') throw new CollectionError('Unrecognised provider event');
  const venue = raw._embedded?.venues?.[0] ?? {};
  const start = raw.dates?.start ?? {};
  const end = raw.dates?.end ?? {};
  const date = start.dateTBD || start.dateTBA ? null : start.localDate;
  return {
    id: raw.id, title: raw.name, description: raw.info ?? raw.pleaseNote, url: raw.url, bookingUrl: raw.url,
    start: date ? `${date}${start.localTime && !start.noSpecificTime && !start.timeTBA ? `T${start.localTime}` : ''}` : null,
    end: end.localDate ? `${end.localDate}${end.localTime ? `T${end.localTime}` : ''}` : null,
    explicitTime: !!start.localTime && !start.noSpecificTime && !start.timeTBA,
    utcStart: start.dateTime, utcEnd: end.dateTime, timezone: raw.dates?.timezone ?? venue.timezone,
    venue: venue.name, address: [venue.address?.line1, venue.city?.name, venue.postalCode, venue.country?.name].filter(Boolean).join(', '),
    city: venue.city?.name, country: venue.country?.countryCode, latitude: number(venue.location?.latitude), longitude: number(venue.location?.longitude),
    categories: (raw.classifications ?? []).flatMap((item: Raw) => [item.segment?.name, item.genre?.name, item.subGenre?.name].filter(Boolean)),
    price: raw.priceRanges?.length ? raw.priceRanges.map((range: Raw) => `${range.currency} ${range.min}${range.max !== range.min ? `–${range.max}` : ''}`).join('; ') : null,
    status: raw.dates?.status?.code,
  };
}
export async function collectTicketmaster(source: Source, http: HttpClient, from: string, to: string, key: string) {
  const result: Candidate[] = [];
  // One-week slices stay below Discovery's 1,000-record deep pagination limit.
  for (let start = from; start <= to; start = addDays(start, 7)) {
    const end = addDays(start, 6) < to ? addDays(start, 6) : to;
    for (let page = 0; page < 5; page++) {
      const url = new URL(source.endpoint);
      url.search = new URLSearchParams({ apikey: key, countryCode: 'GB', city: 'Chester', geoPoint: geohash(53.19, -2.89), radius: '4', unit: 'km',
        startDateTime: DateTime.fromISO(start, { zone: ZONE }).toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'"),
        endDateTime: DateTime.fromISO(end, { zone: ZONE }).endOf('day').toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'Z'"), size: '200', page: String(page), sort: 'date,asc' }).toString();
      const data = await http.json(url.href, true);
      if (!data.page || !Number.isInteger(data.page.totalPages) || data.page.totalPages < 0 || (data._embedded?.events != null && !Array.isArray(data._embedded.events))) throw new CollectionError('Unrecognised provider response');
      if (data.page.totalPages > 5) throw new CollectionError('Provider window exceeds pagination limit');
      if (data.page.totalElements > 0 && !data._embedded?.events?.length) throw new CollectionError('Provider result total disagrees with events');
      if (data.page.totalPages > 0 && !data._embedded?.events?.length) throw new CollectionError('Provider page missing events');
      result.push(...(data._embedded?.events ?? []).map(ticketmasterCandidate));
      if (page + 1 >= data.page.totalPages) break;
    }
  }
  return result;
}
function geohash(latitude: number, longitude: number) {
  let hash = '', bits = 0, value = 0, even = true;
  const lat = [-90, 90], lon = [-180, 180];
  while (hash.length < 7) {
    const range = even ? lon : lat, coordinate = even ? longitude : latitude, midpoint = (range[0] + range[1]) / 2;
    value = (value << 1) | Number(coordinate >= midpoint);
    range[coordinate >= midpoint ? 0 : 1] = midpoint;
    even = !even;
    if (++bits === 5) { hash += '0123456789bcdefghjkmnpqrstuvwxyz'[value]; bits = value = 0; }
  }
  return hash;
}
export function skiddleCandidate(raw: Raw): Candidate {
  if (!raw || raw.id == null || typeof raw.eventname !== 'string') throw new CollectionError('Unrecognised provider event');
  const venue = raw.venue ?? {};
  const labels: Record<string, string> = { LIVE: 'Live music', CLUB: 'Nightlife', COMEDY: 'Comedy', EXHIB: 'Exhibition', ARTS: 'Arts', THEATRE: 'Theatre', KIDS: 'Family' };
  const time = raw.openingtimes?.doorsopen;
  return {
    id: String(raw.id), title: raw.eventname, description: raw.description, url: raw.link, bookingUrl: raw.link,
    start: raw.date ? `${raw.date}${time && /^\d{2}:\d{2}/.test(time) ? `T${time}` : ''}` : null,
    // Doors time is explicitly labelled; do not manufacture a performance time or cross-midnight end.
    explicitTime: !!time, timezone: ZONE, venue: venue.name, address: [venue.address, venue.town, venue.postcode].filter(Boolean).join(', '),
    city: venue.town, country: venue.country, latitude: number(venue.latitude), longitude: number(venue.longitude),
    categories: labels[raw.EventCode] ? [labels[raw.EventCode]] : [], price: raw.entryprice || null,
    status: raw.cancelled === '1' || raw.cancelled === true ? 'cancelled' : raw.soldout === true || raw.soldout === '1' ? 'sold_out' : null,
    issues: time ? ['Listed time is doors opening'] : [],
  };
}
export async function collectSkiddle(source: Source, http: HttpClient, from: string, to: string, key: string) {
  const result: Candidate[] = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const url = new URL(source.endpoint);
    url.search = new URLSearchParams({ api_key: key, latitude: '53.19', longitude: '-2.89', radius: '3', country: 'GB', minDate: from, maxDate: to, limit: '100', offset: String(offset), description: '1' }).toString();
    const page = await http.json(url.href, true);
    if (!Array.isArray(page.results)) throw new CollectionError('Unrecognised provider response');
    result.push(...page.results.map(skiddleCandidate));
    if (page.results.length < 100) return result;
  }
  throw new CollectionError('Provider pagination did not finish');
}
