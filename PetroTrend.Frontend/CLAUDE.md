# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PetroTrend frontend - a fuel price tracking UI (ON, PB95, PB98, LPG) over the REST API in the
sibling `PetroTrend.Backend` (which has its own `CLAUDE.md` - read it before changing anything
that crosses the wire). React 19 + TypeScript + Vite 8, `react-router` v8, charts on `recharts`.
No state manager, no data-fetching library, no CSS framework, no component library.

All user-facing copy is Polish. Keep it that way; code, comments and identifiers stay English.

## Commands

```bash
npm run dev        # Vite dev server on :5173
npm run build      # tsc -b (typecheck, project references) + production build to dist/
npm run lint       # oxlint
npm run preview    # serve dist/ on :4173
```

There are no tests and no test runner installed - `npm run build` plus `npm run lint` is the
whole gate. Don't claim a change is verified on tests that don't exist.

`npm run dev` proxies `/api` to `http://localhost:8080` (`vite.config.ts`), so the backend must
be running (`./gradlew bootRun` in `PetroTrend.Backend`, needs Docker). Override with
`VITE_API_TARGET` in `.env.local`. The backend also allows CORS from `:5173` and `:4173`
(`config/WebConfig.java`), so a direct-origin setup works too - but `client.ts` hardcodes the
relative base `/api`, so the proxy is the supported path.

## The backend contract is mirrored in three places

Changing a backend DTO, reason code or validation rule means updating all of these by hand -
nothing is generated, and nothing fails at build time if they drift:

- `src/api/types.ts` - `FuelPriceRequest`/`Response`/`Filter`, the `FUEL_SYMBOLS` / `CURRENCIES`
  literal unions, and `PagedModel<T>` (Spring's `content` + nested `page` descriptor).
  `SortProperty` is `'date' | 'price'` because the backend whitelists exactly those in
  `FuelPriceService.SORTABLE_PROPERTIES`; anything else comes back as `INVALID_SORT_PROPERTY`.
- `src/lib/errors.ts` - maps backend `reasonCode` constants to Polish messages. Reason codes are
  the stable contract; a new backend domain error needs an entry here or the raw English message
  leaks to the user.
- `PriceForm.validate` (`src/components/PriceForm.tsx`) - duplicates the Jakarta constraints on
  `FuelPriceRequest` (positive, < 10000, 2 decimals, no future date, source ≤ 64 chars) so bad
  payloads never leave the browser. Server-side validation still runs; this is a UX layer.

## Data layer

`src/api/client.ts` is the only place that calls `fetch`. `request<T>()` sets JSON headers only
when there's a body, returns `undefined` for `204`, and turns every failure into `ApiError`
(`status`, `message`, `reasonCode`). It handles **two** error shapes: the backend's own
`ApiError` from `GlobalExceptionHandler`, and Spring's Bean Validation shape (`errors[]` with
`defaultMessage`), which bypasses that handler. A network failure becomes a synthetic
`reasonCode: 'NETWORK_UNREACHABLE'` with `status: 0`. `src/api/fuelPrices.ts` is a thin
one-function-per-endpoint layer on top - add endpoints there, never call `fetch` from a component.

`src/hooks/useAsync.ts` is the entire fetching strategy: run on mount, re-run when `deps` change,
last response wins. Two deliberate details - the effect keys off `JSON.stringify(deps)` (so
callers can pass fresh objects/closures freely), and `fn` is held in a ref so the caller's
closure identity is irrelevant. `reload()` bumps a nonce; mutations call it after a successful
write rather than mutating any cache. There is no cache, no dedupe, no shared store.

## Pages

- **Dashboard** (`/`, `DashboardPage`) - fetches `GET /fuelPrices/range` for the selected window
  and filters by currency **client-side**, then derives the pylon readings (last price per grade
  plus the step from the reading before it) and the recent-readings list with `useMemo`.
- **Records** (`/notowania`, `RecordsPage`) - `GET /fuelPrices/search` with server-side filtering,
  sorting and pagination; every filter/sort/size change resets `page` to 0. Owns all CRUD: create,
  edit and delete each run through a single `Dialog` discriminated union rendered into `Modal`.

Filter and pagination state lives in `useState` on the page, not in the URL - deep links to a
filtered view don't work today.

## Charts and design

`TrendChart` pivots flat rows into one object per date keyed by fuel symbol (`connectNulls`
bridges gaps), draws dots only when the window is sparse (≤ 31 points), and labels each line at
its end. The legend is a set of `aria-pressed` toggle buttons, not recharts' `<Legend>`.

Series identity must never rest on colour alone. `src/lib/fuel.ts` pairs each grade with a colour
picked for protanopia/deuteranopia separation **and** a marker shape following EN 16942 pump
labelling (diesel square, petrol circle, gaseous diamond), rendered by `FuelMark`; direction of
change pairs colour with ▲/▼ plus screen-reader text. Preserve both channels when adding series.

Styling is hand-written CSS: design tokens (surfaces, ink, the single `--sodium` accent, fuel
colours, the three font stacks) live in `:root` in `src/index.css` alongside the shared `.btn`,
`.field`, `.panel`, `.num` and `.eyebrow` primitives. Each component imports its own sibling
`.css` file with BEM-ish class names scoped by a block prefix. Dark theme only - `color-scheme:
dark`, no light mode, no media-query switch. Every number carries `.num` (mono, tabular figures).

## Conventions

- Named function exports, no default exports; component files are `PascalCase.tsx` next to
  `PascalCase.css`.
- All dates on the wire are `YYYY-MM-DD` strings and stay strings; sorting uses `localeCompare`
  on them. Convert only for display, via `src/lib/format.ts` (`Intl` formatters pinned to
  `pl-PL`). Use its `parseIso`, never `new Date(iso)`, for day-granularity dates - `parseIso`
  builds a local date so the day never shifts by time zone.
- Loading, empty and error UI go through `States.tsx` (`Loading` / `Empty` / `ErrorNote` /
  `Banner`); errors are rendered with `describeError`, never `String(error)`.
- oxlint enforces `react/rules-of-hooks` as an error. `tsc -b` runs with `noUnusedLocals` and
  `noUnusedParameters`, so leftover imports break the build.
