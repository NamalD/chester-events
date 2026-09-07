# Implementation handover

## Latest update — 7 September 2026, deployment requested

The owner requested GitHub Pages deployment and a simpler browse-first page. The hero, local-listings strip, coverage disclaimer and footer slogans are removed. The first heading is now “What’s happening?”, navigation says “Sources”, and the footer contains the open-source link, last update and back-to-top. Search focus uses a blue border without an orange outline.

`npm run dev` now serves `/`; build/preview retain `/chester-events/` for the repository's Pages URL. The root route was verified in a browser. The owner confirmed BID's curated events are in Chester: its explicit `trustedLocality` setting supplies locality only when geographic fields are absent, retains `localityBasis: source-curation`, and rejects explicit conflicting locations. The refreshed dataset contains 60 BID + 25 Telford’s events (85 total). Parser version is 1.2.0. All 20 core tests and 14 browser/accessibility tests pass.

Deployment is now authorized; the previous no-deployment restriction below describes the earlier checkpoint. The publishing workflow and live Pages URL should be checked for current deployment status.

## Earlier verification checkpoint

Updated **7 September 2026** after resuming the original implementation task. The static MVP is implemented and locally verified. Publication and authenticated provider checks remain outstanding.

## Scope and design

Follow [MVP scope](mvp-scope.md), [initial source allowlist](initial-source-allowlist.md) and [environment contract](environment.md). This is a public, read-only static site: no accounts, submissions, saved preferences, tracking or backend. Earlier research suggestions outside this scope remain deferred.

User design instruction: very slight creamy white, mid-blue with tones/shades, bold orange secondary, bold black high-level headings underlined in orange. Desktop and mobile screenshots have been reviewed against this palette. Secondary text was darkened to address automated contrast failures.

## Workspace

Repository: `/home/namal/code/chester-events`; remote: `https://github.com/NamalD/chester-events.git`. Application files are still untracked; documentation has local edits. No commits, pushes, PRs, repository settings changes, publisher messages or deployments have been made. No applicable `AGENTS.md` was found. No subagents were used.

No real provider keys or `.env` were created. Ignored directories include `node_modules/`, `.astro/`, `.cache/`, `dist/` and `test-results/`.

## Implemented

- Astro/TypeScript static app, useful initial HTML without JavaScript, text-first event cards, prices/unknowns, source and booking links, uncertainty and source status.
- List and month calendar, date presets/custom dates, category multi-select, search, shared URL state, browser history, copy link, calendar day selection and keyboard movement.
- Tribe adapters for BID, Telford’s and That Beer Place; robots-checked advertised Swing Cats iCalendar downloads; optional Ticketmaster and Skiddle adapters.
- Explicit 90-day collection window, pagination, identifying User-Agent, spacing, conditional HTTP cache, per-source failure isolation and retained future data. Authenticated responses do not enter the disk cache.
- Conservative normalization and strong-evidence merging, retained original facts, unknown values and expiry.
- GitHub PR checks and daily collection/data-commit/Pages workflow; root [README](../README.md) covers setup and deployment.

## Changes made during resumption

- Added public exclusion diagnostics: candidate totals and counts excluded for locality, scope or expiry. Explicit corrected records that become out of scope now retire; genuinely missing future records remain stale without implying cancellation.
- Inspected BID's quiz detail page using the normal robots-checked client. It names Rooftop Social Club but has no address or Event JSON-LD location. No unsupported locality enrichment was added.
- Tightened locality to require a local name and positive UK country/address or matching coordinate evidence; conflicting city fields reject misleading Chester street addresses.
- Vegan-option tags no longer produce the Vegan category. Explicit vegan event/category labels still do.
- Rejected Luxon's silent DST-gap time shifts while retaining a reliable date. Display converts supplied offsets to London. Ambiguous/conflicting UTC times remain flagged and cannot drive false expiry; original UTC facts are retained.
- Explicit API/iCalendar midnight times survive; unqualified Tribe midnight values remain conservative date-only placeholders.
- iCalendar missing ends remain unknown instead of inheriting library-generated ends. Tested EXDATE, all-day exclusive ends and moved recurrence exceptions with stable occurrence identity.
- Added provider window/pagination/schema tests and reject missing event identities, inconsistent Tribe totals and Ticketmaster empty-but-advertised result pages.
- Calendar arrow navigation clears stale selected-day URL state when crossing months. Reset/history clear pending searches and validation messages.
- Improved filter hit areas and removed the Astro inline-script hint. Browser tests use accessible checkbox roles; the no-JS assertion targets the visible notice rather than the `noscript` element that Playwright excludes from text extraction.
- Added automated axe accessibility checks and corrected secondary text contrast.
- Documented Swing Cats access restriction, current coverage, source reuse limitations and deployment procedure.

## Live data

Latest successful refresh: **2026-09-07T16:41:36.686Z**.

| Source | Result |
| --- | --- |
| Telford’s Warehouse | 25 verified current local events |
| Chester BID | 60 candidates; all excluded because locality could not be verified; diagnostic displayed publicly |
| That Beer Place | Successful empty feed |
| Cheshire Swing Cats | Robots rules still disallow the advertised iCalendar route; downloads not fetched |
| Ticketmaster / Skiddle | `not_configured`; no keys supplied |

Generated JSON is in `src/data/events.json`, `source-events.json` and `source-status.json`. Parser version is `1.1.0`. Data is real fetched content, not fixtures.

The inspected BID HTML is at `/tmp/chester-bid-sample.html`; temporary files may disappear between sessions.

## Verification

Node 22.23.2 was installed in isolation at `/tmp/chester-node22/node_modules/node/bin/node` and exercised with the declared Node 22 workflow runtime. System Node is 26.5.0.

- Clean `npm ci` on Node 22 completed successfully.
- Type check: zero errors, warnings or hints.
- Core regression suite: **19/19 passed** covering normalization, dates/DST, geography, categories, merging, retention/corrections, recurrence, provider windows and pagination.
- Browser suite: **14/14 passed** on desktop/mobile Chromium, including list/calendar interactions, URL history, custom dates, empty state, no external requests, no-JS fallback, keyboard month boundary, reduced motion, screenshots and axe WCAG A/AA checks.
- Production build verified at `/chester-events/`.
- Both workflow files parse as YAML without duplicate keys. Permissions, collection conditions, generated-data commit and artifact/deploy structure reviewed locally.
- [GitHub's current workflow reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule) confirms `timezone: Europe/London`; no UTC guard is required. Hosted schedule execution is untested.
- Dependency install audit reports zero vulnerabilities.

Screenshots are generated under `test-results/browse-capture-list-and-calendar-for-visual-review-{desktop,mobile}/` (`list.png`, `calendar.png`). Browser tests use the installed Chromium build 1243. Tests manage and stop their own preview server.

## Remaining operational work and limits

1. Publication: enable Pages with GitHub Actions, commit/push the reviewed application and verify the first hosted run only within authorized deployment scope. No remote action has been taken. Daily schedules may be delayed by GitHub.
2. Optional providers: real Ticketmaster/Skiddle keys are needed for authenticated integration and incremental coverage measurement. Mocked adapter tests pass, but cannot verify account-specific access or live payload completeness.
3. Coverage: BID lacks verified locality, Swing Cats remains robots-blocked, and That Beer Place is empty. Do not relax these checks merely to add volume. Additional sources require the allowlist/access review.
4. Publisher-specific reuse arrangements remain unresolved. Public access and robots allowance are not republication licences. No images are reused; descriptions are capped excerpts with attribution. No outreach has been sent.
5. Conservative model limits: possible duplicates/differing performance times remain separate; first source evidence supplies merged display fields, with conflicts labelled. There is no independent field-by-field editor. Skiddle doors opening is visibly labelled rather than treated as a confirmed performance time. Geography is address/country plus a bounded coordinate check, not a municipal polygon. Rare recurrence/timezone/provider variants still warrant live sampling. Automated accessibility checks do not replace a full manual assistive-technology audit.

## Commands

See [README](../README.md). For final checks:

```bash
npm ci
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run dev` serves `http://localhost:4321/chester-events/`. `npm run collect` separately refreshes real data and makes publisher requests.

Sandbox networking/server sockets require escalation here. Approved test/collection/install commands were used; no automatic approval rejection occurred. Do not bypass robots restrictions or serialize secrets to resolve an access failure.
