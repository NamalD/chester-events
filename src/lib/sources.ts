import type { Source } from './model';

export const sources: Source[] = [
  { id: 'chester-bid', trustedLocality: 'Chester, UK', name: 'Chester BID', url: 'https://www.chesterbid.co.uk/events/', endpoint: 'https://www.chesterbid.co.uk/wp-json/tribe/events/v1/events', kind: 'tribe' },
  { id: 'telfords-warehouse', name: 'Telford’s Warehouse', url: 'https://www.telfordswarehousechester.com/gigs-live-events-music/', endpoint: 'https://www.telfordswarehousechester.com/wp-json/tribe/events/v1/events', kind: 'tribe' },
  { id: 'that-beer-place', name: 'That Beer Place', url: 'https://thatbeerplace.co.uk/events/', endpoint: 'https://thatbeerplace.co.uk/wp-json/tribe/events/v1/events', kind: 'tribe' },
  { id: 'cheshire-swing-cats', name: 'Cheshire Swing Cats', url: 'https://www.cheshireswingcats.com/events', endpoint: 'https://www.cheshireswingcats.com/events', kind: 'ical' },
  { id: 'ticketmaster-discovery', name: 'Ticketmaster', url: 'https://www.ticketmaster.co.uk/', endpoint: 'https://app.ticketmaster.com/discovery/v2/events.json', kind: 'ticketmaster', key: 'TICKETMASTER_API_KEY' },
  { id: 'skiddle', name: 'Skiddle', url: 'https://www.skiddle.com/whats-on/Chester/', endpoint: 'https://www.skiddle.com/api/v1/events/search/', kind: 'skiddle', key: 'SKIDDLE_API_KEY' },
];
export const sourceName = (id: string) => sources.find(source => source.id === id)?.name ?? id;
