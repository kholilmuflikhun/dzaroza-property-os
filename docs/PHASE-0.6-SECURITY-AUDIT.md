# Phase 0.6 — Security, Integration & Release Readiness Audit

**Branch:** `feat/phase-0-source-preservation`  
**Scope:** repository code, API authorization, tenant boundaries, Prisma migrations, CI-only integration checks.  
**Production impact:** none. No production deployment, DNS mutation, live database migration, or secret rotation was performed.

## Approved access model applied

| Role | Effective scope |
|---|---|
| Owner / Admin | Organization-wide management and visibility |
| Finance | Organization-wide financial records and invoice documents |
| Project Manager | Assigned projects only; read-only financial data for actively assigned projects |
| Sales | Active Sales client grants; related client/project/quotation reads and CRM leads |
| Staff | Actively assigned projects; own unlinked uploads and own upload finalization |
| Client | Explicit Client Portal grants; linked project/document read and download only |

### Assignment administration

- Owner/Admin can manage assignments across the organization.
- A Project Manager can manage assignments only for projects with their active `PROJECT_MANAGER` assignment.
- Project Managers cannot appoint another Project Manager or revoke another Project Manager assignment.
- Projects created by a Project Manager receive an active PM assignment for the creator in the same transaction.
- Project Manager project updates require an active assignment.

## Security fixes implemented

### Tenant and role-scoped data access

- Client lists are scoped by Owner/Admin/Finance, active PM project assignment, Staff contributor/viewer assignment, Sales grant, or Client Portal grant.
- Project lists and detail reads use the corresponding role scopes.
- Quotation lists/details are restricted to Finance/Owner/Admin, assigned Project Managers, and Sales users with an active client grant.
- CRM lead reads are restricted to Owner/Admin/Sales; Staff and Client Portal users are denied.
- Organization dashboard counts follow the caller's permitted client/project/invoice scopes. Sales pipeline counts are not exposed to Finance or Project Managers.
- Finance APIs are restricted to Owner/Admin/Finance/Project Manager. Project Manager invoice, payment, expense, and summary reads are filtered to active assigned projects. Project Managers cannot create invoices or initiate invoice checkout.

### Document access and storage

- Finance has organization-wide invoice-document access.
- Project Managers can read/download invoice documents only for actively assigned projects; invoice operations remain read-only.
- Sales and Client Portal users require explicit active client grants. Read-only downloads are permitted; upload/finalize operations are denied.
- Staff access is limited to assigned project files and their own unlinked uploads. Unlinked uploads from Finance, Project Manager, Sales, and Client roles are denied.
- Document query authorization and the policy helper have matching unlinked-document rules.
- Tenant-scoped upload/download queries continue to require the active organization and document status.

### Website and payment controls reviewed in the companion Website repository

- Midtrans webhook fails closed when the server key is absent; signature format and signature digest are validated before order lookup.
- Card capture is not marked paid unless Midtrans reports `fraud_status=accept`.
- Unknown/inherited transaction status names are ignored safely.
- Delayed webhook events cannot downgrade terminal order states.
- Testimonial submissions are bound to an authenticated Google account; submitted email must match the session, and verified profile identity is preferred over caller-supplied identity.
- Rate-limit identity uses trusted `cf-connecting-ip` / `x-real-ip` headers, not caller-controlled left-most `x-forwarded-for`.
- Public production submission/upload endpoints fail closed if the distributed Upstash rate-limit store is not configured.

## Database and CI validation

The OS quality workflow provisions a disposable PostgreSQL 16 service and runs:

1. Frozen pnpm install.
2. Prisma Client generation.
3. Full `prisma migrate deploy` migration chain against the disposable database.
4. `tenant-integrity.sql` relational/tenant integrity assertions.
5. TypeScript.
6. Unit and integration tests.
7. Production build without deployment.

The successful run on the audited branch passed the migration chain, tenant-integrity assertions, TypeScript, tests, and build. Test result at the last verified code checkpoint: **42 test files, 243 tests passed**.

## Release boundary and remaining validation

- Both new repositories remain isolated from the legacy source repository.
- No production deployment, DNS update, live database access, or production secret change was performed.
- Draft PRs remain unmerged.
- External Midtrans sandbox delivery, live Cloudflare/R2 credentials, actual Vercel/Cloudflare deployment behavior, and browser-based end-to-end permission checks are not certified by this CI run.
- Before release, run staging-only browser/API checks for Owner, Admin, Finance, Project Manager, Sales, Staff, and Client Portal identities; verify R2 presign/finalization/download behavior and webhook sandbox callbacks. Do not point tests at Production.

**Release recommendation:** keep the PR in Draft until staging verification and the final human review of role-specific UI/API flows are complete.
