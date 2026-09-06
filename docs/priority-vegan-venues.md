# Fika, Pink Lettuce and Shrub: event collection routes

Checked **6 September 2026**. All three are **P1 watchlist venues because of the group’s explicit interest**, even when a current event programme is not available. Website navigation, event/experience pages, official social links, advertised feeds and external listings were checked. No messages were sent, newsletter subscriptions created or bookings made.

## Recommendation at a glance

| Venue | Best collection route | Instagram’s role | Current evidence |
| --- | --- | --- | --- |
| **Fika+** | Monitor its own Events page and linked event details; follow collaborating organisers’ ticket pages | Important supplementary source; venue explicitly recommends Instagram for a quick response | A real website event system exists, but its visible dinner is from January 2025 |
| **Pink Lettuce** | Monitor website announcements and manually review official Instagram; retain tasting/Sunday dining separately as bookable experiences | Best social lead found; current post content could not be inspected | No dated public-event calendar or event feed verified |
| **Shrub** | Combine Chester BID’s events API, workshop organisers and manual social/newsletter review | Useful alongside Facebook and its advertised mailing list | A past Shrub workshop is retrievable from BID’s API; no dedicated venue calendar verified |

Direct Instagram fetches failed for all three accounts. The handles below were verified from links in each venue’s own website HTML, rather than guessed from search results. **Instagram may contain newer announcements, but its completeness and posting frequency are unverified.**

## Fika+

- [Official Events page](https://www.fikachester.co.uk/events-1): the clearest source to monitor. Its visible listing is an eight-course dinner on **25 January 2025**. The [event detail](https://www.fikachester.co.uk/event-details-registration/eight-course-exclusive-tasting-menu-dinner) supplies date, time, location and ticket status; tickets are no longer on sale. This proves past event publication and a usable detail-page structure, not a current programme.
- [Experiences page](https://www.fikachester.co.uk/experiences): explicitly says no experiences are currently offered.
- [Instagram: `@fika_chester`](https://www.instagram.com/fika_chester/) and [Facebook: FikaChester](https://www.facebook.com/FikaChester/) are linked by the venue. Its [contact page](https://www.fikachester.co.uk/blank-2) recommends Instagram for a quick response and supplies `hello@fikachester.co.uk`.
- **Collaborating organisers matter:** this [Introduction to Botany event](https://www.eventbrite.co.uk/e/introduction-to-botany-tickets-1987311551347) names Fika+ as the meeting point and Diane / `@vegartemis` as organiser. It is a past May 2026 example. Track the organiser’s new events as well as venue posts, and distinguish a walk meeting at Fika from an event hosted inside the café.
- [Blog RSS](https://www.fikachester.co.uk/blog-feed.xml) works, but its two returned articles are from January 2024 and December 2023. It is a low-priority change signal, not an event calendar.

**Implementation:** check Events weekly initially; discover and parse new detail links for title, full date/year, start/end, location, status and booking URL. Add manually verified social/partner discoveries between checks. No supported public event API or iCalendar feed was verified; do not assume Wix’s internal requests are a stable public interface.

**Location correction:** the [current homepage contact block](https://www.fikachester.co.uk/) names The Lodge, Grosvenor Park Road, CH1 1QQ, while older title/body text still refers to City Walls. Resolve location from the actual event. Keep `Fika`, `Fika+` and `fika+ at The Lodge` as matching aliases.

## Pink Lettuce

- [Official Instagram: `@pink_lettuce_chester`](https://www.instagram.com/pink_lettuce_chester), linked from the [restaurant website](https://www.pinklettuce.co.uk/). This is the verified social account to monitor manually; no separate official Facebook account was established in these checks.
- The homepage carries dated operational announcements, including opening on **31 August 2026**. This suggests website changes can be useful, but an exceptional opening day is not automatically an event.
- [Tasting menu](https://www.pinklettuce.co.uk/tasting) and [Sunday roast](https://www.pinklettuce.co.uk/sunday) pages describe advance-booked dining. These are useful for friends making plans, but do not establish a shared, ticketed evening on a specific date.
- [Catering & Events](https://www.pinklettuce.co.uk/catering) is an enquiry page for catered occasions and celebrations. It is **not a public events calendar**.
- [Visit / reservations](https://www.pinklettuce.co.uk/visit) provides a booking route and contact details: `info@pinklettuce.co.uk`, `reservations@pinklettuce.co.uk`. No event API, RSS calendar, iCalendar or dated public ticket inventory was verified. A simple scan of the visit/tasting HTML did not identify a booking-provider link; that does not rule out a JavaScript widget.

**Implementation:** maintain a favourite-venue entry at **51 Bridge Street, East Row, CH1 1NW**. Review Instagram and homepage changes weekly for explicitly dated special dinners or collaborations. If useful to the app, show tasting menus and Sunday roasts under “bookable experiences,” linked to the venue’s reservation page. Do not generate artificial daily or weekly event occurrences from those menus.

An organiser-supplied event list or public calendar would improve reliability here; requesting one remains a possible future step, not an action already taken. Searches also found Pink Lettuce mentioned as a prize donor or discount partner at other events—those mentions should not be interpreted as its own programme.

## Shrub

- [Official Instagram: `@shrubchester`](https://www.instagram.com/shrubchester/) and [Facebook: shrubchester](https://www.facebook.com/shrubchester) are linked from the [venue website](https://shrubchester.co.uk/). Its homepage also advertises a mailing list through an OpenTable signup link. Subscription availability is verified; newsletter content/frequency is not.
- **A working external event route exists:** [Chester BID’s Flower Workshop at Shrub](https://www.chesterbid.co.uk/event/flower-workshop-at-shrub/) links to a [Thistle & Thyme booking page](https://www.thistleandthyme.co.uk/mothers-day/p/mothers-day-workshop-at-shrub). The latter could not be fetched by the research browser. Treat Thistle & Thyme as a partner to check for future Shrub workshops, not a verified future schedule.
- A [BID API query for Shrub across 2026](https://www.chesterbid.co.uk/wp-json/tribe/events/v1/events?search=shrub&start_date=2026-01-01&end_date=2026-12-31&per_page=10) returned that **past March workshop**, ID `7534`. Its `venue` field was empty and `start_date` was midnight. Use title/detail-page evidence to match the venue and obtain a real session time; do not display midnight as a confirmed start.
- [Journal RSS](https://shrubchester.co.uk/journal?format=rss) works, but the returned feed begins with August 2024 articles about dining. It is an editorial feed, not a useful current event schedule.
- [Cocktail masterclasses](https://shrubchester.co.uk/masterclass), [private hire](https://shrubchester.co.uk/privatehire) and [weddings/events](https://shrubchester.co.uk/weddings) are group-booking/enquiry products. The masterclass is advertised for private groups of at least six, not a dated public class.

**Implementation:** add Shrub to the existing BID collector’s venue matching, using name, address (**1–3 Eastgate Row, CH1 1LQ**) and detail text. Supplement with workshop organisers, social announcements and a newsletter if someone elects to subscribe. The keyword query is a tested discovery aid, not proof of complete Shrub coverage. Keep private experiences separate from public events. Venue contact: `reservations@shrubchester.co.uk`.

## Technical check log

| URL / check | Observed result | Scope |
| --- | --- | --- |
| All three official homepages | HTTP 200; official Instagram links present | Identity and source-route verification |
| [Fika blog feed](https://www.fikachester.co.uk/blog-feed.xml) | HTTP 200, `text/xml`; 2 RSS items | Old blog articles, not event records |
| [Shrub journal feed](https://shrubchester.co.uk/journal?format=rss) | HTTP 200, `application/rss+xml`; 20 items | First three dated 1 August 2024 |
| BID Shrub query linked above | HTTP 200, JSON; `total: 1` | One matching record in requested 2026 window, already past |
| Pink Lettuce visit and tasting pages | HTTP 200 | Dining information; no event feed established |
| Three official Instagram profiles | Research-browser fetch failures | Live post content not checked |

None of these checks established a confirmed upcoming public event for the three venues as of the research date. Keep them prominent in the watchlist because they are personally important, and explicitly show when an event was last verified rather than treating absence from a calendar as proof nothing is happening.
