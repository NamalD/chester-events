import { readFile, writeFile, rename } from 'node:fs/promises';
import { sources } from '../src/lib/sources.ts';
import { today, addDays } from '../src/lib/dates.ts';
import type { EventData, EventRecord, SourceStatus } from '../src/lib/model.ts';
import { mergeEvents } from './normalize.ts';
import { HttpClient } from './http.ts';
import { collectTribe, collectSwing, collectTicketmaster, collectSkiddle } from './collectors.ts';
import { refreshSource } from './pipeline.ts';

const now = new Date();
const from = today(now), to = addDays(from, 90);
const http = new HttpClient(process.env.CHESTER_EVENTS_USER_AGENT || 'ChesterEventsBot/1.0 (+https://github.com/NamalD/chester-events)');
const oldData: EventData = JSON.parse(await readFile('src/data/events.json', 'utf8'));
const oldStatuses: SourceStatus[] = JSON.parse(await readFile('src/data/source-status.json', 'utf8'));
const oldRecords: EventRecord[] = JSON.parse(await readFile('src/data/source-events.json', 'utf8'));
if (oldData.schemaVersion !== 1 || !Array.isArray(oldRecords) || !Array.isArray(oldStatuses)) throw new Error('Unsupported stored data; refusing to overwrite');
const records: EventRecord[] = [], statuses: SourceStatus[] = [];
for (const source of sources) {
  const key = source.key ? process.env[source.key] : undefined;
  const result = await refreshSource(source, oldRecords.filter(event => event.sources[0].sourceId === source.id), oldStatuses.find(status => status.id === source.id), () => {
    if (source.kind === 'tribe') return collectTribe(source, http, from, to);
    if (source.kind === 'ical') return collectSwing(source, http, from, to);
    if (source.kind === 'ticketmaster') return collectTicketmaster(source, http, from, to, key!);
    return collectSkiddle(source, http, from, to, key!);
  }, now, !source.key || !!key?.trim());
  records.push(...result.records);
  statuses.push(result.status);
  console.log(`${source.id}: ${result.status.state} — ${result.status.message}`);
}
const data: EventData = { schemaVersion: 1, lastSuccessfulUpdate: statuses.some(status => status.state === 'ok') ? now.toISOString() : oldData.lastSuccessfulUpdate, events: mergeEvents(records) };
// Stage every document before replacing any: parser/network failures cannot truncate committed data.
const outputs = [['src/data/events.json', data], ['src/data/source-events.json', records], ['src/data/source-status.json', statuses]] as const;
for (const [path, value] of outputs) await writeFile(`${path}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
for (const [path] of outputs) await rename(`${path}.tmp`, path);
console.log(`Published ${data.events.length} current events. ${statuses.filter(status => status.state === 'ok').length}/${sources.length} sources checked successfully.`);
// A degraded run still publishes its status and retained events; CI deploys this useful result.
