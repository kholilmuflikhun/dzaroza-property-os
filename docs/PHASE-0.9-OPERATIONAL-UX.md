# Phase 0.9 — Operational UX & Data Interaction

## Scope
Improve daily Finance and Sales interactions without changing database schema, API authorization, tenant boundaries, approved RBAC policy, or credentials.

## Implemented
- Added a reusable searchable selector with visible labels and stable ID values.
- Replaced the manual Project ID field in invoice creation with a tenant-authorized project selector.
- Replaced manual Client ID and optional Project ID fields in quotation creation with searchable selectors.
- Loads client and project options from the existing organization-scoped API routes; no new data endpoint or authorization bypass was introduced.
- Resets the selected quotation project when the client changes.
- Filters quotation project options to the selected client. The quotation API independently validates that the project belongs to the selected client.
- Added a reusable semantic status badge for invoice and quotation statuses.
- Extended the quality-gate workflow trigger to this Phase 0.9 branch.

## Security and data boundaries
- Existing API routes remain the source of truth for tenant scoping and role enforcement.
- Client and project options are fetched from organization-scoped endpoints using the current session.
- Invoice creation still relies on the existing Finance/Owner/Admin API permission checks.
- Quotation creation still relies on existing Sales/Project Manager/Owner/Admin API permission checks and project assignment constraints.
- No RBAC policy, migration, schema, Production database, Production deployment, DNS, or secrets were changed.
- No credentials or authentication setup were requested.

## Validation
- Pending GitHub Actions quality gates on this branch.
- Preview visual verification remains blocked by the known branch-scoped `DIRECT_URL` prerequisite. No Preview environment values were changed.
- No browser-based responsive audit is claimed.

## Follow-up
1. Review CI results and fix any TypeScript, lint, test, or build regression.
2. Complete keyboard interaction and assistive-technology checks for searchable selectors in a real browser.
3. Validate the selector UX at desktop, tablet, and mobile widths when an authorized Preview session is available.
4. Consider adding server-side pagination/search to the existing clients/projects API routes when the organization data volume requires it.
