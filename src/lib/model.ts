export const categories = ['Music', 'Dance', 'Food & Drink', 'Vegan', 'Arts & Culture', 'Community', 'Markets & Fairs', 'Nightlife', 'Outdoors', 'Other', 'Uncertain details'] as const;
export type Category = typeof categories[number];

export interface Source {
  id: string;
  name: string;
  url: string;
  endpoint: string;
  kind: 'tribe' | 'ical' | 'ticketmaster' | 'skiddle';
  key?: string;
  trustedLocality?: 'Chester, UK';
}
export interface SourceStatus {
  id: string;
  state: 'ok' | 'error' | 'not_configured' | 'not_checked';
  lastAttempt: string | null;
  lastSuccess: string | null;
  count: number;
  message: string;
  parserVersion: string;
  candidates?: number;
  excluded?: { locality: number; scope: number; expired: number };
}
export interface Evidence {
  sourceId: string;
  sourceEventId: string;
  url: string;
  bookingUrl: string | null;
  checkedAt: string;
  localityBasis?: 'source-curation';
  original: {
    title: string;
    utcStart?: string | null;
    utcEnd?: string | null;
    start: string | null;
    end: string | null;
    timezone: string | null;
    venue: string | null;
    address: string | null;
    categories: string[];
    price: string | null;
    status: string | null;
    modified: string | null;
  };
}
export interface EventRecord {
  id: string;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  startUtc: string | null;
  endUtc: string | null;
  timezone: string | null;
  allDay: boolean;
  venue: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: Category[];
  price: string | null;
  status: 'scheduled' | 'cancelled' | 'postponed' | 'rescheduled' | 'sold_out';
  issues: string[];
  stale: boolean;
  seriesId: string | null;
  sources: Evidence[];
}
export interface EventData {
  schemaVersion: 1;
  lastSuccessfulUpdate: string | null;
  events: EventRecord[];
}
