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

## 8) v3 initiative (pointer)

v3 implementation principle:
- **Rewrite from scratch** with TDD.
- Avoid line-by-line ports of legacy code—tests define new behavior.

This document should stay the “single source of truth” for what is:
- already present
- a v3 target (actively rewritten)
- and explicitly out of scope

