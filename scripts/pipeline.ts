import type { EventRecord, Source, SourceStatus } from '../src/lib/model.ts';
import { isCurrent } from '../src/lib/events.ts';
import { normalize, candidateIsLocal, type Candidate } from './normalize.ts';
import { CollectionError } from './http.ts';

export async function refreshSource(source: Source, previous: EventRecord[], previousStatus: SourceStatus | undefined,
  collect: () => Promise<Candidate[]>, now: Date, configured = true): Promise<{ records: EventRecord[]; status: SourceStatus }> {
  const checkedAt = now.toISOString();
  const retained = previous.filter(event => isCurrent(event, now));
  const base = { id: source.id, lastAttempt: checkedAt, lastSuccess: previousStatus?.lastSuccess ?? null, parserVersion: '1.2.0' };
  if (!configured) return { records: retained.map(event => ({ ...event, stale: true })), status: {
    ...base, state: 'not_configured', count: retained.length, message: 'Optional provider key not configured',
  } satisfies SourceStatus };
  try {
    const candidates = await collect();
    const excluded = { locality: 0, scope: 0, expired: 0 };
    const seen = new Set(candidates.map(candidate => String(candidate.id)));
    const records: EventRecord[] = [];
    for (const candidate of candidates) {
      const event = normalize(candidate, source, checkedAt);
      if (!event) {
        const local = candidateIsLocal(candidate, source);
        excluded[local ? 'scope' : 'locality']++;
      } else if (!isCurrent(event, now)) excluded.expired++;
      else records.push(event);
    }
    const ids = new Set(records.map(event => event.id));
    // Disappearance is not cancellation: keep a still-future occurrence, visibly stale.
    records.push(...retained.filter(event => !ids.has(event.id) && !event.sources.some(evidence => evidence.sourceId === source.id && seen.has(evidence.sourceEventId))).map(event => ({ ...event, stale: true })));
    return { records, status: { ...base, lastSuccess: checkedAt, state: 'ok', candidates: candidates.length, excluded, count: records.filter(event => !event.stale).length,
      message: `${records.filter(event => !event.stale).length} current local events verified${excluded.locality ? `; ${excluded.locality} listings excluded because Chester locality could not be verified` : ''}${excluded.scope ? `; ${excluded.scope} outside event scope` : ''}${records.some(event => event.stale) ? '; missing listings retained for rechecking' : ''}`,
    } satisfies SourceStatus };
  } catch (error) {
    return { records: retained.map(event => ({ ...event, stale: true })), status: {
      ...base, state: 'error', count: retained.length,
      // Never serialize provider payloads, stack traces, request URLs or secret-bearing errors.
      message: error instanceof CollectionError ? error.message : 'Feed validation failed; previous future events retained',
    } satisfies SourceStatus };
  }
}
