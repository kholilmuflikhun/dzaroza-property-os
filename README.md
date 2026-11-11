# Dzaroza Property OS

Independent private operations platform for Dzaroza Property.

## Project boundaries

- This repository owns authentication, organizations, tenant isolation, RBAC, CRM, clients, projects, quotations, finance, invoices, payments, licensing, document management, audit trails, and client portal capabilities.
- The public website lives in the separate repository: [dzaroza-property](https://github.com/kholilmuflikhun/dzaroza-property).
- Public website integration must use authenticated, versioned HTTPS APIs.
- Do not merge public marketing pages or public website assets into this repository.

## Source preservation

The legacy repository `kholilmuflikhun/dzarozaproperty` is the read-only migration source. Do not push, merge, rebase, or create commits there.

OS source lineage:
- Monorepo integration PR: [#26](https://github.com/kholilmuflikhun/dzarozaproperty/pull/26)
- Integration source commit: `d183301fc44e4566c52e8e50884b7f6a681f4ab2`
- DMS hardening PR: [#27](https://github.com/kholilmuflikhun/dzarozaproperty/pull/27)
- DMS hardening commit: `73aa1e937a80fa86e455817cda78a0a842ec81ce`
- Project/document access policy PR: [#29](https://github.com/kholilmuflikhun/dzarozaproperty/pull/29)
- Access policy commit: `7e35a55deec543fd74e9ab698fdc8a86fba11cb9`

The access-policy branch currently has a known TypeScript parser failure in `apps/ops/src/lib/document-access-query.ts` at line 54. This must be corrected and tested before that change is accepted into the independent OS repository.

## Security and deployment rules

1. Preserve tenant isolation and server-side authorization.
2. Enforce RBAC and object-level access on every API route.
3. Keep documents private; use short-lived signed URLs.
4. Do not expose database credentials, auth secrets, or storage keys.
5. Never run Production migrations or deploy from Phase 0.
6. Require migration review, typecheck, unit/integration tests, production build, and security tests before merge.
