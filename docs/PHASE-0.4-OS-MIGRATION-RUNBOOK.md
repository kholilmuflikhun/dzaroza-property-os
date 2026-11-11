# Phase 0.4 — Dzaroza Property OS source migration runbook

## Safety boundary

- Legacy source repository: `kholilmuflikhun/dzarozaproperty` (read-only).
- Target repository: `kholilmuflikhun/dzaroza-property-os`.
- Do not push to the legacy repository.
- Do not run database migrations against Production.
- Do not configure or trigger Production deployment in this phase.

## Pinned source lineage

The intended OS snapshot includes the following open Draft PR lineage in the legacy repository:

- Monorepo integration PR #26 head: `d183301fc44e4566c52e8e50884b7f6a681f4ab2`.
- DMS hardening PR #27 head: `73aa1e937a80fa86e455817cda78a0a842ec81ce`.
- Project/document access policy PR #29 head: `7e35a55deec543fd74e9ab698fdc8a86fba11cb9`.

These PRs are not merged into legacy `main`. Importing this snapshot is a deliberate feature-branch operation, not a claim that the work is production-ready.

## Expected source paths

- `apps/ops/` → target repository root.
- `packages/database/` → target `packages/database/`.
- `packages/shared/` → target `packages/shared/`.
- Root workspace configuration required by the OS app (including `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and relevant TypeScript/config files) must be reviewed and imported selectively.

## Local Git transfer

Run from a machine with Git and authenticated access to both repositories. Use a temporary directory so the legacy checkout remains untouched.

```bash
set -euo pipefail
WORK="$(mktemp -d)"
git clone https://github.com/kholilmuflikhun/dzarozaproperty.git "$WORK/legacy"
git clone https://github.com/kholilmuflikhun/dzaroza-property-os.git "$WORK/os"
git -C "$WORK/legacy" fetch origin
git -C "$WORK/legacy" cat-file -e 7e35a55deec543fd74e9ab698fdc8a86fba11cb9^{commit}
git -C "$WORK/os" checkout feat/phase-0-source-preservation

mkdir -p "$WORK/os-source/app" "$WORK/os-source/packages"
git -C "$WORK/legacy" archive 7e35a55deec543fd74e9ab698fdc8a86fba11cb9 apps/ops | tar -x -C "$WORK/os-source/app" --strip-components=2
git -C "$WORK/legacy" archive 7e35a55deec543fd74e9ab698fdc8a86fba11cb9 packages/database packages/shared | tar -x -C "$WORK/os-source"
```

Copy the contents of `$WORK/os-source/app/` to the target repository root and copy `$WORK/os-source/packages/` to target `packages/`. Then selectively export and review the root workspace configuration from the same pinned source commit. Preserve target `README.md` and `docs/` intentionally. Review all conflicts before committing; never use `git push --force`.

## Mandatory blockers before merge

1. The legacy PR #29 source contains a previously observed TypeScript parse failure in `apps/ops/src/lib/document-access-query.ts` (reported as TS1005 near line 54). Re-run the compiler on the imported tree and repair on the target feature branch only.
2. Validate Prisma schema and migration history without applying migrations to any live database.
3. Run tenant-isolation, RBAC, document-access, API enforcement, unit, and integration tests.
4. Run `pnpm install --frozen-lockfile`, typecheck, lint, tests, and production build after establishing a standalone lockfile.
5. Audit all environment variables and external integrations. Never copy secrets from legacy settings or commit them.
6. Verify that the OS has independent database, storage, authentication/session configuration, and deployment environment before any release.

## Important

The pinned source is a development snapshot assembled from unmerged Draft PRs. It must remain a Draft PR in the target until the parse error, authorization tests, migration review, and independent-environment checks are all green.
