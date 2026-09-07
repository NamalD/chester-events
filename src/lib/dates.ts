import { DateTime } from 'luxon';
export const ZONE = 'Europe/London';
export const today = (now = new Date()) => DateTime.fromJSDate(now, { zone: ZONE }).toISODate()!;
export function validDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid;
}
export const addDays = (date: string, days: number) => DateTime.fromISO(date, { zone: ZONE }).plus({ days }).toISODate()!;
export function dateLabel(date: string, format = 'ccc d LLL') {
  return DateTime.fromISO(date, { zone: ZONE, locale: 'en-GB' }).toFormat(format);
}
export function checkedLabel(iso: string | null) {
  return iso ? DateTime.fromISO(iso, { zone: ZONE, locale: 'en-GB' }).toFormat('d LLL yyyy, HH:mm') : 'Not yet checked';
}
export type Period = 'today' | 'weekend' | '7' | '30' | 'custom';
export function periodRange(period: Period, date = today()): [string, string] {
  if (period === 'today') return [date, date];
  if (period === 'weekend') {
    const day = DateTime.fromISO(date).weekday;
    const start = day >= 6 ? date : addDays(date, 6 - day);
    return [start, addDays(start, day === 7 ? 0 : 1)];
  }
  return [date, addDays(date, period === '7' ? 6 : 29)];
}
