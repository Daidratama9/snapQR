# SnapQR

SnapQR is a B2B event-photography platform. The current foundation includes staff authentication, organizations, event setup, participant/BIB/QR identity management, and photographer assignment. Photo handling, matching, galleries, AI, and social integrations are deliberately out of scope.

## Stack

- Next.js + TypeScript for the web application
- NestJS + TypeScript for the REST API
- PostgreSQL + Prisma for persistent data
- Redis is included locally for the later worker phase; no queue feature is implemented yet

## Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer (`corepack enable` then `corepack prepare pnpm@9.15.4 --activate`)
- Docker Desktop (for PostgreSQL and Redis)

## Run locally

1. Copy the environment template: `cp .env.example .env`.
2. Replace both JWT secrets with unique values of at least 32 characters.
3. Start local services: `docker compose up -d`.
4. Install packages: `pnpm install`.
5. Create the database schema: `pnpm db:generate && pnpm db:migrate`.
6. Start web and API: `pnpm dev`.
7. Open `http://localhost:3000`. The API health endpoint is `http://localhost:4000/health`.

## Authentication foundation

- Email/password registration and sign-in for staff accounts
- Argon2 password hashing
- Short-lived access token plus a rotated, hashed refresh-session cookie
- Login throttling and request validation
- Sign-out revokes the active refresh session

## Current operations foundation

- Organizations have a staff owner and role-scoped access.
- Events belong to exactly one organization and follow `DRAFT → ACTIVE → COMPLETED → ARCHIVED`.
- A participant's BIB is unique within an event, but may repeat across events.
- QR tokens are generated from cryptographically secure random data; regenerating a QR revokes the previous active token.

For a production environment, set secrets through the hosting platform rather than committing `.env`, use HTTPS, and set `NODE_ENV=production` so authentication cookies are secure.

## Project layout

```text
apps/web        Next.js staff sign-in and registration screens
apps/api        NestJS API and authentication module
packages/database Prisma schema and database tooling
```

## Checks

Run `pnpm lint`, `pnpm test`, and `pnpm build` before merging. The API test suite covers the authentication service's credential and session behavior.
