# File System App Server

Express + TypeScript API for a nested folder/file tree stored in PostgreSQL. A file is a name only — there is no file content.

## Prerequisites

- Node.js 22+
- PostgreSQL 16+

## Setup

```bash
cd file-system-app-server
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
```

`DATABASE_URL` and `CLIENT_URL` are required. The process refuses to start if they are missing. Tests load `.env.test` instead (committed; points at `mydb_test` with the local compose credentials).

A local Postgres instance (from this directory):

```bash
docker compose up -d
```

That starts Postgres 16 on `localhost:5432` (`mydb` / `myuser` / `mypassword` in this directory's `docker-compose.yml`). Copy `.env.example` to `.env` as-is, or point `DATABASE_URL` at `mydb`. Tests create `mydb_test` themselves if it is missing.

The parent repo's `docker-compose.yml` is the full deploy stack (Traefik + API + client). It does **not** publish Postgres to the host.

## Running (debug)

Apply migrations first, then start in watch mode:

```bash
npm run migrate:up
npm run dev
```

That compiles TypeScript in watch mode and restarts `dist/main.js` after a successful compile. The API listens on `PORT` (default `3000`).

From the parent repo:

```bash
npm run dev:server
```

Production-style compile and run (env comes from the environment or `.env`, not a baked-in file):

```bash
npm run build
npm start
```

Lint / tests:

```bash
npm run lint
npm test
npm run test:stress
```

Tests use `.env.test`, not `.env`. Default `DATABASE_URL` is `mydb_test` (same user/password as docker compose). The runner refuses a database whose name does not end in `_test`, creates that database if needed, applies pending migrations, then truncates `folders` and `files` between cases. Running tests while `npm run dev` is up will not wipe app data.

`npm test` always fires 50 concurrent unique `POST /folders` (at root and under one parent) and expects every request to return 201. `npm run test:stress` ramps 10 → 400 in-flight creates and prints created/failed, elapsed time, req/s, and p50/p95 latency. That is one Node process talking to Postgres through the default `pg` pool (max 10 connections); extra requests queue on the pool. It is not a multi-host production load test.

## Migrations

Migrations live in `migrations/` and are run with [node-pg-migrate](https://github.com/salsita/node-pg-migrate). Config is `src/database/node-pg-migrate-config-file.json`. It loads `.env` and uses `DATABASE_URL`. Applied migrations are recorded in `pgmigrations`.

Run these from `file-system-app-server/`.

```bash
npm run migrate:up      # all pending
npm run migrate:up-1    # next one only
npm run migrate:down    # roll back the most recent
npm run migrate:create -- short-description
```

New SQL files go under `migrations/` with `-- Up Migration` / `-- Down Migration` sections.

Existing migrations:

1. `first-migration` — `folders` and `files`, unique names per parent (`NULLS NOT DISTINCT`), folder `path` maintained by triggers, prefix index on `files.name`
2. `name-checks-and-path-cascade` — `CHECK` that names are 1–255 chars and contain no `/` or `\`; path cascade uses `starts_with` so names containing `%` / `_` cannot match extra rows

## Docker

This directory's `Dockerfile` compiles TypeScript and runs `node ./dist/main.js`. It does **not** bake env files into the image — pass `DATABASE_URL`, `CLIENT_URL`, and `PORT` at runtime.

This directory's `docker-compose.yml` is local Postgres only.

The parent repo's `docker-compose.yml` is the deploy path: Postgres, a one-shot migrate container, the API, and the client behind Traefik. Postgres stays on the internal network.

## API

Base path: `/api/v1`. JSON bodies are capped at 32kb. Unknown routes return `{ "error": "Not found" }`.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/browse?path=` | List a folder (or root) by path |
| POST | `/folders` | `{ name, parentId? }` → 201 |
| DELETE | `/folders/:folderId` | Cascade delete; 200 + `{ message }` (the client uses the body) |
| POST | `/folders/:folderId/files` | Create a file in a folder |
| GET | `/folders/:folderId/files/search?name=` | Exact name in that folder |
| GET | `/folders/:folderId/files/search/prefix?q=` | Prefix typeahead, top 10 |
| POST | `/files` | `{ name, folderId? }` — omit `folderId` for root |
| GET | `/files/:fileId` | |
| DELETE | `/files/:fileId` | 200 + `{ message }` |
| GET | `/files/search?name=` | Exact name globally |
| GET | `/files/search/prefix?q=` | Prefix typeahead globally, top 10 |
| GET | `/files/search/prefix?q=&root=true` | Prefix typeahead among root files only |

Status codes: 201 create, 400 validation, 404 missing / missing parent, 409 duplicate name, 500 unexpected (PG internals are not leaked).

## Code structure

```
src/
  main.ts                 Path alias `@/`, then start the server
  server.ts               Listens on config.port
  app.ts                  CORS, routes, JSON 404, error handler
  config/config.ts        Zod-parsed PORT, DATABASE_URL, CLIENT_URL, CORS
  database/               pg Pool (getPool / closePool) and migrate config
  controllers/            HTTP routes, grouped by URL path
  services/               Existence checks, path parsing
  repositories/           SQL against folders / files
  router/                 Typed Express wrapper
  errors/                 AppError
  middleware/             Error handler + JSON 404
  utils/validation.ts     Shared Zod schemas
migrations/               SQL migrations
tests/                    Integration tests (vitest + supertest)
```

Request flow: **controller → service → repository → PostgreSQL**.

Path alias `@/` maps to `src/` (`tsconfig` paths plus `module-alias` at runtime).

Controllers validate with Zod and use the parsed values (including trimmed names). Unique names, foreign keys, and name CHECKs are enforced in Postgres; `23505` → 409, `23503` → 404, `23514` → 400.

## Trade-offs

- **No auth.** Out of scope for the assignment. The API is open to whoever can reach it.
- **Files are names only.** No bytes, MIME types, or versions.
- **A file and a folder may share a name in the same directory.** Uniqueness is per table (`files` vs `folders`), which matches the brief. A real OS usually forbids that.
- **Folder listing is unbounded.** `GET /browse` returns every child. Fine for the current UI; a large directory would need pagination.
- **Prefix search is case-sensitive SQL `LIKE`** with a `text_pattern_ops` index. That matches “starts with” at scale; it is not fuzzy or case-insensitive.
- **No rename/move HTTP API.** The path trigger is still written so a later rename would keep descendants consistent.
- **DELETE returns 200 + a message** rather than 204, because the existing client reads a JSON body.
- **Names like `.` and `..` are allowed.** They are opaque strings, not path traversal. Browse never walks `..` to a parent.
