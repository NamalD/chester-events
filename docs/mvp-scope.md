# MVP scope

Agreed on 6 September 2026.

## Product

Chester Events is a public, mobile-first static website for finding **dated events in Chester, UK**, including Hoole and Handbridge. It is read-only: no accounts, sign-in, event submissions, saved preferences, reports or visitor analytics.

It covers all event types except business networking and children-only activities. Family events are included. Bookable experiences without an announced date are deferred to [future improvements](future-improvements.md).

## Browsing

- List and month-calendar views, with the list as the initial view.
- Initial list window: next 30 days; controls for Today, This Weekend, Next 7 Days, Next 30 Days and custom dates.
- Calendar selection and filters are shareable in the URL.
- Multi-select categories: Music, Dance, Food & Drink, Vegan, Arts & Culture, Community, Markets & Fairs, Nightlife, Outdoors, Other, and Uncertain details.
- Events with a known date appear in their normal date position and are labelled when facts conflict or are incomplete. Events without a reliable date appear in a separate section.
- Clear duplicate listings merge into one card with source and booking links retained. Possible duplicates stay separate.
- Cards are text-first: title, time, venue, category labels, a capped source-derived description, known price or “Price not listed,” visible source labels and source links. No event images.
- The site displays its latest successful update. Uncertain or stale events also show their last successful source check.

## Collection and publishing

- Astro with TypeScript builds a static GitHub Pages site.
- A GitHub Actions job runs at **02:00 Europe/London** daily. It does not retry automatically.
- It commits changed generated current-event and source-status data to the public repository, making updates auditable and allowing still-future events to survive a temporary source failure. Past events are removed after they end.
- Collectors use a descriptive User-Agent pointing to the public repository.
- Use all sources with a supported or clearly permitted free collection route. Free keys may be supplied through GitHub Actions secrets; a missing key skips only that provider.
- Do not automate a source whose access rules do not allow it. Paid, restricted or otherwise unresolved providers remain deferred.

## Deployment and privacy

- Repository: public.
- Hosting: GitHub Pages.
- No runtime backend, authentication, tracking or public write route.

