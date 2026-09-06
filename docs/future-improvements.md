# Future improvements

## Agreed MVP boundary

The first version can offer a small, reliable selection of dated events plus a way to add events from shared links. Missing some social-only announcements is acceptable while we iterate.

**Paid/restricted provider integrations, unresolved automated collection routes, and bookable experiences are not required for the MVP.** Public event links from those providers can still be used as references or booking destinations. This does not exclude a venue simply because it sells tickets through one of them.

The items below are a backlog, not commitments to purchase access or implement every integration. Provider constraints reflect the research checked on **6 September 2026**; reassess them before implementation. Supporting evidence is in [APIs and providers](apis-and-providers.md).

## Paid or partnership-based providers

| Provider | Current obstacle from research | What to establish before adding |
| --- | --- | --- |
| Meetup | Pro subscription and API approval required; payment does not guarantee approval | Eligibility, permitted discovery queries, total cost and additional local social events |
| Songkick | Licence fee and partnership agreement; hobbyist projects currently excluded | Whether this app qualifies and whether concert coverage justifies the licence |
| PredictHQ | Subscription-scoped access | Chester sample, relevant small-event coverage, cost and display/reuse terms |
| Bandsintown | Standard keys are artist-specific; wider use needs partnership approval | Eligibility for city-wide use, coverage and negotiated terms; pricing was not verified |

Prefer providers that add relevant events absent from the existing collection. Evaluate additional verified events by interest, freshness, review effort and ongoing cost rather than raw result counts.

## Missing or restricted collection routes

| Source | Future improvement | Limitation to resolve |
| --- | --- | --- |
| Eventbrite | Integrate cooperating organisers or an approved discovery arrangement | Public event-search API is closed; paying for an account is not an established remedy |
| Instagram / Meta | Improve collection of announcements from favourite venues and local accounts | No continuous collection route for the target accounts was verified; check account eligibility, permissions and actual post coverage |
| Facebook and other community channels | Accept organiser-supplied public listings or supported integrations | No general discovery integration verified; private conversations are not event feeds |
| Ticket Tailor | Connect participating organisers’ box offices | Organiser authorisation needed; API does not search all Chester events |
| See Tickets | Obtain a supported venue/provider feed | General public discovery API or feed access was not verified |
| WeGotTickets | Establish supported organiser/event collection | General discovery API was not verified |
| Local publishers and venues | Supplied calendar, CSV, newsletter or agreed feed | Coverage, update/cancellation handling and display arrangements need establishing |

Prioritise gaps affecting **Fika+, Pink Lettuce and Shrub**, alongside Life in Chester and ShitChester. See the [priority venue investigation](priority-vegan-venues.md). Manual shared-link additions remain useful while automated routes are unresolved.

## Bookable experiences

Add a separate way to discover activities that friends can arrange for a chosen date, rather than events with an announced schedule.

Initial candidates from the venue research:

- Pink Lettuce tasting menus and Sunday roasts.
- Shrub private cocktail masterclasses.
- Other venue experiences supported by a current public booking/enquiry page.

See [venue evidence and booking routes](priority-vegan-venues.md). Fika’s Experiences page was empty when checked; retain it as a possible future source, not an available experience.

Before implementing, decide how experiences should sit alongside dated events and capture:

- Venue, description, booking/enquiry URL and last verification.
- Price basis, duration and group-size requirements where stated.
- Advance-booking requirements and whether confirmation is required.
- Dietary details and availability wording from the venue.

Do not manufacture daily occurrences from a menu or infer live availability from opening hours. A specially announced tasting dinner belongs in the dated-event feed even if ordinary tasting-menu reservations are deferred.
