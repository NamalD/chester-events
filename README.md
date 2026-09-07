# Chester Events

A public, read-only calendar of dated events in Chester, Hoole and Handbridge. Astro builds a static site with list/calendar views, shareable URL filters, source links and visible uncertainty. No accounts, visitor tracking, external assets or runtime provider requests.

## Run locally

Use Node 22.12 or newer and npm. The lockfile pins dependencies; CI uses Node 22.

```bash
npm ci
npm run dev
```

Open http://localhost:4321/. Development overrides the production base path to `/`; the production preview uses `/chester-events/` to match GitHub Pages. The committed event data works without provider keys. `npm run build` generates `dist/`; `npm run preview` serves that build.

## Verify

```bash
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests cover desktop and mobile Chromium, filtering, URL history, calendar keyboard navigation, custom dates, reduced motion, overflow, no external requests, the static fallback and automated axe accessibility checks. Screenshots are saved under ignored `test-results/`. Install browser system dependencies with `npx playwright install --with-deps chromium` on supported CI systems.

## Refresh data

```bash
npm run collect
```

Collection requests the next 90 days from the [source allowlist](docs/initial-source-allowlist.md), checks publisher robots rules, spaces requests and caches conditional HTTP responses. It makes one attempt per source without automatic retries. To enable optional providers, copy `.env.example` to `.env` and supply `TICKETMASTER_API_KEY` and/or `SKIDDLE_API_KEY`. Missing keys skip only that provider. Credentials and authenticated responses are not written to data or the HTTP cache.

Generated files are intentionally committed:

- `src/data/source-events.json` retains normalized records and original evidence independently per source.
- `src/data/events.json` contains merged display records and the latest successful collection timestamp.
- `src/data/source-status.json` records source outcomes, verification times, candidate counts and exclusions.

Failed or missing listings remain visible as stale while still current. A successful explicit correction that moves an occurrence outside scope retires it without labelling it cancelled. Events expire at a verified end, otherwise after their last advertised London date. Unknown dates stay in a separate section. Unknown prices remain unknown; categories come from supplied labels. Ambiguous/conflicting times are flagged, and missing ends are not invented. Explicit timed API/calendar midnight events retain their time; unqualified Tribe midnight values remain conservative date-only listings. Locality needs a local name plus UK country/address or matching coordinates.

Only shared source identities or common source/booking URLs with matching occurrence times merge. Original evidence survives merging; the first record supplies display fields and disagreements are labelled. Possible duplicates remain separate. Descriptions are capped source excerpts, not independently verified summaries.

## Current coverage limitations

Telford’s Warehouse and Chester BID currently supply accepted listings. Chester BID is explicitly trusted as a Chester-local curated calendar following the owner’s confirmation. Missing location fields use source curation as locality evidence; explicit out-of-area locations still reject. Missing venue/address details remain unknown. That Beer Place currently has an empty feed. Swing Cats' iCalendar download route is disallowed by publisher robots rules and is not fetched. Ticketmaster and Skiddle require optional keys; authenticated integration remains unverified. This is a partial local calendar.

Public access/robots allowance does not establish a republication licence. Publisher-specific reuse arrangements remain unresolved; see the [access notes](docs/initial-source-allowlist.md). No publisher outreach has been sent.

## GitHub Pages

The repository is configured for `https://namald.github.io/chester-events/`. For another repository, update `site` and `base` in `astro.config.mjs`, public repository links and the collector User-Agent.

When ready to publish, enable **Settings → Pages → Build and deployment → GitHub Actions**, ensure Actions can commit generated data to `main`, and add any optional keys as repository Actions secrets. Push the application to `main` or dispatch **Update and publish Chester Events**. The owner has requested publication through this workflow; the Actions run and Pages URL show current deployment status.

The publishing workflow runs daily at 02:00 Europe/London, with a timezone-aware schedule, or manually with an optional collection step. Main-branch pushes deploy committed data. Scheduled/manual refreshes commit changed JSON then deploy in the same workflow. Source failures publish retained data and diagnostics. Push conflicts fail without force-pushing. GitHub may delay scheduled runs. Pull requests run type checks, unit tests, build and browser tests.

See [MVP scope](docs/mvp-scope.md), [environment contract](docs/environment.md) and [handover](docs/handover.md) for scope and verification details.
