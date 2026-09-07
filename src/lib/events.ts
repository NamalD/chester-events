import type { Category, EventRecord } from './model';
import { today, validDate, periodRange, type Period, addDays } from './dates';
import { categories } from './model';

export interface Filters {
  view: 'list' | 'calendar';
  period: Period;
  from: string;
  to: string;
  month: string;
  day: string | null;
  categories: Category[];
  query: string;
}
export function readFilters(params: URLSearchParams, date = today()): Filters {
  const period = (['today', 'weekend', '7', '30', 'custom'].includes(params.get('period') ?? '') ? params.get('period') : '30') as Period;
  const range = periodRange(period, date);
  const from = period === 'custom' && validDate(params.get('from')) ? params.get('from')! : range[0];
  const proposedTo = period === 'custom' && validDate(params.get('to')) ? params.get('to')! : range[1];
  const month = params.get('month');
  const day = params.get('day');
  const selectedMonth = month && validDate(`${month}-01`) ? month : date.slice(0, 7);
  return {
    view: params.get('view') === 'calendar' ? 'calendar' : 'list', period,
    from, to: proposedTo < from ? from : proposedTo,
    month: selectedMonth,
    day: validDate(day) && day.startsWith(selectedMonth) ? day : null,
    categories: [...new Set(params.getAll('category').filter((value): value is Category => categories.includes(value as Category)))],
    query: (params.get('q') ?? '').slice(0, 200),
  };
}
export function writeFilters(filters: Filters) {
  const params = new URLSearchParams();
  params.set('view', filters.view);
  params.set('period', filters.period);
  if (filters.period === 'custom') { params.set('from', filters.from); params.set('to', filters.to); }
  if (filters.view === 'calendar') {
    params.set('month', filters.month);
    if (filters.day) params.set('day', filters.day);
  }
  filters.categories.forEach(category => params.append('category', category));
  if (filters.query) params.set('q', filters.query);
  return params;
}
export function isCurrent(event: EventRecord, now = new Date()) {
  if (event.endUtc) return Date.parse(event.endUtc) > now.getTime();
  // Unknown end: retain through the last advertised local day, never invent a duration.
  return !event.startDate || (event.endDate ?? event.startDate) >= today(now);
}
export function isStale(event: EventRecord, now = new Date()) {
  return event.stale || event.sources.every(source => now.getTime() - Date.parse(source.checkedAt) > 3 * 86400000);
}
export function issuesFor(event: EventRecord, now = new Date()) {
  return [...new Set([...event.issues, ...(isStale(event, now) ? ['Source needs rechecking'] : [])])];
}
export function matchesInterests(event: EventRecord, filters: Filters, now = new Date()) {
  const available = [...event.categories, ...(issuesFor(event, now).length ? ['Uncertain details'] : [])];
  return (!filters.categories.length || filters.categories.some(category => available.includes(category))) &&
    `${event.title} ${event.venue ?? ''} ${event.description}`.toLowerCase().includes(filters.query.toLowerCase());
}
export function overlaps(event: EventRecord, from: string, to: string) {
  return !!event.startDate && event.startDate <= to && (event.endDate ?? event.startDate) >= from;
}
export function filteredEvents(events: EventRecord[], filters: Filters, now = new Date()) {
  const monthEnd = addDays(`${filters.month === '9999-12' ? '9999-12' : filters.month}-01`, 31).slice(0, 7);
  const from = filters.view === 'calendar' ? filters.day ?? `${filters.month}-01` : filters.from;
  const to = filters.view === 'calendar' ? filters.day ?? addDays(`${monthEnd}-01`, -1) : filters.to;
  return events.filter(event => isCurrent(event, now) && matchesInterests(event, filters, now) && overlaps(event, from, to))
    .sort((a, b) => `${a.startDate} ${a.startTime ?? '99'}`.localeCompare(`${b.startDate} ${b.startTime ?? '99'}`) || a.title.localeCompare(b.title));
}
