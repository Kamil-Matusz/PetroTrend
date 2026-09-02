# PetroTrend

A fuel price tracking application (ON, PB95, PB98, LPG). The backend is a Spring Boot REST API
backed by MongoDB; the frontend is a React + TypeScript UI styled after a roadside station
price pylon.

The repository holds two independent projects:

| Directory | What it is | Stack |
|---|---|---|
| `PetroTrend.Backend` | REST API and data layer | Java 21, Spring Boot 4.1.1, MongoDB, Gradle 9.7.1 |
| `PetroTrend.Frontend` | user interface | React 19, TypeScript, Vite 8, react-router, recharts |

## Requirements

- **JDK 21** (the backend uses a Gradle toolchain)
- **Docker** - required to run the backend and its tests; MongoDB starts automatically
- **Node.js 24** (the version used in CI)

## Quick start

### Backend

```bash
cd PetroTrend.Backend
./gradlew bootRun
```

The API starts on `http://localhost:8080`. MongoDB (`mongo:8`) is brought up by
`spring-boot-docker-compose` from `compose.yaml` - the host port is not fixed and the connection
URI is discovered automatically, so `spring.data.mongodb.uri` is never configured.

Alternatively, `TestPetroTrendApplication.main` runs the app locally against a Testcontainers
MongoDB instead of compose.

### Frontend

```bash
cd PetroTrend.Frontend
npm install
npm run dev
```

The UI starts on `http://localhost:5173` and proxies `/api` to `http://localhost:8080`, so the
backend must be running. Point it elsewhere with `VITE_API_TARGET` in `.env.local`:

```
VITE_API_TARGET=http://localhost:8081
```

The backend also allows CORS from `:5173` and `:4173` (`config/WebConfig.java`), but `client.ts`
uses the relative base `/api`, so the proxy is the supported path.

## Commands

| Backend | What it does |
|---|---|
| `./gradlew build` | compile + test (the main quality gate) |
| `./gradlew test` | all tests |
| `./gradlew test --tests 'FuelPriceServiceTest'` | a single test class |
| `./gradlew bootRun` | run the API (starts MongoDB via compose) |

| Frontend | What it does |
|---|---|
| `npm run dev` | dev server with HMR on `:5173` |
| `npm run build` | `tsc -b` (typecheck) + production build to `dist/` |
| `npm run preview` | serve the build on `:4173` |
| `npm run lint` | oxlint |

The backend has no separate linter - `build` with `-Amapstruct.unmappedTargetPolicy=ERROR` is the
gate. The frontend has no tests and no test runner - `npm run lint` plus `npm run build` is the
whole gate.

## API

Base prefix: `/api/fuelPrices`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | all readings |
| `GET` | `/latest?fuelSymbols=ON,PB95` | latest reading per fuel and currency (defaults to `ON,PB95`) |
| `GET` | `/currentMonth` | readings from the current month |
| `GET` | `/range?from=&to=` | readings in a date window (`YYYY-MM-DD`) |
| `GET` | `/search` | server-side filtering, sorting and pagination |
| `GET` | `/{id}` | a single reading |
| `POST` | `/` | create a reading (`201`) |
| `PUT` | `/{id}` | update a reading |
| `DELETE` | `/{id}` | delete a reading (`204`) |

`/search` accepts the `fuelSymbol`, `currency`, `from` and `to` filters plus the standard
`Pageable` parameters (`page`, `size`, `sort`). It defaults to `size=20`, `sort=date,desc`; page
size is capped at 100 and only `date` and `price` are sortable - anything else comes back as
`INVALID_SORT_PROPERTY`.

Docs: OpenAPI JSON at `/v3/api-docs`, Scalar UI at `/scalar`. Actuator is on the classpath.

## Data model

A single aggregate - `FuelPrice` (collection `fuel_prices`):

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | Mongo identifier |
| `fuelSymbol` | `ON` \| `PB95` \| `PB98` \| `LPG` | |
| `currency` | `PLN` \| `USD` \| `EUR` | |
| `price` | `BigDecimal` | stored as `DECIMAL128`, positive, max 4 integer and 2 fraction digits |
| `date` | `LocalDate` | day granularity, not in the future |
| `source` | `String` | optional, up to 64 characters |
| `createdAt` | `Instant` | set by `@CreatedDate` |

Uniqueness is enforced by the compound index `(fuelSymbol, currency, date desc)` created at
startup (`auto-index-creation: true`). A duplicate returns `409` with `FUEL_PRICE_ALREADY_EXISTS`.

## Error handling

Domain errors are returned as `ApiError` with a stable `reasonCode` that the frontend depends on
(`src/lib/errors.ts` maps the codes to Polish messages).

| `reasonCode` | HTTP |
|---|---|
| `FUEL_PRICE_NOT_FOUND` | 404 |
| `FUEL_PRICE_ALREADY_EXISTS` | 409 |
| `INVALID_DATE_RANGE` | 400 |
| `INVALID_SORT_PROPERTY` | 400 |

Reason codes are part of the API contract - a new domain error means an exception class, a new
code, a handler method in `GlobalExceptionHandler` and an entry in `src/lib/errors.ts`.

## Architecture

**Backend.** Layering is strict and one-way: `controllers → services → repositories`, with
MapStruct at the service boundary. Controllers never touch entities or `MongoTemplate`; services
never return entities. Simple date-window reads go through a declarative `@Query`, while `/search`
uses a Spring Data custom fragment (`FuelPriceRepositoryCustom` + `FuelPriceRepositoryImpl`) that
builds `Criteria` per non-null filter field.

**Frontend.** No state manager, no data-fetching library, no CSS framework, no component library.
`src/api/client.ts` is the only place that calls `fetch`, `src/hooks/useAsync.ts` is the entire
fetching strategy (no cache, no dedupe), and styling is hand-written CSS with design tokens in
`:root`. Dark theme only. The backend contract is mirrored by hand in three places
(`src/api/types.ts`, `src/lib/errors.ts`, and the validation in `PriceForm`) - nothing is
generated, so a backend DTO change means updating all of them.

Screens:

- **Dashboard** (`/`) - a pylon with current prices, a trend chart with four modes (level, index,
  spread, change) and a range switch, plus a shortlist of recent readings.
- **Records** (`/notowania`) - a table backed by `/search` with filters, sorting and pagination,
  plus create, edit and delete.

Fuel colours and marker shapes (`src/lib/fuel.ts`) are picked for protanopia/deuteranopia
separation and follow EN 16942 pump labelling - series identity never rests on colour alone.

All user-facing copy is Polish; code and identifiers are English.

## Tests and CI

Backend: JUnit 5 with AssertJ and Mockito, `@WebMvcTest` for controllers, Testcontainers
(`mongo:latest`) for the Spring context. Docker must be running.

GitHub Actions (`.github/workflows/ci.yml`) runs two independent jobs on every push and on PRs to
`main`: backend (`./gradlew build` on Temurin 21, test report uploaded as an artifact on failure)
and frontend (`npm ci`, `npm run lint`, `npm run build` on Node 24).

## AI agent documentation

Each subproject has its own `CLAUDE.md` (with an `AGENTS.md` pointing at it) covering rules,
conventions and pitfalls - read it before making changes. Anything crossing the HTTP boundary
requires reading both.
