# Portugal Fuel Finder

Compare petrol, diesel, and electric charging prices across Portugal and find the best nearby stop for your route.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/portugal-fuel-finder` — React/Vite web app with discovery, station detail, and regional comparison views
- `artifacts/api-server/src/routes/stations.ts` — station search, station detail, summary, and regional endpoints
- `artifacts/api-server/src/lib/station-data.ts` — initial Portugal station snapshot and seed data
- `lib/api-spec/openapi.yaml` — source of truth for the station API contract
- `lib/db/src/schema/stations.ts` — PostgreSQL station table definition

## Architecture decisions

- The frontend consumes generated React Query hooks from the shared OpenAPI contract.
- Station search supports both place text and browser coordinates; when coordinates are available, ranking balances price with driving distance.
- The first release uses a curated Portugal-wide snapshot seeded into PostgreSQL so the user experience is populated immediately.
- Prices are labeled with their update timestamp in the UI so a future live data importer can replace the snapshot without changing the product surface.

## Product

- Compare petrol, diesel, and EV charging prices.
- Search by Portuguese town, city, or district and optionally use current location.
- Filter by distance, sort by best match, lowest price, or closest station.
- Inspect station details, amenities, opening hours, EV power, and directions.
- Compare fuel price snapshots by district on the Regions page.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Regenerate API clients after changing `lib/api-spec/openapi.yaml`.
- The seeded prices are an indicative snapshot; they are not a live government or operator feed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
