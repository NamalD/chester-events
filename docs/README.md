# Chester event-source research

Researched **6 September 2026** for an app shared by friends looking for music, dancing, vegan events, food, and unusual things to do in **Chester, UK**.

Start with a mixture of direct venue calendars, local listings, and manually submitted discoveries. There are working public feeds locally; a national ticketing API alone is unlikely to cover the smaller social events that make this app useful. That is a recommendation from the source mix below, not a measured completeness claim.

## Research documents

- [Domain glossary and data dictionary](data-dictionary.md): domain terms, Chester BID, implemented fields, status values and data interpretation rules.
- [Implementation handover](handover.md): current implementation, verification results and remaining work at the requested pause.
- [Local sources](local-sources.md): venues, organisers, listings, social accounts, and regional options, with collection suggestions and priorities.
- [Fika, Pink Lettuce and Shrub](priority-vegan-venues.md): priority venues, verified social accounts, website/partner routes, and feed checks.
- [APIs and providers](apis-and-providers.md): access requirements, practical limitations, and which integrations are worth trying.
- [Verified collection routes](verified-collection-routes.md): actual HTTP checks, working endpoints, and gaps in verification.
- [Collection plan](collection-plan.md): a suggested first import, event quality rules, and next research steps.
- [Future improvements](future-improvements.md): paid/missing integrations and bookable experiences deferred beyond the MVP.
- [MVP scope](mvp-scope.md): the confirmed product, collection, privacy and deployment decisions.
- [Initial source allowlist](initial-source-allowlist.md): the exact MVP collectors and routes, including key-gated providers.
- [Environment and GitHub Actions secrets](environment.md): the credential contract for local development and scheduled updates.

## Best starting sources

| Source | Why start here? | Initial route |
| --- | --- | --- |
| Telford’s Warehouse | Music plus participatory events | Working public events JSON and iCalendar |
| Chester BID | Broad city-centre coverage | Working public events JSON |
| Alexander’s Live | Gigs, comedy, and dance leads | Venue website and linked See Tickets listings |
| The Live Rooms | Live music, club nights, cabaret, comedy | Event pages and linked ticket pages |
| Storyhouse | Arts and small community gatherings | Separate community and performance listings |
| Books on the Walls | Books, plants, games, and workshops | Dated homepage sections and ticket links |
| Cheshire Swing Cats | Participatory social dancing | Event pages with working individual iCalendar downloads |
| Chester Vegan Market | Direct match for vegan interests | Organiser’s Chester page |
| Chester Market | Food venue with music and other events | What’s On pages |
| Pickles | Tastings and social evenings | Events catalogue and detail pages |
| The Chester Blog | Finds events beyond venue calendars | Working RSS, followed by event verification |
| Life in Chester | Small creative social events | Linktree ticket links and manual social discovery |

The linked documents contain the evidence and exact URLs for these recommendations.

## Findings that affect the app

- **Eventbrite is useful for discovery, but its old public event-search API is shut down.** [Official API documentation](https://www.eventbrite.com/platform/new/api).
- **Meetup API access requires Pro and approval.** Do not make it a launch dependency. [Meetup access guidance](https://help.meetup.com/hc/en-us/articles/41453576628749).
- **Skiddle is a promising API candidate**, with a free key application; Chester coverage still needs an authenticated trial. [Skiddle API](https://www.skiddle.com/api/).
- Social accounts are valuable leads, but direct Instagram browsing failed during this research. Link pages and organiser websites offer useful alternatives.
- Nearby festivals need a separate location filter: Chester Folk Festival is in Kelsall; Deva Fest advertises Cholmondeley Castle. [Folk organiser](https://www.chesterfolk.org.uk/), [Deva Fest organiser](https://www.devafest.co.uk/).

This is source discovery and a small technical feasibility check. No paid accounts were opened, organisers contacted, subscriptions created, or authenticated provider APIs queried. Dates are research examples, not a promise that an event will run; recheck before displaying them as upcoming.
