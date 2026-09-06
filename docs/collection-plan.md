# Suggested collection plan

This is a proposed next step based on the research, not an implemented application. Start with a useful Chester-only collection, then measure what additional sources contribute.

**Agreed scope:** a reliable subset of dated events plus shared-link additions is sufficient for the first version. Paid/restricted integrations, unresolved automated collection routes and bookable experiences are deferred to [future improvements](future-improvements.md). Earlier suggestions about experiences in the venue research are future options, not MVP requirements.

## First collection set

1. **Import Telford’s and Chester BID through their tested public JSON endpoints.** Keep source IDs and original URLs. Compare a sample with their calendars before enabling regular refreshes.
2. **Add the direct listings at Alexander’s, The Live Rooms, Storyhouse, Books on the Walls, Chester Market and Pickles.** Start with readable event text and ticket links; validate detail pages and pagination before writing a collector for each site.
3. **Deliberately fill the interest gaps:** Cheshire Swing Cats for dancing, Vegan Market Co for vegan events, and Life in Chester plus The Chester Blog for small creative and community discoveries. The blog RSS can generate review candidates; articles should not automatically become events.
4. **Provide an “add event URL” route for friends.** It can create a draft with a link, title, date, venue and tags. This makes social discoveries useful without depending on continuous Instagram access.
5. **Trial Skiddle, then Ticketmaster**, once keys and intended-use terms are settled. Add a provider only if its validated additional events justify the integration.

**Priority venue follow-up:** include [Fika+, Pink Lettuce and Shrub](priority-vegan-venues.md) from the start as favourites/watchlist entries. Monitor Fika’s own event pages, match Shrub in BID data and partner listings, and review all three official Instagram accounts manually. For Pink Lettuce, separate advance-booked dining from dated public events. None should be dropped solely because a current calendar is empty or unavailable.

## Source refresh proposals

These are starting intervals to tune to each publisher’s guidance and actual change rate, not provider limits.

| Source type | Suggested cadence | Follow-up |
| --- | --- | --- |
| Working local event feeds | Daily | Recheck saved events close to their start for changed times or status |
| Venue HTML calendars | Daily or every few days | Use cache headers where available; slow down on errors and respect publisher limits |
| Blog RSS / link pages | Daily RSS; a few times weekly for links | Queue dated event leads for review |
| Social-only leads | Manual weekly check or friend submission | Link to a public announcement and verify date/location |
| Annual festivals | Monthly off-season, weekly around announcements | Keep the edition year explicit |
| An empty but working calendar | Weekly initially | Distinguish “zero events” from a broken parser or failed request |

## Store enough information to correct mistakes

| Record | Suggested fields |
| --- | --- |
| Source | Stable source ID, name, URLs, type, chosen method, access/reuse notes, last successful fetch, last attempt, parser version |
| Source event | Source event ID, canonical URL, original title, original date/time text, source timestamp if provided, fetched time, relevant extracted facts |
| Normalised event | App ID, title, concise summary, venue/address, coordinates, category tags, local start/end, timezone, date precision, status, booking URL, price/currency where known |
| Provenance | All matching source URLs/IDs, which source supplied each important field, last verification, unresolved conflicts |
| Event series | Parent/series ID, verified recurrence, bounded occurrence dates, exceptions and overrides |

Use `Europe/London` for confirmed Chester local times while retaining any timezone supplied by the source. Store UTC instants as well when the time is known; do not invent midnight for a date-only event. Retain doors time and performance time separately when available.

## Matching and quality rules

- **Match actual location.** Confirm Chester, UK from address and coordinates; search results also include Chester County, Chester-le-Street and Chichester. Hoole and Handbridge belong in the local collection. Keep Kelsall, Malpas and wider regional events visibly separate. Do not silently treat a provider’s large search radius as the app boundary.
- **Use an occurrence model.** One event page can contain a series, a multi-day exhibition or several performances. Keep these distinct. Do not generate unlimited weekly events from an undated “every Wednesday” page; verify the programme and bound its validity.
- **Deduplicate with evidence.** Shared ticket IDs or canonical URLs are strong matches. Otherwise use normalised title, venue and start time as candidate signals, with review for ambiguous matches. Do not merge two screenings or two gigs simply because the artist and venue match.
- **Keep attendance meetups distinct where useful.** A Meetup group gathering before a public gig has its own meeting time and joining requirements. Link it to the underlying gig rather than losing either record.
- **Prefer direct confirmation for disputed facts.** Start with the organiser/venue and relevant ticket seller, then inspect which was updated and what the time means. Retain conflicts instead of silently choosing the newest fetched page.
- **Do not infer cancellation from disappearance.** A page may leave a short listing window, sell out or fail to load. Mark failed verification and recheck; use an explicit cancellation/reschedule notice for status changes.
- **Keep unknown values unknown.** No price is not “free”; no end time is not a two-hour duration; “TBC” is not confirmed. Keep booking fees and sold-out status where explicitly available.
- **Exclude non-events.** Donation pages, membership products, ticket insurance, meal pre-orders, private room hire and ordinary opening hours can appear beside actual tickets. Classify them before import.
- **Use separate interest tags.** `live-music`, `dance-social`, `dance-class`, `vegan-event`, `vegan-options`, `food-tasting`, `workshop`, `comedy`, `books`, `nature`, `games` and `unusual` are a useful initial vocabulary. A wine tasting with cheese is not a vegan event without explicit evidence.
- **Treat posters as drafts.** OCR or model extraction can help with image-only programmes, but a person should verify year, AM/PM, venue and price against the image and booking link.

## Real examples the pilot should handle

| Observation from the research | Expected treatment |
| --- | --- |
| Telford’s lists The Weekenders on 11 September with an 08:00 start | Flag the unusual time; check the event/ticket detail instead of changing it to 20:00 automatically. [Calendar](https://www.telfordswarehousechester.com/gigs-live-events-music/). |
| Storyhouse community pages show date ranges and recurring activities | Expand only supported occurrences; retain exclusions and actual session times. [Community calendar](https://www.storyhouse.com/whats-on/genres/community-events/). |
| Chester.com listings include pre-order food and donation products | Exclude these from the event feed or link them as optional extras. [Example listing collection](https://chester.com/things-to-do/nightlife-in-chester/). |
| That Beer Place’s upcoming calendar and API are empty | Successful fetch with zero candidates, not an ingestion error and not proof the venue has closed. [Calendar](https://thatbeerplace.co.uk/events/). |
| The Chester Blog publishes a theatre-season announcement | Extract the production dates from the article/organiser, not the blog publication date. [Blog](https://thechesterblog.com/). |
| A festival calls itself “Chester” but is in Kelsall | Show it under nearby events and label its location. [Organiser](https://www.chesterfolk.org.uk/). |

## Measure coverage before adding complexity

For a proposed four-week pilot, manually assemble a reference list from the first collection set and review it weekly. This is a comparison baseline, not a claim of all Chester events. Measure:

- Unique valid upcoming occurrences contributed by each source, broken down by interest.
- Events found only through small organisers, blogs or social submissions.
- Duplicate rate and proportion with confirmed date/time, venue and booking link.
- Changed/cancelled events detected and how quickly the app reflects them.
- Time spent reviewing each source and how often parsing fails.

Evaluate national providers on **additional validated relevant events**, not raw result count. Their performance may differ substantially between music and vegan/community categories.

## Remaining decisions and research

| Next check | Concrete output |
| --- | --- |
| Production access/reuse review for chosen sources | Record the publisher’s supported route, crawl guidance, attribution, caching and display arrangements; ask for a supplied feed if appropriate |
| Local API completeness | Compare explicit future-window pagination against calendars; examine recurrence, timezone and cancellation fields |
| Venue detail pages | Establish which expose Event JSON-LD, reliable date text or booking-system links |
| Skiddle / Ticketmaster trial | Same geographic area and dates, with a per-interest incremental coverage report |
| Smaller dance and vegan organisers | Verify current public pages for LATINMania, Vegartemis and social-group leads; prioritise actual scheduled events |
| Geography preference | Decide whether nearby events need a fixed distance, travel-time preference or a manually approved venue list |
| Potential publisher collaboration | Prepare a request for event title, dates, venue, tags, booking link and update/cancellation feed; no messages have been sent |

For initial display, use concise factual summaries with source and booking links. Track image/description permissions separately instead of treating publicly readable content as a blanket republication licence.
