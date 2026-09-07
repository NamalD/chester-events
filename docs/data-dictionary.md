# Domain glossary and data dictionary

Checked against the implementation on **7 September 2026**. This describes the current stored data and behaviour; the [collection plan](collection-plan.md) also contains proposals that are not implemented.

The field definitions live in [model.ts](../src/lib/model.ts). Behaviour is implemented in [normalization and merging](../scripts/normalize.ts), [source refresh](../scripts/pipeline.ts), [collection](../scripts/collect.ts), and [event filtering](../src/lib/events.ts). Update this document when those contracts change.

## What is Chester BID?

**BID means Business Improvement District.** Chester BID is a business-led, not-for-profit organisation established in 2014 to improve a defined area of Chester city centre. Member businesses contribute annually to fund projects that enhance the city centre, support businesses and promote the area. It was renewed for a third five-year term in 2024 through a ballot of city-centre businesses. See [Chester BID’s official explanation](https://www.chesterbid.co.uk/about/) (checked 7 September 2026).

In this project, **Chester BID is an event-listing source** with the ID `chester-bid`. The collector reads its [events feed](https://www.chesterbid.co.uk/wp-json/tribe/events/v1/events), and source links point visitors to its [event listings](https://www.chesterbid.co.uk/events/). A listing published by Chester BID does not by itself establish who organises the event or prove its location: the collector uses explicit location fields, or the owner-approved source-curation fallback when geographic fields are absent. Its city-centre business district and this app’s Chester/Hoole/Handbridge coverage are separate concepts.

## Domain glossary

| Term | Meaning here |
| --- | --- |
| Event / occurrence | An individual advertised event, performance or session. A multi-day event may occupy one record with a date range. Separate performances should remain separate records. |
| Event series | Related occurrences linked by a source-supplied `seriesId`, such as recurring dance sessions. There is no separate stored series table. |
| Venue | The place where the event happens. Stored as text, not as a separate entity with its own ID. |
| Source / provider | A publisher or service supplying listings, such as Chester BID, a venue calendar, Ticketmaster or Skiddle. It need not be the organiser or venue. |
| Collector | Code that reads a source’s feed/API and converts listings into candidates. |
| Candidate | An intermediate listing awaiting normalization, locality/scope checks and expiry filtering. Defined in `scripts/normalize.ts`; not a separate persisted dataset. |
| Source event | A listing identified by a source ID plus that publisher’s event ID. Several source events can describe the same occurrence. |
| Normalization | Converting different source formats into the shared `EventRecord` shape, cleaning text/URLs, mapping categories and recording uncertainties. |
| Provenance / evidence | The source IDs, links, check time and extracted source facts retained in `sources[]` so a record can be traced back. |
| Deduplication / merge | Combining records with matching source identity, or a shared event/booking URL and matching local start date and time. Title similarity alone does not merge records. |
| Local event | An event with evidence of a Chester, Hoole or Handbridge location in the UK. Current checks use place names, UK evidence, exclusions and coordinate bounds; they are not an administrative boundary map. |
| In scope | Dated local events, excluding business networking and children-only activities; family events are included. Ordinary opening hours and undated bookable experiences are outside the product scope. Automated exclusions use limited text rules. |
| Current event | An event whose known end instant is still ahead; otherwise one whose final advertised local day has not passed. Undated records are retained for separate display. This does not mean the event is confirmed or available to book. |
| Stale | Retained information that needs rechecking. A failed refresh or disappearing listing can make a record stale; the UI also checks the age of its evidence. |
| Uncertain details | A browsing filter for records with issues, including stale evidence. It is a quality indicator, not an event topic. |
| Canonical URL | A cleaned event or booking URL used as a matching signal. Cleaning removes fragments and common tracking parameters; it does not resolve redirects or prove two pages equivalent. |
| Tribe | The `tribe` collector kind for The Events Calendar WordPress JSON endpoints. |
| iCalendar / iCal | A calendar interchange format read by the `ical` collector; it can describe recurring events and exceptions. |
| UTC / Europe/London | UTC represents an absolute instant. `Europe/London` supplies local dates/times and handles British summer-time changes. |

## Where the data lives

| File | Shape and purpose |
| --- | --- |
| [src/data/events.json](../src/data/events.json) | `EventData`: merged events consumed by the website, plus schema/update metadata. |
| [src/data/source-events.json](../src/data/source-events.json) | `EventRecord[]`: normalized records before cross-source merging, retained for future refreshes. These are not raw provider responses. |
| [src/data/source-status.json](../src/data/source-status.json) | `SourceStatus[]`: collection outcomes and coverage diagnostics for each source. |
| [src/lib/sources.ts](../src/lib/sources.ts) | `Source[]`: configured publishers, collector kinds and endpoints. |

`null` means unknown, unavailable or deliberately withheld because it is unreliable; it does not mean zero, free or cancelled. An optional field may be absent altogether. Dates use `YYYY-MM-DD`, local times use 24-hour `HH:mm`, and app-generated timestamps use ISO 8601 with a UTC offset/`Z`. Source-original strings may use provider-specific formats. Examples below illustrate formats, not verified listings.

## EventData — published dataset

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | number, currently `1` | Stored-data format version. |
| `lastSuccessfulUpdate` | timestamp or null | Collection run time when at least one source succeeded. Retains its previous value if none succeeds; does not mean every source is healthy. |
| `events` | `EventRecord[]` | Merged current and undated records, including retained stale records. |

## EventRecord — normalized event

| Field | Type / example | Meaning |
| --- | --- | --- |
| `id` | string; 16 hexadecimal characters | First 16 characters of a SHA-256 hash of `source.id:candidate.id`. A merged record keeps the first record’s ID; this is not a source-independent occurrence identifier. |
| `title` | string | Plain-text title, trimmed and capped at 180 characters. |
| `description` | string | Source-derived plain text, capped at 280 characters; empty string when unavailable. |
| `startDate` | date or null; `2026-09-11` | Start day in London time, or a usable source date when the time cannot be parsed. Null places the event among undated records. |
| `endDate` | date or null | Advertised final local day, used inclusively for date overlap. Invalid/reversed ranges may have the end cleared. No duration is invented when missing. |
| `startTime` | time or null; `20:00` | London local start time. Null for all-day/date-only records or an unparseable time. A displayed time may still carry a warning; consult `issues`. |
| `startUtc` | timestamp or null; `2026-09-11T19:00:00.000Z` | Absolute start instant. Withheld for date-only events, unresolved daylight-saving ambiguity or source-time conflicts. |
| `endUtc` | timestamp or null | Absolute end instant when available and usable. Used to determine when an event expires. |
| `timezone` | string or null | Currently `Europe/London` when a start date is available, otherwise null. The source timezone is retained separately in evidence. |
| `allDay` | boolean | Whether the source identifies an all-day event. False with a null time means the time is unknown, not that the event lasts all day. |
| `venue` | string or null | Cleaned venue name, capped at 150 characters. |
| `address` | string or null | Cleaned location/address text, capped at 220 characters. |
| `latitude` | number or null | Source-supplied latitude in degrees. |
| `longitude` | number or null | Source-supplied longitude in degrees. |
| `categories` | `Category[]` | Mapped topic labels; several may apply. Unmatched source categories produce `Other`. |
| `price` | string or null | Cleaned source price text, capped at 100 characters. No separate numeric amount, currency or fee fields. Null is displayed as “Price not listed.” |
| `status` | enum below | Normalized event state. Defaults to `scheduled` when no recognized state is supplied. |
| `issues` | string[] | Human-readable uncertainty/conflict messages. Empty means no recorded issues, not independently verified completeness. These are not stable machine-readable codes. |
| `stale` | boolean | Persisted flag for a retained record that was not freshly verified. The UI can also infer staleness from evidence age. |
| `seriesId` | string or null | Source-provided identifier linking recurring occurrences; not guaranteed globally unique across sources. |
| `sources` | `Evidence[]` | Supporting source listings and booking links. Normalization supplies one entry; merging may add more. |

### Event status values

| Value | Meaning |
| --- | --- |
| `scheduled` | Default state, including missing/unrecognized source status. Does not guarantee confirmation or ticket availability; an `offsale` value alone remains scheduled. |
| `cancelled` | Source status indicates cancellation. |
| `postponed` | Source status indicates postponement. |
| `rescheduled` | Source status indicates rescheduling; there is no separate previous-date field. |
| `sold_out` | Source status explicitly indicates sold out. |

Disappearance from a feed does not imply cancellation. If still current, an unseen previous listing can be retained as stale. Expiry checks use dates/times, not the event status.

### Category values

The allowed values are `Music`, `Dance`, `Food & Drink`, `Vegan`, `Arts & Culture`, `Community`, `Markets & Fairs`, `Nightlife`, `Outdoors`, `Other`, and `Uncertain details`.

Topic categories are mapped from source labels using keyword rules. The `Vegan` mapping requires an explicit matching vegan label; food or wine alone is insufficient. `Uncertain details` is allowed by the type but is currently added to filter matching dynamically when the record has issues or needs rechecking, rather than assigned by the normalizer.

## Evidence — where event facts came from

| Field | Type | Meaning |
| --- | --- | --- |
| `sourceId` | string | Joins to `Source.id`, for example `chester-bid`. |
| `sourceEventId` | string | Publisher/collector identifier for the listing or occurrence; interpreted together with `sourceId`. |
| `url` | string | Cleaned HTTP(S) event/source link. |
| `bookingUrl` | string or null | Cleaned HTTP(S) booking link, when provided and valid. |
| `checkedAt` | timestamp | Collection run time associated with successfully obtaining this evidence, not the provider’s modification time. |
| `original` | object below | Selected extracted facts before final normalization. Not a byte-for-byte source archive: title, venue and address have already been cleaned/capped. |

### Evidence.original

| Field | Type | Meaning |
| --- | --- | --- |
| `title` | string | Cleaned source title. |
| `utcStart` / `utcEnd` | optional string or null | Source-supplied UTC start/end values; may be absent in older records. |
| `start` / `end` | string or null | Extracted source start/end values before conversion to London time. |
| `timezone` | string or null | Source-supplied timezone. |
| `venue` / `address` | string or null | Cleaned source venue/address. |
| `categories` | string[] | Source category labels before app-category mapping. |
| `price` | string or null | Source price text before final text normalization. |
| `status` | string or null | Source status before enum mapping. |
| `modified` | string or null | Provider’s modification value, when supplied; format depends on the provider. |

## Source — collector configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Stable internal publisher key. Used by event evidence and source status. |
| `name` | string | Display name, such as `Chester BID`. |
| `url` | string | Public source/calendar page. |
| `endpoint` | string | API/feed URL, or calendar discovery page for the iCalendar collector. |
| `kind` | `tribe`, `ical`, `ticketmaster`, `skiddle` | Selects the collector implementation. |
| `key` | optional string | Environment-variable name for a credential, such as `SKIDDLE_API_KEY`; not the credential value. |

Configured source IDs are `chester-bid`, `telfords-warehouse`, `that-beer-place`, `cheshire-swing-cats`, `ticketmaster-discovery`, and `skiddle`. Configuration does not imply a source is healthy or has contributed events; check its status.

## SourceStatus — collection health and coverage

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Joins to `Source.id`. |
| `state` | enum below | Outcome for this source, separate from an event’s `status`. |
| `lastAttempt` | timestamp or null | Latest run that processed this source, including a skip for missing configuration. Null if no attempt is recorded. |
| `lastSuccess` | timestamp or null | Latest successful collection, including successful empty results. Null if none is recorded. |
| `count` | number | On success, freshly verified current records, excluding stale retained listings. On error or missing configuration, the number of retained current records. Not a global unique-event count. |
| `message` | string | Human-readable outcome/diagnostics, suitable for display. |
| `parserVersion` | string | Version marker assigned by the refresh pipeline; currently `1.2.0`. |
| `candidates` | optional number | Listings returned by the collector before normalization/filtering, supplied on successful collection. |
| `excluded` | optional object | Successful-run exclusion counts: `locality`, `scope`, `expired` (defined below). |

| State | Meaning |
| --- | --- |
| `ok` | Collection and normalization completed, possibly with zero accepted events. |
| `error` | Fetching, parsing or validation failed; current previous records are retained as stale. |
| `not_configured` | Optional provider credential is unavailable; current previous records are retained as stale. |
| `not_checked` | Representable initial/unattempted state; the current refresh function produces one of the other three states. |

`excluded.locality` counts candidates whose Chester locality could not be verified, including missing evidence as well as out-of-area locations. `excluded.scope` counts local candidates rejected by event-scope rules. `excluded.expired` counts otherwise accepted events that have ended. These counts describe this collector’s returned candidates, not all events on the publisher’s website.

## Interpretation rules and current limitations

- **Freshness:** the UI treats a record as stale when `stale` is true or every evidence entry is more than three days old. This adds “Source needs rechecking” to displayed issues.
- **Dates and times:** date-only records do not acquire invented midnight instants. Missing end times do not acquire invented durations. With no usable end instant, records remain current through `endDate` or `startDate`; undated records remain current.
- **Merging:** the first record’s main fields are retained. Different nonempty start dates, start times, venues, prices or statuses add conflict messages. Categories and distinct evidence entries are combined. There is no automatic authoritative-source selection or complete per-field provenance map.
- **Recurrence:** collectors may expand supported recurring occurrences within their collection window; a `seriesId` alone is not a recurrence rule or proof of future sessions. The collection run requests today through 90 days ahead.
- **Locality:** current coordinate checks use latitude 53.16–53.225 and longitude −2.94–−2.84 when both are supplied, alongside textual checks. A provider search radius is insufficient evidence. Chester BID has an explicit owner-approved `trustedLocality` configuration; missing geographic fields may use this curated-source evidence, recorded as `sources[].localityBasis: source-curation`. Explicit conflicting locations still reject.
- **Doors versus performance:** there are no separate stored time fields for these. The Skiddle collector currently flags a supplied doors time with “Listed time is doors opening.”
- **Separate entities:** organisers, venues, prices and series do not have dedicated stored entity tables. Proposed interest tags in the collection plan are not the implemented category enum.

See [MVP scope](mvp-scope.md) for product decisions and [the collection plan](collection-plan.md) for wider proposals.
