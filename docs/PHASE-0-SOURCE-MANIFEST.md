# Phase 0 — OS Source Manifest

Status: source identified; extraction and validation pending.

## Authoritative source lineage

| Layer | Source |
|---|---|
| Monorepo integration | PR #26, commit `d183301fc44e4566c52e8e50884b7f6a681f4ab2` |
| DMS integrity hardening | PR #27, commit `73aa1e937a80fa86e455817cda78a0a842ec81ce` |
| Project/document policy | PR #29, commit `7e35a55deec543fd74e9ab698fdc8a86fba11cb9` |
| Legacy repository | `kholilmuflikhun/dzarozaproperty` |

## Preserve

- Authentication and session handling.
- Organization membership and role-based access.
- Tenant-scoped database schema and constraints.
- CRM, clients, leads, projects, quotations, finance, invoices, payments.
- Subscription and licensing.
- Private document storage and DMS finalization.
- Audit logs and client portal.
- Project assignment and client access policies.
- Existing API tests and integration tests.

## Known blocker

The latest access-policy commit has a TypeScript syntax error:
`apps/ops/src/lib/document-access-query.ts:54:4 — TS1005: ',' expected`.

The affected file must be repaired on a new OS feature branch, then validated. Do not silently omit PR #29 or treat its current CI as passing.

## Database safety

- Preserve Prisma schema and migration history.
- Do not run migrations against Production.
- Do not reset, truncate, or seed a connected Production database.
- Validate migration history against a disposable Preview/test database first.
- Keep `DATABASE_URL`, `DIRECT_URL`, OAuth secrets, Midtrans keys, and R2 credentials outside Git.

## Next validation

1. Extract the OS subtree from the pinned monorepo source commit.
2. Include reviewed DMS/security changes in a separate patch series.
3. Verify migration ordering and tenant constraints.
4. Fix the TypeScript parser error.
5. Run typecheck, unit/integration tests, and production build.
6. Perform tenant isolation and document access regression tests.
