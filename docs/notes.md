# Notes (single source of truth)

This document is intentionally detailed: it is meant to be the reference for humans **and**
for future agents. Keep it synchronized with what the v3 rewrite is doing (TDD-driven, from
scratch, with safe defaults).

---

## 1) Repository map

### Root tooling
- Turbo tasks are defined in `turbo.json` and invoked via root `package.json` scripts.
- Test entrypoints:
  - `npm run test:run` (Vitest on Node)
  - `npm run test:coverage` (Vitest coverage)

### Package layout
- `packages/frey`: the framework library (published as the `frey` npm package)
- `apps/docs`: Next.js doc site (consumer-facing documentation)

### Release & migration pointers
- Release notes and strategy live in `docs/RELEASE.md`.
- Consumer summary examples typically live in `README.md` (and are mirrored into `packages/frey/dist/` during build).

---

## 2) What Frey is (and is not)

### Problem Frey solves
- Build REST APIs from entity definitions without hand-writing repetitive Fastify route code.
- Enforce consistent validation, request context shape, and documented HTTP behavior.

### Non-goals
- Not an ORM.
- Not a full admin product out of the box.
- GraphQL is **out of scope** for v3 (dropped from the product definition).

---

## 3) Runtime and stack

### Supported runtimes
- Node.js and Bun compatibility are a requirement. v3 keeps tests runnable on both.

### Technology choices
- TypeScript (strict), ESM-compatible (`"type": "module"`).
- Fastify for HTTP server + routing.
- Zod for schema definitions and type inference.
- Swagger/OpenAPI generation via `@fastify/swagger` + UI via `@fastify/swagger-ui`.
- Auth primitives exist for JWT and API key in the core package.

---

## 4) Core concepts

### Entity
An entity defines the HTTP surface and the domain behavior.

Key building blocks:
- `defineEntity(...)` (public API): produces a typed entity definition.
- Entity fields:
  - `name`: used to pluralize paths (e.g. `/user`)
  - `schema`: Zod object schema for payload validation and OpenAPI generation
  - `customId`: optional primary key field (default: `"id"`)
  - optional handlers: `findAll`, `findOne`, `create`, `update`, `delete`
  - `customRoutes`: additional HTTP routes attached to the entity

Files:
- Entity type + helpers: `packages/frey/src/entity.ts`
- Route generators: `packages/frey/src/routes/*`

### Request context (`Context`)
Handlers receive a `context` object with:
- `request`: Fastify request
- `server`: Fastify instance
- `auth`: auth state for the request (neutral stub when auth is off)

Design intent (v3):
- `auth` must always exist with a stable shape so handlers don’t need to guard for `undefined`.

### Params & query parsing
Frey parses query/body/path parameters into typed “params” objects and passes them to handlers.
- Implementation:
  - `packages/frey/src/helpers/parse-params.ts`

### Custom routes (base behavior)
Entity `customRoutes` are part of **base generation** in v3:
- They are registered without requiring an extra “feature flag” at startup.

---

## 5) Generated HTTP surface (REST)

Base CRUD routing is derived from handler presence:
- `findAll` => `GET /:entityName`
- `findOne` => `GET /:entityName/:id` (or `customId` field)
- `create` => `POST /:entityName`
- `update` => `PUT /:entityName/:id`
- `delete` => `DELETE /:entityName/:id`

Validation/documentation:
- OpenAPI schema fragments are generated from the entity Zod schema and installed when Swagger is enabled.

---

## 6) Feature matrix (present)

This table distinguishes what exists now from what the v3 rewrite is actively targeting.
Statuses:
- **Present**: implemented in this repository as of now
- **v3 target**: planned/rewritten for v3 with tests and safe defaults
- **Planned**: roadmap items that are not v3-blocking

### Entity-driven HTTP (REST)
- Entity + `defineEntity` with Zod schema: **Present**
- Generated plural routes: **Present**
- `GET findAll` with query parsing: **Present**
- `GET findOne`:
  - **Present** (route registered when `findOne` exists)
- `POST create`: **Present** (route registered when `create` exists)
- `PUT update`: **Present**
- `DELETE delete`: **Present**
- Entity `customRoutes`: **Present** (base behavior)
- OpenAPI / Swagger generation: **Present** (when enabled)
- HATEOAS / pagination link metadata (e.g. `Link` header with `next`/`prev`) for paginated list flows: **v3 base**

### Auth and security
- JWT auth: **Present** (when configured)
- API key auth: **Present** (when configured)
- Auth context injection: **Present** (handlers receive `context.auth`)
- Swagger UI authentication (doc auth redirect): **Present**
- RBAC/ownership/custom checks:
  - **Present** (middleware exists; v3 ensures consistent enabling/off-by-default posture)

### Default-off posture (v3 intent)
v3 requires:
- Base entity generation is enabled by default.
- Everything else (auth, Swagger, RBAC, CQRS, caches, SSE/WS, CORS, observability) is **default-off** and must be explicitly enabled in the registration/start options.

If the current implementation differs, that divergence should be treated as a **v3 gap** (and closed by the rewrite).

---

## 7) Feature matrix (future / roadmap)

### v3 target / rewritten systems
- CQRS compatibility (commands/queries/events) with tests: **v3 target**
- Redis caching + in-memory cache layers with invalidation contracts: **v3 target**
- SSE + WebSockets surfaces with consistent auth/RBAC behavior: **v3 target**
- OAuth2 / OIDC core integration + provider plugin system: **v3 core + v3 target**
- Security hardening via dedicated integration tests (safe defaults + CSRF-relevant modes): **v3 target**
- OpenTelemetry-first observability spine: **v3 target**

### Explicitly out of scope for v3
- GraphQL: **Dropped**

---

## A) Feature inventory (living document — update as decisions land)

This section is the “feature inventory” for v3. It keeps scope unambiguous for humans and agents.

Statuses:
- **Shipped**: current `packages/frey` behavior (or comparable functionality already present)
- **v3 target**: actively planned for v3 with the rewrite + tests
- **Planned**: roadmap items not blocking v3
- **Rejected / out of scope**: decided out of scope (fill via Q&A)

### Architecture stance (v3)
- **Batteries included**: SSE, WebSockets, CQRS, Redis cache, auth, Swagger/OpenAPI, etc. live in the main `frey` package with full tests.
- **Default-off policy (strict)**:
  - Only **base entity generation** is enabled by default.
  - Everything else must be explicitly enabled in the same server registration/start options object.
  - Entity `customRoutes` are part of **base generation** (no extra startup flag).
- **Default-on (base entity generation)**:
  - Automatic REST CRUD from `defineEntity` for the handlers that exist.
  - Zod validation where applicable.
  - Parameter parsing.
  - Context with `request` + `server` and a neutral auth stub when auth is off.
  - **HATEOAS / pagination links** are base behavior for paginated `findAll` list flows (no extra feature flag; exact shape is TDD-locked).

### Security posture
- **No insecure defaults**.
- Baseline protections + dedicated integration tests so common misconfigurations are avoided.
- CSRF rules depend on auth mode (cookie vs bearer) and are documented/implemented where relevant.

---

## A1) A. Core entity and HTTP (REST)

| Feature | Status | Notes |
| --- | --- | --- |
| `defineEntity` + `Entity` type with Zod object schema | **Shipped** | `customId` for non-`id` primary keys |
| Generated plural routes (`/users`, …) | **Shipped** | Routes registered only if handler exists |
| `GET` list (`findAll`) with query parsing | **Shipped** | `parse-params` + entity semantics |
| `GET` by id (`findOne`) | **Shipped** |  |
| `POST` create (`create`) | **Shipped** |  |
| `PUT` update (`update`) | **Shipped** |  |
| `DELETE` (`delete`) | **Shipped** |  |
| Query params: filters, order, search, limit, offset | **Shipped** | `parse-params` + entity semantics |
| Request/body validation against schema | **Shipped** |  |
| `Context`: `request`, `server`, `auth` | **Shipped** |  |
| Custom routes per entity (method, path, auth overrides) | **Shipped** | Part of base generation |
| Custom per-status error payloads (`customErrors`) | **Shipped** |  |
| Content negotiation | **JSON default** | v3 focuses on JSON; other formats deferred unless tests demand |
| **HATEOAS / pagination links** | **v3 base** | Always on for paginated list responses; exact format via TDD |

---

## A2) B. Security and auth

| Feature | Status | Notes |
| --- | --- | --- |
| Optional global auth (`AuthConfig`) | **Shipped** |  |
| JWT validation middleware | **Shipped** | Via `jsonwebtoken` |
| API key validation | **Shipped** |  |
| Auth context on request (`user`, `isAuthenticated`, method) | **Shipped** |  |
| Per-entity and per-custom-route auth overrides (`requireAuth`, `jwtOnly`, `apiKeyOnly`, `customAuth`) | **Shipped** |  |
| RBAC: roles, `All` / `Own` / `Custom`, `ownerField` | **Shipped** | plus customChecks |
| `customChecks` per operation | **Shipped** |  |
| `FREY_ROLES`, `createRoleConstants`, etc. | **Shipped** |  |
| Standardized error codes / shapes | **Shipped (partial)** | align v3 with one canonical envelope |
| **OAuth2 / OIDC** | **v3 core** | core integration + provider plugin system; must ship at least one reference/test provider plugin |
| **CSRF / security headers** | **v3 core** | secure-by-default posture + dedicated integration tests |

---

## A3) C. Documentation and discovery

| Feature | Status | Notes |
| --- | --- | --- |
| OpenAPI 3.0 generation (`@fastify/swagger`) | **Shipped** |  |
| Swagger UI (`@fastify/swagger-ui`) | **Shipped** | Optional `routePrefix`, `uiConfig` |
| Protect Swagger UI | **Shipped** | redirect to `loginUrl` / `/login` when doc auth is enabled |
| Tagging / grouping by entity | **Shipped** |  |
| Admin web UI for data | **v3 target** | monorepo app + `frey` CLI |
| API versioning | **v3 target** | default URL prefix convention (e.g. `/v1/...`) |
| Client SDK story | **v3 target** | OpenAPI export + openapi-generator (no bespoke multi-lang generator in core) |

---

## A4) D. Ops, performance, and platform

| Feature | Status | Notes |
| --- | --- | --- |
| BYO `FastifyInstance` + current `startServer` calls `listen` | **Shipped** | v3 splits register vs listen and avoids side effects |
| CORS | **v3 target** | core helper, opt-in |
| **Redis caching** | **v3 core** | batteries included; opt-in; includes invalidation contracts |
| In-memory cache layer | **v3 core** | l1 / dev path; opt-in unless implied by enabling Redis |
| Health checks / readiness / liveness | **Planned** |  |
| Rate limiting | **Planned** |  |
| **OpenTelemetry** | **v3 target** | observability spine; default-off until explicitly enabled |
| **Prometheus** | **v3 target** | via OTel/exporter docs; avoid second ad-hoc metrics stack |

---

## A5) E. Developer experience and tooling

| Feature | Status | Notes |
| --- | --- | --- |
| CLI scaffolding | **Planned** |  |
| VS Code extension | **Planned** |  |
| Hot reload / dev server | **Planned** |  |
| Test utilities exported from `frey` | **Planned** | e.g. `buildTestApp` |
| Codegen from DB or OpenAPI | **Planned** |  |

---

## A6) F. Alternative API styles and real-time

| Feature | Status | Notes |
| --- | --- | --- |
| REST CRUD | **Shipped** |  |
| **CQRS compatibility** | **v3 core** | commands/queries/events; opt-in default-off |
| **WebSocket** | **v3 core** | batteries included; opt-in default-off |
| **SSE** | **v3 core** | batteries included; opt-in default-off |
| GraphQL | **Rejected** | out of scope (dropped) |

---

## A7) G. Testing and quality (v3 process — not user features)

| Feature | Status | Notes |
| --- | --- | --- |
| Unit + integration tests | **Shipped** |  |
| Coverage thresholds in CI | **Not shipped** | v3 target |
| Chaos / fuzz / robustness tests | **Not shipped** | v3 target (library-appropriate) |
| Multi-runtime (Node + Bun) | **Documented** | v3 must preserve or document exceptions |

---

## A8) H. Consolidated v3.0.0 checklist (from docs + decisions)

### Parity with current behavior when flags are on
Entity/Zod, CRUD, entity `customRoutes` (base), params, auth (JWT + API key), RBAC + ownership + custom checks, OpenAPI + Swagger UI + doc auth, standardized errors, BYO Fastify lifecycle split (register vs listen), type safety, npm distribution.

### Default-off principle
Only base entity generation is enabled by default.

### Core (new — batteries in package; all default-off)
- **CQRS compatibility** — explicit enable in registration/start options; includes command/query/event flows + tests.
- **Redis caching** + **in-memory** layer — explicit enable; no implicit Redis connection.
- **WebSockets** and **SSE** — explicit enable; full integration tests.

---

## 8) v3 initiative (pointer)

v3 implementation principle:
- **Rewrite from scratch** with TDD.
- Avoid line-by-line ports of legacy code—tests define new behavior.

This document should stay the “single source of truth” for what is:
- already present
- a v3 target (actively rewritten)
- and explicitly out of scope

