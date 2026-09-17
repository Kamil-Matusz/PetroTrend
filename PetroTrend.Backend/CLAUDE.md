# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PetroTrend backend - a fuel price tracking REST API. Spring Boot 4.1.1 on Java 21, MongoDB, Gradle 9.7.1 wrapper. Single domain aggregate: `FuelPrice`.

## Commands

```bash
./gradlew build                 # compile + test
./gradlew test                  # all tests
./gradlew test --tests 'FuelPriceServiceTest'                             # single class
./gradlew test --tests 'FuelPriceServiceTest.currentMonthQueriesFirstAndLastDayOfCurrentMonth'   # single test
./gradlew bootRun               # run app (auto-starts MongoDB via compose.yaml)
```

There is no linter configured - `build` (with `-Amapstruct.unmappedTargetPolicy=ERROR`) is the gate.

Docker must be running for both `bootRun` and `test`:
- `bootRun` uses `spring-boot-docker-compose` (declared `developmentOnly`) to start `compose.yaml`'s `mongo:8` and inject the connection details. `compose.yaml` exposes `27017` without a fixed host port on purpose - the URI is discovered, never configured, so don't add `spring.data.mongodb.uri`.
- Tests use Testcontainers (`TestcontainersConfiguration`, `mongo:latest`) via `@ServiceConnection`.
- `TestPetroTrendApplication.main` runs the app locally against a Testcontainers MongoDB instead of compose.

## API surface

`/api/fuelPrices` - `GET` (all), `GET /latest?fuelSymbols=` (defaults to `ON,PB95`), `GET /currentMonth`, `GET /range?from=&to=`, `GET /search`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`, `DELETE /range?from=&to=` (bulk, 204).
OpenAPI JSON at `/v3/api-docs`, Scalar UI at `/scalar`. Actuator is on the classpath.

## Architecture

Layering is strict and one-way: `controllers → services → repositories`, with MapStruct at the service boundary. Controllers never touch entities or `MongoTemplate`; services never return entities.

**Mapping (MapStruct).** `FuelPriceMapper` is generated with `defaultComponentModel=spring` and `unmappedTargetPolicy=ERROR` (set as compiler args in `build.gradle`). Adding a field to `FuelPrice` or a DTO breaks the build until every target property is mapped or explicitly `@Mapping(ignore = true)`. Note the method names are counter-intuitive: `convertToDto(FuelPriceRequest)` returns a **`FuelPrice` entity**; `convertToEntity(request, @MappingTarget entity)` updates in place for `PUT`.

**Search vs. the other reads.** Two distinct query paths:
- Simple date-window reads use a declarative `@Query` on `FuelPriceRepository`.
- `search` is a Spring Data custom fragment: `FuelPriceRepositoryCustom` + package-private `FuelPriceRepositoryImpl`, composed into `FuelPriceRepository` by inheritance. The `Impl` suffix and matching base name are what let Spring Data find it - renaming either breaks wiring silently. It builds `Criteria` per non-null filter field and pages with `PageableExecutionUtils` so the count query only runs when needed.

**Uniqueness.** Enforced by the `@CompoundIndex` on `(fuelSymbol, currency, date desc)` in `FuelPrice`, created at startup by `spring.data.mongodb.auto-index-creation: true`. There is no pre-read check - `FuelPriceService.save` catches `DuplicateKeyException` and rethrows `FuelPriceAlreadyExistsException`. Keep that pattern rather than adding an `existsBy` lookup.

**Sorting is whitelisted.** `FuelPriceValidator.SORTABLE_PROPERTIES` (`date`, `price`) is validated against the incoming `Pageable`; anything else throws `InvalidSortPropertyException`. Add new sortable fields there, not just in the index. Page size is capped by `spring.data.web.pageable.max-page-size: 100`; `/search` defaults to `size=20, sort=date,desc`.

**CORS.** `WebConfig` maps `/api/**` and takes its allowed origins from
`petrotrend.cors.allowed-origins` (comma-separated, defaults to the two Vite dev ports). Deployed
frontends on another origin are added there - as an env var, `PETROTREND_CORS_ALLOWED_ORIGINS` -
never by hardcoding a host or widening the mapping.

**Errors.** Every domain exception extends `BaseRuntimeException(message, reasonCode)` and carries a stable `reasonCode` constant (e.g. `FUEL_PRICE_NOT_FOUND`). `GlobalExceptionHandler` (`@RestControllerAdvice`) maps each to an HTTP status and funnels it through the static `RootController.handleException` into `ApiError`, which pulls `reasonCode` off the exception. A new domain error means: exception class + reason code + one handler method. Clients depend on `reasonCode`, so treat existing codes as API contract.

**Persistence details.** `price` is `BigDecimal` stored as `DECIMAL128` (`@Field(targetType = ...)`) - never widen it to `double`. `createdAt` is set by `@CreatedDate`, enabled by `@EnableMongoAuditing` in `MongoConfig`, and ignored in all mappings. Dates are `LocalDate` (day granularity), audit timestamps are `Instant`.

## Conventions

- Records for all DTOs (`FuelPriceRequest`/`Response`/`Filter`); Lombok (`@Data @Builder`) only for the entity; `@RequiredArgsConstructor` for constructor injection - no field injection, no `@Autowired` in main code.
- `final` on locals, parameters, and injected fields throughout main code. Match it.
- Validation lives on `FuelPriceRequest` via Jakarta annotations; cross-field rules (date ranges) live in the service.
- Tests use `//given` / `//when` / `//then` section comments in every test method - keep this. AssertJ + Mockito; `@WebMvcTest` + `@MockitoBean` for controllers, `@ExtendWith(MockitoExtension.class)` for services and the repository fragment (asserting on the captured `Query.getQueryObject()` rather than hitting Mongo).
- Test names are full sentences describing behaviour, e.g. `searchDefaultsToDateDescendingPageSizeTwenty`.
- `HELP.md` is Spring Initializr boilerplate and is gitignored - don't maintain it.
