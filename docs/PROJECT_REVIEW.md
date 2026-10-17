# DevBoard: architecture and hardening review

Reviewed against the local source on 17 October 2026. This is a source and local runtime review; production infrastructure and real user data were not inspected.

## Product and architecture

DevBoard connects project owners with developers through scoped listings and pitches. A user can act as both an owner and an applicant; there are no separate role accounts. The critical journey is registration → listing → application → owner decision → project lifecycle update.

| Area | Implementation | Important boundary |
| --- | --- | --- |
| Public discovery | Next.js 16.2.4 App Router; server-rendered feed and project detail | The Next server fetches the Express API without a browser session. |
| Account and private workspace | React 19.2.4 client components, profile, dashboard, editor and review panels | JWT is in sessionStorage, so browser code attaches it to requests. |
| API transport | `client/lib/api.js` | Normalizes the API URL, serializes JSON, adds bearer auth; errors currently lose HTTP status. |
| Authentication | Express 5, bcrypt, seven-day JWT | Server signature verification provides authorization; client token decoding is only a display convenience. |
| Persistence | PostgreSQL through `pg` | Users own projects; applications join users to projects with a unique pair constraint. Deletes cascade. |
| Delivery | README describes Vercel client and Railway API/database | Deployment settings were not independently verified. |

The project already has parameterized SQL, owner checks, password hashing, public/private route separation, loading states, and a database uniqueness constraint preventing duplicate applications. These are useful foundations to preserve.

## Lifecycle contract enforced by this pass

- Only the owner reviews applicants or edits a project. Owners cannot apply to their own listings.
- Applications can be submitted only while a project is open.
- Accepting an applicant changes the project to `in_progress` and rejects remaining pending applications in one transaction.
- A project can have at most one accepted applicant through these API routes. A conflicting acceptance returns 409; repeating the same decision is idempotent.
- Accepting an applicant on a manually closed project returns 409.
- Rejecting an accepted applicant reopens an `in_progress` project when no accepted applications remain. Rejecting a pending applicant does not reopen a manually closed project.
- An owner cannot reopen a project while it still has an accepted applicant.
- Submissions, reviews, and project edits lock the project row before modifying related state. Separate API processes coordinate through PostgreSQL, not process-local locks.

This does not repair historical duplicate acceptances, and direct SQL writes can still violate the single-winner rule. Audit existing data before adding a partial unique index as a database-level backstop. No existing database was migrated in this review.

## Improvements implemented

1. Added a shared transaction helper with rollback and connection release. Reworked application submission, review and project editing around a consistent project-row lock.
2. Added JSON body, UUID, text, calendar date, tech stack, integer budget and pagination validation. Bad inputs return 400 rather than causing type errors or database failures. Valid zero budgets and partial updates remain supported.
3. Limited new passwords to bcrypt's 72-byte input boundary and handled concurrent duplicate registration with 409. Login also rejects passwords beyond this boundary; legacy users who registered longer passwords need an explicit recovery strategy.
4. Hid unexpected internal error messages from clients, required JWT_SECRET at server startup, and removed the unused owner email field from public project detail. Applicant email remains available only to the authenticated owner.
5. Preserved `in_progress` and zero budget in the project editor. Applicant review screens reload the authoritative saved state; project detail refreshes after successful review/submission.
6. Added repeatable unit and real PostgreSQL HTTP regression tests. Migration failures now return a nonzero exit code and close the connection pool.

## Remaining priorities

| Priority | Finding and consequence | Next work |
| --- | --- | --- |
| High | No login/register abuse protection, session revocation, password reset or email verification | Define account recovery and session policy; add deployment-aware rate limiting with shared storage before scaling instances. |
| High | `fetchMyProjects()` fetches only the default six records; dashboard and profile silently omit older projects and profile totals undercount | Add paginated private-project UI and use API totals for counts; paginate applications too. |
| High | Token decoding ignores expiry; editor reads its token only once; several private views mask API failures with stale or empty data | Centralize authenticated user state and 401 handling, clear stale data on account changes, add browser tests for login/logout/expiry. |
| High | No migration history or database constraint for one accepted applicant; nullable foreign keys and project status lack comprehensive constraints | Audit existing data, introduce versioned transactional migrations, then enforce invariants at the database layer. |
| Medium | Public list includes closed and in-progress projects despite “Open opportunities” copy; Next link is shown even after the final page | Decide discovery semantics and wire controls to the API's `hasMore`. |
| Medium | Project detail treats every API failure as a 404; API helper accepts malformed successful responses as null | Preserve HTTP status, distinguish outage from absence, add retryable error boundaries and response checks. |
| Medium | Review buttons permit repeated in-flight clicks; asynchronous component loads lack stale-response guards | Add pending states and cancellation/identity guards with browser regression coverage. |
| Medium | Database config hardcodes SSL off and falls back to a developer-specific local connection string | Require explicit production configuration, support verified TLS, readiness checks, connection timeouts and graceful shutdown. |
| Medium | No CI, deployment smoke checks, structured observability or documented backup restore exercise | Automate checks, then verify restores and staging rollout procedures before claiming production readiness. |
| Low | Zero budgets elsewhere render as “Flexible”; date formatting depends on timezone; README screenshots and some feature notes were stale | Standardize money/date formatting and finish documentation cleanup. |

Do not add messaging, notifications, or other large features until the existing account and marketplace flows have browser coverage and reliable deployment checks.

## Verification and how to rerun

From the repository root:

```sh
npm test --prefix server
npm run check --prefix server
npm run lint --prefix client
npm run build --prefix client
```

To run database-backed tests, point TEST_DATABASE_URL at a **disposable development PostgreSQL database**:

```sh
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/devboard_test npm test --prefix server
```

The integration test creates a uniquely named schema, runs the migration there, starts an ephemeral loopback HTTP server and drops its schema on completion. It never truncates existing tables. The migration can install pgcrypto if absent; use only a disposable database. Without TEST_DATABASE_URL, the database test explicitly skips and the three unit tests still run.

Locally verified: all eight reported tests passed with real PostgreSQL 15, server syntax checks passed, client lint passed, and the production build including TypeScript passed. The rollback test deliberately raises a PostgreSQL exception; its server log is expected. The build used the installed WASM fallback because the native macOS SWC binary was absent. Browser interaction and deployed-environment tests remain outstanding.
