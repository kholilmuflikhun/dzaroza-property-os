# Phase 1.1 — Operational Detail & Workflow Enhancement

## Objective
Provide a useful detail workspace for invoices and quotations, with a tenant-scoped audit activity timeline, without changing the database schema or the approved authorization policy.

## Delivered
- Added invoice detail page with totals, balance, due/issued dates, line items, client/project/source quotation, and settled payment history.
- Added quotation detail page with client/project information, line items, subtotal, discount, tax, total, and issued date.
- Added an activity timeline to both detail pages (up to 50 latest audit events).
- Added a tenant-scoped activity read endpoint. It verifies access to the target invoice or quotation before returning activity metadata.
- Reused existing invoice and quotation detail APIs and their authorization predicates.
- Added navigation links from both operational lists to their detail pages.
- Invoice detail now includes client contact fields when its source is a quotation without a project.

## Security and data boundaries
- Activity endpoint only returns action, timestamp, and actor display name; it does not expose before/after JSON state or metadata.
- Invoice access is checked using `requireFinanceRead` and `authorizedInvoiceWhere`.
- Quotation access is checked using `requireTenantContext` and `authorizedQuotationWhere`.
- No database schema or migration changes.
- No RBAC, tenant policy, or write-action behavior changes.
- No Production, DNS, Production database, credentials, or secrets touched.
- No authentication-dependent end-to-end tests attempted.

## Validation
- Existing detail APIs reviewed and reused.
- CI quality gates are configured for the Phase 1.1 branch.
- TypeScript, unit tests, migration checks, tenant-integrity checks, and production build must pass before this phase is considered CI-verified.
- Browser visual/responsive and assistive-technology QA remain pending due to the existing Preview SSO limitation.
- Vercel Preview may remain blocked at `db:deploy` by branch-scoped missing `DIRECT_URL`; no environment settings were changed.

## Follow-up
- Verify the Phase 1.1 GitHub Actions run.
- Review Preview deployment status without changing environment configuration.
- Perform browser visual, keyboard, and screen-reader QA when an authorized Preview session is available.
