import { DateTime } from 'luxon';
import type { EventRecord } from '../lib/model';
import { today, dateLabel, periodRange, checkedLabel, ZONE } from '../lib/dates';
import { readFilters, writeFilters, filteredEvents, matchesInterests, overlaps, isCurrent, issuesFor } from '../lib/events';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const events: EventRecord[] = JSON.parse($('#event-data').textContent ?? '[]');
const template = $<HTMLTemplateElement>('#event-templates');
const cards = new Map([...template.content.querySelectorAll<HTMLElement>('[data-event-id]')].map(card => [card.dataset.eventId!, card]));
let filters = readFilters(new URLSearchParams(location.search));
const form = $<HTMLFormElement>('#filters');
const inputs = form.elements;
const input = (name: string) => inputs.namedItem(name) as HTMLInputElement;

function renderCards(target: HTMLElement, records: EventRecord[]) {
  target.replaceChildren(...records.map(event => {
    const card = cards.get(event.id)!.cloneNode(true) as HTMLElement;
    const issues = issuesFor(event);
    card.querySelector('.uncertainty')?.remove();
    if (issues.length) {
      const notice = document.createElement('div'); notice.className = 'uncertainty';
      const message = document.createElement('span'); message.textContent = issues.join(' · ');
      const checked = document.createElement('small'); checked.textContent = `Last successful source check: ${checkedLabel(event.sources.map(source => source.checkedAt).sort().at(-1) ?? null)}`;
      notice.append(message, checked); card.querySelector('.event-main')!.append(notice);
    }
    return card;
  }));
}
function renderCalendar() {
  const start = DateTime.fromISO(`${filters.month}-01`, { zone: ZONE });
  $('#month-title').textContent = start.toFormat('MMMM yyyy');
  const grid = $('#calendar-grid'); grid.replaceChildren();
  const candidates = events.filter(event => isCurrent(event) && matchesInterests(event, filters));
  for (let i = 1; i < start.weekday; i++) { const blank = document.createElement('div'); blank.className = 'calendar-blank'; blank.setAttribute('aria-hidden', 'true'); grid.append(blank); }
  for (let day = 1; day <= start.daysInMonth!; day++) {
    const date = start.set({ day }).toISODate()!;
    const count = candidates.filter(event => overlaps(event, date, date)).length;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'calendar-day';
    button.dataset.date = date;
    button.classList.toggle('is-today', date === today());
    button.setAttribute('aria-pressed', String(date === filters.day));
    if (date === today()) button.setAttribute('aria-current', 'date');
    button.setAttribute('aria-label', `${dateLabel(date, 'EEEE d MMMM yyyy')}, ${count} ${count === 1 ? 'event' : 'events'}`);
    const number = document.createElement('span'); number.textContent = String(day); button.append(number);
    if (count) { const badge = document.createElement('small'); badge.textContent = `${count}`; badge.className = 'day-count'; button.append(badge); }
    button.addEventListener('click', () => { filters.day = filters.day === date ? null : date; update(); $<HTMLButtonElement>(`[data-date="${date}"]`).focus(); });
    button.addEventListener('keydown', event => {
      const increment = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (increment) {
        event.preventDefault(); const next = start.set({ day }).plus({ days: increment });
        filters.month = next.toFormat('yyyy-MM'); filters.day = null; update();
        $<HTMLButtonElement>(`[data-date="${next.toISODate()}"]`).focus();
      }
    });
    grid.append(button);
  }
}
function render() {
  for (const element of form.querySelectorAll<HTMLInputElement>('[name="period"]')) element.checked = element.value === filters.period;
  for (const element of form.querySelectorAll<HTMLInputElement>('[name="category"]')) element.checked = filters.categories.includes(element.value as typeof filters.categories[number]);
  input('from').value = filters.from; input('to').value = filters.to; input('q').value = filters.query;
  $('#custom-dates').hidden = filters.period !== 'custom' || filters.view === 'calendar';
  $<HTMLFieldSetElement>('.periods').disabled = filters.view === 'calendar';
  $('.periods').hidden = filters.view === 'calendar';
  $('#calendar-panel').hidden = filters.view !== 'calendar';
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === filters.view)));
  if (filters.view === 'calendar') renderCalendar();
  const visible = filteredEvents(events, filters);
  renderCards($('#events-list'), visible);
  $('#result-count').textContent = `${visible.length} ${visible.length === 1 ? 'event' : 'events'}`;
  $('#results-title').textContent = filters.view === 'calendar' ? (filters.day ? dateLabel(filters.day, 'EEEE d MMMM') : dateLabel(`${filters.month}-01`, 'MMMM yyyy')) :
    filters.period === '30' ? 'The next 30 days' : filters.period === '7' ? 'The next 7 days' : filters.period === 'today' ? 'Today in Chester' : filters.period === 'weekend' ? 'This weekend' : `${dateLabel(filters.from)} – ${dateLabel(filters.to)}`;
  $('#empty-state').hidden = visible.length > 0;
  const undated = events.filter(event => !event.startDate && matchesInterests(event, filters));
  $('#undated-section').hidden = !undated.length;
  renderCards($('#undated-list'), undated);
}
function update(push = true) {
  const search = writeFilters(filters).toString();
  if (push && search !== location.search.slice(1)) history.pushState(null, '', `${location.pathname}?${search}${location.hash}`);
  render();
}
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('change', event => {
  const target = event.target as HTMLInputElement;
  if (target.name === 'period') {
    $('#date-error').textContent = '';
    filters.period = target.value as typeof filters.period;
    if (filters.period !== 'custom') [filters.from, filters.to] = periodRange(filters.period);
  } else if (target.name === 'category') {
    filters.categories = [...form.querySelectorAll<HTMLInputElement>('[name="category"]:checked')].map(element => element.value as typeof filters.categories[number]);
  } else if (target.name === 'from' || target.name === 'to') {
    const from = input('from'), to = input('to');
    if (!from.value || !to.value || from.value > to.value) { $('#date-error').textContent = 'Choose an end date on or after the start date.'; return; }
    $('#date-error').textContent = ''; filters.from = from.value; filters.to = to.value;
  }
  update();
});
let searchTimer: ReturnType<typeof setTimeout>;
input('q').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { filters.query = input('q').value.slice(0, 200); update(); }, 180); });
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.addEventListener('click', () => { filters.view = button.dataset.view as typeof filters.view; update(); }));
$('#clear-filters').addEventListener('click', () => { clearTimeout(searchTimer); filters = readFilters(new URLSearchParams()); $('#date-error').textContent = ''; update(); });
for (const [id, months] of [['prev-month', -1], ['next-month', 1]] as const) {
  $(`#${id}`).addEventListener('click', () => { filters.month = DateTime.fromISO(`${filters.month}-01`).plus({ months }).toFormat('yyyy-MM'); filters.day = null; update(); });
}
$('#whole-month').addEventListener('click', () => { filters.day = null; update(); });
$('#share').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); $('#share-status').textContent = 'Link copied'; }
  catch { $('#share-status').textContent = 'Copy the address from your browser to share this view.'; }
});
window.addEventListener('popstate', () => { clearTimeout(searchTimer); filters = readFilters(new URLSearchParams(location.search)); $('#date-error').textContent = ''; render(); });
render();
