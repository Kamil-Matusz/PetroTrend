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
`VITE_API_TARGET` in `.env.local`. The backend allows CORS from `:5173` and `:4173`
(`config/WebConfig.java`, overridable with `petrotrend.cors.allowed-origins`), so a
different-origin setup works too: `VITE_API_BASE_URL` overrides `client.ts`'s relative `/api`
with an absolute base (e.g. `https://api.example.com/api`). Vite inlines it at build time, so it
is a build input rather than a runtime setting - changing it means rebuilding. That is how the
Azure Static Web Apps deploy reaches the backend; locally the proxy stays the simpler path.

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

- **Dashboard** (`/`, `DashboardPage`) - two independent `useAsync` calls. On mount only
  `GET /fuelPrices/latest?fuelSymbols=` runs; it returns one row per fuel **and currency**
  (newest `date`, then `createdAt`), which fills the pylon directly - no history, so the pylon
  shows price plus that grade's own reading date and no change arrow. Which grades appear is a
  `selection` state where `null` means "the backend's default set": on `null` the param is
  omitted and the shown grades are derived from the symbols the response contains, so the
  default (`ON,PB95` today) lives in the backend only and is **not** mirrored here. The
  `.dash__fuel-key` toggles switch `selection` to an explicit list - the last active grade can't
  be switched off, because an empty list would read as "default" again. History is opt-in:
  `range` starts `null` and `GET /fuelPrices/range` fires only once a `RangeTabs` key is picked,
  feeding `TrendChart` and the recent-readings list. Both responses are filtered by currency
  **client-side**.
- **Records** (`/notowania`, `RecordsPage`) - `GET /fuelPrices/search` with server-side filtering,
  sorting and pagination; every filter/sort/size change resets `page` to 0. Owns all CRUD: create,
  edit and delete each run through a single `Dialog` discriminated union rendered into `Modal`.
  `RangePurge` (the `purge` dialog) wraps `DELETE /fuelPrices/range`, which ignores fuel and
  currency and answers `204` with no count - so it keeps its own dates, separate from the table
  filters, and reads the range back with `GET /fuelPrices/range` first: that preview is both the
  confirmation step and the only honest source for the "usunięto N" notice.

Filter and pagination state lives in `useState` on the page, not in the URL - deep links to a
filtered view don't work today.

## Charts and design

`TrendChart` pivots flat rows into one object per date keyed by fuel symbol (`connectNulls`
bridges gaps), draws dots only when the window is sparse (≤ 31 points), and labels each line at
its end. The legend is a set of `aria-pressed` toggle buttons, not recharts' `<Legend>`.

One `ComposedChart` renders four modes, picked by the `.trend__modes` tabs; each mode is a
different measure on the **same single y-axis** (never a second axis). The pure transforms live in
`src/lib/trend.ts` - no React, no recharts - so they are testable and the component stays layout:

- **Poziom** - absolute prices, the original lines.
- **Indeks** - every series rebased to 100 at *its own* first reading in the window, so grades on
  different price levels compare; `ReferenceLine` at 100.
- **Spread** - one curated pair at a time (`SPREAD_PAIRS`), rendered as an `Area` in `--sodium`
  with a zero line. Legs are carried forward, because the two grades aren't always quoted on the
  same day. In this mode the legend row becomes a single-select pair picker.
- **Zmiana** - period-over-period bars, weekly buckets up to a 120-day window and monthly beyond
  it. Each bucket's close is compared with the previous bucket that *had* one, so gaps bridge
  instead of dropping a bar; the first bucket never gets a bar. Colour stays fuel identity - the
  sign is carried by the bar's direction and, in the tooltip, by ▲/▼ plus `--rise`/`--fall`.

A mode with nothing to show (spread without a complete pair, change with one bucket) renders
`Empty` in place of the plot but keeps the tabs, so the user can switch back.

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
