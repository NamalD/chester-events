# Initial source allowlist

This is the MVP collector allowlist. It intentionally starts with routes that were technically verified during research, plus free API providers that activate only after a key is supplied. Do not add an unlisted source to the automated collector until its current access rules, feed/API behaviour and field quality are checked.

## Enabled without credentials

| Source ID | Source | Route | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `chester-bid` | [Chester BID](https://www.chesterbid.co.uk/events/) | [`/wp-json/tribe/events/v1/events`](https://www.chesterbid.co.uk/wp-json/tribe/events/v1/events?per_page=2) | Broad Chester city-centre events | Tested JSON endpoint. Filter to Chester/Hoole/Handbridge and exclude business networking and children-only events. |
| `telfords-warehouse` | [Telford’s Warehouse](https://www.telfordswarehousechester.com/gigs-live-events-music/) | [`/wp-json/tribe/events/v1/events`](https://www.telfordswarehousechester.com/wp-json/tribe/events/v1/events?per_page=2) | Music, quizzes and participatory events | Tested JSON endpoint. Preserve source ID, canonical link and original time; validate unusual start times. |
| `that-beer-place` | [That Beer Place](https://thatbeerplace.co.uk/events/) | [`/wp-json/tribe/events/v1/events`](https://thatbeerplace.co.uk/wp-json/tribe/events/v1/events?per_page=2) | Tastings, comedy and music | Tested endpoint returned zero future events. Keep polling: an empty response is valid. |
| `cheshire-swing-cats` | [Cheshire Swing Cats](https://www.cheshireswingcats.com/events) | Linked individual `?format=ical` downloads | Dance classes, socials and workshops | Individual iCalendar output was tested. Include only events actually in Chester, Hoole or Handbridge. |

## Enabled when a free key is present

| Source ID | Provider | Secret | Route | Behaviour without key |
| --- | --- | --- | --- | --- |
| `ticketmaster-discovery` | [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | `TICKETMASTER_API_KEY` | `/discovery/v2/events.json` | Skip and record `not_configured`; do not fail the scheduled update. |
| `skiddle` | [Skiddle API](https://www.skiddle.com/api/) | `SKIDDLE_API_KEY` | Provider Events API | Skip and record `not_configured`; do not fail the scheduled update. |

Both keys are free to apply for, but neither has been requested or tested. The collector must use a short future window and Chester-specific location matching, then merge clear duplicates with direct venue sources.

## Discovery-only sources for the MVP

These should not automatically create public events yet. They remain useful when researching or manually improving the pipeline:

- [The Chester Blog RSS](https://thechesterblog.com/feed/): an article feed; its publish dates are not event dates.
- [Fika+ Events](https://www.fikachester.co.uk/events-1): a venue event page whose visible entry was historical when checked.
- [Books on the Walls](https://booksonthewalls.com/): useful dated listings and ticket links, but no tested structured event feed.
- [Chester Market What’s On](https://newchester.market/whats-on/): readable event pages, but no tested feed/API.
- Official Instagram accounts, including Fika, Pink Lettuce and Shrub: useful manually but no verified permitted automated collection route.

## Explicitly deferred

See [future improvements](future-improvements.md) for paid, restricted, partner-only and unresolved providers, including Meetup, Eventbrite public discovery, Songkick, PredictHQ, Bandsintown, See Tickets and Ticket Tailor.

## Collection requirements

- Send a descriptive User-Agent identifying Chester Events and linking to its public repository.
- Fetch explicit future windows and paginate.
- Preserve future records from a source that fails a fetch; record the failure and last successful check.
- Remove records after their end time; treat missing end time conservatively.
- Keep raw source facts and provenance so uncertainty labels and merged sources remain explainable.
- Do not infer price, timezone, end time, venue or event category.
- Do not include events outside Chester, Hoole or Handbridge.
