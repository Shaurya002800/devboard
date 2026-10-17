# Hosting migration — 18 October 2026

## Destination

- Website: https://devboard-gamma-gilt.vercel.app (existing Vercel `devboard`, root `client`).
- API: https://devboard-api-tan.vercel.app (Vercel `devboard-api`, root `server`, Express preset).
- Database: dedicated Neon `devboard-db`, Free plan, US East region, linked only to the API production environment.
- Both projects are connected to `Shaurya002800/devboard`, production branch `main`.

The API's public production URL is the one above. Vercel's team and deployment aliases may require Vercel authentication; do not use them in NEXT_PUBLIC_API_URL. Existing deployment protection settings were preserved.

## Data and credentials

The Railway trial had expired and paused its services. The saved Railway CLI session was also expired. Its data could not be exported during this migration. The new database was initialized with the existing schema; it starts empty. The original Railway projects were not deleted or modified.

A new JWT signing secret was generated directly into Vercel. Existing tokens are not valid on this new backend. Credentials are stored in the API project's environment; database credentials must never be added to the frontend. Local server/.env and server/node_modules were previously tracked and are now removed from Git tracking. Their local copies remain; historical commits still contain the old local environment file. New production credentials do not reuse that file's secret.

To recover historical Railway data later, regain access and export it into a restricted backup. Restore it into a separate staging database first; inspect users, project ownership, application status consistency, ID collisions, and normalized email collisions before merging. Do not overwrite the new production database after users have started registering.

## Operations

- GET /api/health returns 200 only if a database query succeeds; failures return 503 without credentials or SQL details.
- Database TLS follows the supplied connection URL. The pool is limited to five connections per process, with a ten-second connection timeout and Vercel suspension cleanup.
- Run migrations explicitly with a securely supplied connection string; deployments do not automatically mutate the schema.
- After changing NEXT_PUBLIC_API_URL, rebuild the frontend because Next embeds this setting into browser assets.
- Keep a rollback deployment available, but an old deployment pointing to the paused Railway API will not restore service.
- Free plans have usage limits; no paid database plan was selected.

## Verification

The eight local regression tests passed against a disposable PostgreSQL database. The new production API passed HTTP smoke tests for database readiness, registration, login, current user, CORS, project creation, application submission, acceptance, project status updates, invalid IDs and deletion. Only synthetic test records were created, and those records were removed after testing. The server production dependency audit returned zero vulnerabilities; the development-only nodemon dependency chain still has advisories that require separate tooling work.
