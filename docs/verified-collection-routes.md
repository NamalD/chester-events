# Verified collection routes

Checks performed **6 September 2026**. These were small, unauthenticated HTTP GET requests and HTML inspections, not a full crawl or completeness audit. Counts are snapshots. A successful response verifies technical accessibility at that moment, not ongoing availability or redistribution permission.

## Working feeds and APIs

Additional checks for Fika, Pink Lettuce and Shrub are recorded in the [priority venue investigation](priority-vegan-venues.md): two working but old editorial feeds and a successful BID query for a historical Shrub workshop. These do not establish current public-event coverage.

| Source / exact tested URL | Result | Meaning |
| --- | --- | --- |
| [Telford’s events JSON](https://www.telfordswarehousechester.com/wp-json/tribe/events/v1/events?per_page=2) | HTTP 200, `application/json`; keys included `events`, `next_rest_url`, `total`, `total_pages` | Two sampled records included IDs, titles, local start/end fields and canonical URLs. Follow pagination for a complete requested window. |
| [Telford’s calendar export](https://www.telfordswarehousechester.com/gigs-live-events-music/?ical=1) | HTTP 200, `text/calendar`; 26 `VEVENT` blocks | Working iCalendar export. Export count alone does not establish its horizon or equivalence to the full JSON calendar. |
| [Chester BID events JSON](https://www.chesterbid.co.uk/wp-json/tribe/events/v1/events?per_page=2) | HTTP 200, `application/json`; `total: 450` | Returned two dated records. Treat the total as API records under its default query, not unique events or guaranteed relevant coverage. |
| [That Beer Place events JSON](https://thatbeerplace.co.uk/wp-json/tribe/events/v1/events?per_page=2) | HTTP 200, `application/json`; `total: 0`, empty sample | Working endpoint with no upcoming records returned. Public calendar likewise showed no upcoming events. |
| [Swing Cats individual export](https://www.cheshireswingcats.com/events/lindy-hop-dance-classes-return-t9624?format=ical) | HTTP 200, `text/calendar`; one `VEVENT` | At least one linked individual export works. Enumerate detail-page links; no whole-calendar subscription feed was tested. |
| [The Chester Blog RSS](https://thechesterblog.com/feed/) | HTTP 200, `application/rss+xml`; 10 items | Useful article-discovery feed. Its item timestamps are publication timestamps, not structured event dates. |

### Small sample of returned fields

These illustrate feasibility; they are not a production import or a complete record schema.

| Source | Source ID | Title | Returned `start_date` |
| --- | --- | --- | --- |
| Telford’s | `5955` | The Telford’s Quiz | `2026-09-07 20:30:00` |
| Telford’s | `5947` | The Paint Republic | `2026-09-08 19:00:00` |
| Chester BID | `10001888` | BIG FAT QUIZ ON THE ROOF | `2026-09-06 19:00:00` |
| Chester BID | `10002256` | The Coach House Quiz Night | `2026-09-07 19:30:00` |

Sample timestamps above do not carry an offset. Inspect and use each record’s timezone/UTC fields during implementation rather than parsing them as machine-local time.

## HTML observations

| Page | Observed | What remains unverified |
| --- | --- | --- |
| [Telford’s calendar](https://www.telfordswarehousechester.com/gigs-live-events-music/) | Event JSON-LD plus advertised iCalendar, RSS and `tribe/events/v1` routes | Full schema correctness, cancellation semantics and all pagination |
| [Chester BID calendar](https://www.chesterbid.co.uk/events/) | Event JSON-LD, events RSS link and `tribe/events/v1` route | RSS content and complete recurrence behaviour |
| [That Beer Place calendar](https://thatbeerplace.co.uk/events/) | Advertised iCalendar, events RSS and `tribe/events/v1` route | Calendar/RSS payloads and when new events will be added |
| [Swing Cats events](https://www.cheshireswingcats.com/events) | Many individual `?format=ical` links | Every export, complete future coverage and recurrence handling |
| [Alexander’s homepage](https://www.alexanderslive.com/) | Branded See Tickets search link and generic WordPress feed/API links; homepage JSON-LD did not match an Event type | Whether WordPress exposes useful event objects; ticket-page extraction |
| [Live Rooms homepage](https://www.theliverooms.com/) | Venue event detail links, See Tickets links and generic WordPress API links | Event-specific API and detail-page structured data |
| [Books on the Walls homepage](https://booksonthewalls.com/) | Dated event text, `/events-2025` and `/events-2026` links, some Eventbrite links; no JSON-LD scripts found | Archive completeness and whether other pages contain structured data |
| [Chester Market listings](https://newchester.market/whats-on/) | Readable dates/times and event links; schema types found on listing page were general page/site types | Detail-page schema and any event-specific API |
| [Storyhouse listings](https://www.storyhouse.com/whats-on/) | HTTP 200 and no matching schema types in the simple HTML check | Dynamic data, detail-page schema, ticket-system integration |

The schema checks were simple text inspections, not comprehensive schema validation. Absence on a homepage says nothing definitive about detail pages or rendered JavaScript. A `/wp-json/` link alone is not proof of an event API.

## Access limitations

- Both user-supplied Instagram URLs failed in the research browser. Their live posts were not inspected. Life in Chester’s [Linktree](https://linktr.ee/lifeinchester) was independently readable.
- [Eventbrite Chester browsing](https://www.eventbrite.co.uk/d/united-kingdom--chester/events/) returned HTTP 405. Individual indexed event pages still provided useful organiser evidence.
- Meta’s Business Discovery documentation returned HTTP 429. Its detailed applicability to the requested accounts remains unresolved.
- No API keys were used. No national-provider results were counted and no billing/approval assumptions were tested.
- No site-wide robots/terms review or publisher reuse agreement was completed. Do that when choosing a production collector; the research has not established a licence to mirror descriptions or images.

## Reproducible minimal read

These are the same public endpoint shapes tested above:

```bash
curl --fail --silent --show-error 'https://www.telfordswarehousechester.com/wp-json/tribe/events/v1/events?per_page=2'
curl --fail --silent --show-error 'https://www.chesterbid.co.uk/wp-json/tribe/events/v1/events?per_page=2'
curl --fail --silent --show-error 'https://thechesterblog.com/feed/'
```

For a real collector, request explicit date windows, paginate, cache responses and validate records before display. Do not assume the default query stays the same over time.
