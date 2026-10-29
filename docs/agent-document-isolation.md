# Agent/document integrity increment

## Scope and threat boundary

Untrusted browser IDs are claims, not authority. Existing `auth.uid()` membership,
role policies and column grants authorize users. The new composite foreign key
also prevents a bypass-RLS writer from pairing a document with another
organization's agent. It does not authorize service-role reads, enforce storage
path structure, or certify ingestion/RAG. No UI or role grants are changed.

Sources: `src/lib/workspace.ts`, `src/features/agents/agent-service.ts`, migrations
`20260911185532_create_agent_platform.sql` and
`20260929175229_harden_agent_column_access_and_document_tenants.sql`.
No consumer of `knowledge_documents` or `agent-context` was found in the current
`supabase/functions` directory. There is no new worker or unused resolver here.
Before enabling processing, verify the real worker's authenticated actor/job,
organization, agent and document, then scope every privileged query accordingly.

## Permissions preserved

| Resource | owner/admin/editor | viewer | nonmember/anonymous |
| --- | --- | --- | --- |
| Agents | read/create/update permitted columns | read | deny |
| Document metadata | read/register | read | deny |
| Private PDF | upload/read/mint signed URL | deny | deny |
| Client agent deletion; document update/deletion; file replacement/deletion | deny | deny | deny |

Organization roles are not the legacy workspace roles. This increment does not
map organizations to workspaces, clients, tenants or client_bots. The three
historical bot records and their runtime configuration remain untouched.

## Reproducible disposable local integration environment

Requires Node (same version as the application), Docker's Linux engine running,
and Supabase CLI 2.122.0. Never load `.env` from the app or use remote keys.
The repository migration history contains legacy/external prerequisites, so this
test sandbox applies the two original, unmodified migrations for this bounded
resource family rather than claiming to reproduce the full production database.

From the repository root in PowerShell, create a new isolated CLI directory:

```powershell
$isolationRepo = (Get-Location).Path
$isolationDir = Join-Path ([IO.Path]::GetTempPath()) ('stage-isolation-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $isolationDir
npx --yes supabase@2.122.0 init --workdir $isolationDir
New-Item -ItemType Directory -Path (Join-Path $isolationDir 'supabase/migrations') -Force
Copy-Item -LiteralPath (Join-Path $isolationRepo 'supabase/migrations/20260911185532_create_agent_platform.sql') -Destination (Join-Path $isolationDir 'supabase/migrations')
Copy-Item -LiteralPath (Join-Path $isolationRepo 'supabase/migrations/20260929175229_harden_agent_column_access_and_document_tenants.sql') -Destination (Join-Path $isolationDir 'supabase/migrations')
npx --yes supabase@2.122.0 start --workdir $isolationDir
npx --yes supabase@2.122.0 status --workdir $isolationDir
```

Before any fixture writes, inspect `docker context inspect` (local named pipe,
not TCP/SSH), `docker ps` and `docker inspect` for the NEW project's container
labels, creation time, local ports and mounts matching `$isolationDir`. Verify
the new CLI project ID is unique, no old instance shares it, and the API port
belongs to that container, not SSH/port forwarding or a proxy. If any point is
uncertain, stop. Loopback and opt-in alone do not establish exclusive ownership.
No `reset`, remote/linked flag, tunnel, or reuse of an existing project is allowed.

Use only the local API URL and **legacy local** anon/service-role JWT keys from
that CLI instance. Set the variables in the process, never in tracked files:

```powershell
$env:STAGE_ISOLATION_URL = 'http://127.0.0.1:54321'
$env:STAGE_ISOLATION_ANON_KEY = '<local anon JWT>'
$env:STAGE_ISOLATION_SERVICE_KEY = '<local service_role JWT>'
$env:STAGE_ISOLATION_DISPOSABLE = 'YES'
$env:STAGE_ISOLATION_SCHEMA = 'baseline'
npm run test:integration
```

Baseline expectation: the privileged mismatched INSERT succeeds AND a readback
confirms the exact organization/agent mismatch persisted. It is then removed and
its absence confirmed. A network/schema error fails the test and does not count
as reproduction. The suite cleans only its own fixture IDs. If unrelated
tests fail, diagnose the local environment instead of widening permissions.
Then copy and apply only the new migration to that same disposable sandbox:

```powershell
Copy-Item -LiteralPath (Join-Path $isolationRepo 'supabase/migrations/20261029143618_enforce_document_agent_organization.sql') -Destination (Join-Path $isolationDir 'supabase/migrations')
npx --yes supabase@2.122.0 migration up --local --workdir $isolationDir
$env:STAGE_ISOLATION_SCHEMA = 'migrated'
npm run test:integration
```

The suite requires explicit opt-in, refuses non-loopback IPs and remote-project
JWTs, restricts all HTTP requests to the same local origin and disables redirects.
It uses real Auth password sessions, REST/RLS and Storage, not SQL-impersonated
sessions. Admin credentials are confined to synthetic setup, integrity assertions
and cleanup. Setup creates two companies, four roles each, a dual-company editor
and a nonmember. It checks unchanged foreign rows and actual file content after
attacks, including successful-empty DELETE responses. No real channels are used.

Do not reset an existing database. If setup/cleanup fails, retain the error and
dispose only of this identified sandbox using the CLI's documented local stop
workflow. Never substitute a linked/remote project to obtain passing results.

## Verification levels and limits

- Unit: `npm test` includes offline safety guards for URL/key validation. It does
  not prove RLS. Existing application unit tests remain unchanged.
- Integration: `npm run test:integration` is separate from `npm run build`; it
  requires the isolated instance above and fails rather than silently skipping
  absent configuration. Tests cover role permissions, cross-company access,
  identity tampering, anonymous/nonmember access, Storage and elevated writes.
- Manual, still required: point a local-only frontend build to this sandbox;
  upload/retry a synthetic PDF as editor, inspect viewer denial and errors.
  Do not change committed application environment or connect production channels.
- Signed URLs: a foreign actor cannot mint one for another company's file. An
  authorized signed URL is transferable and works without session until expiry;
  the test explicitly verifies both facts. Session-bound delivery is out of scope.
- This does not certify full production migrations, production E2E, service-role
  read authorization, legacy bots, extracted content or downstream AI execution.

## Migration compatibility and rollback

The migration locks only agents and knowledge_documents before preflight, aborts
on existing inconsistency without data repair, adds a unique key and composite
FK, and validates it in one transaction. A five-second lock timeout and 60-second
statement timeout fail closed. Review table sizes and schedule locks before any
authorized production execution; this is not an online/zero-lock migration.
Existing agent/document IDs and FK relationships remain unchanged. The existing
agent-leading document index supports child lookups; no redundant child index
is added. ON DELETE CASCADE and ON UPDATE NO ACTION retain existing semantics.

Rollback, only with separate approval on the intended environment, consists of:

```sql
begin;
set local lock_timeout = '5s';
alter table public.knowledge_documents
  drop constraint knowledge_documents_agent_organization_fkey;
alter table public.agents drop constraint agents_id_organization_key;
commit;
```

It removes only the new integrity guarantee, not rows, existing FKs, policies,
grants or migration history. Forward migration is intentionally one-shot and
must not be replayed on top of itself. No production/permission/credential
change is authorized by this PR. No historical deployment instruction overrides
this requirement.

## Execution record (2026-10-29)

Docker CLI is installed, but `docker version` cannot connect to the local Linux
engine (named pipe absent). Therefore baseline reproduction, migrated SQL,
Auth/Storage integration and manual UI verification are **not executed** in this
session. Do not report the integration suite as passing. No production fallback.
Build/unit results and the exact remaining checks are recorded in the draft PR.

Verified here: `npm run build` (typecheck, lint, 28 unit tests, Vite build),
and strict TypeScript checking of the new tests using temporary Node 24 type
definitions outside the repository. The normal app typecheck does not include
tests, so this supplementary check was run explicitly. No dependency or lockfile
was changed. Vite retains its existing >500 kB bundle warning.
`npm run test:integration` without local configuration fails before any request,
as intended; that refusal is not a successful integration run.

Dependency audit: `npm audit --omit=dev --ignore-scripts` cannot run because the
repository tracks `bun.lock`, not an npm lockfile. No npm lockfile was generated
and no dependency remediation was attempted in this bounded database PR.

## PR #3 follow-up validation record

Starting local HEAD, remote branch and PR #3 head all matched
`d38ffa29c5e061e1c4cb493a4e3fae86c50c048f`; branch remained
`codex/agent-document-isolation`, PR remained draft. `.impeccable/review/` was
untracked before work and remains excluded. No migration/policy/grant was edited
in this follow-up, only test safety/assertions and this guide.

Environment: Node v24.19.0; Supabase CLI 2.122.0; Docker client 29.7.2/API 1.55;
Docker Desktop binary 4.89.0.238018; active context `desktop-linux` using local
`npipe:////./pipe/dockerDesktopLinuxEngine`. `docker version` reports the pipe
absent, `docker desktop status` reports Desktop not running, and no Desktop/backend
process was found. Both read-only `wsl --status` and `wsl --list --verbose` fail
with `Wsl/WSL_E_WSL_OPTIONAL_COMPONENT_REQUIRED`. Older backend logs do not prove
today's engine health. WSL reports its optional Windows component unavailable;
the cause of that Windows feature state has not been determined.

No WSL installation/feature change, virtualization change, security/permission
change, reinstall, reset, reboot, volume deletion or workload stop was performed.
Minimum user intervention: specifically authorize enabling/repairing the missing
WSL optional component (and a reboot if Windows requires one), or supply an
already-working local Linux Docker engine. Then open Docker Desktop and wait
for Linux engine readiness. Merely rerunning integration cannot fix this blocker.

Follow-up suite changes:
- Negative uploads have real, FK-consistent metadata prepared by local admin,
  including the exact attempted author and path. After denial the object is
  absent, then a positive admin upload to that SAME path succeeds.
- All candidate paths are registered before writes, including negative attempts.
  Cleanup deletes only those paths/fixture IDs and verifies file/row absence.
- Overwrites send different bytes and compare the legitimate file byte-for-byte.
- Database denials require SQLSTATE 42501 or zero rows. Storage accepts only
  documented authorization or masked read-not-found responses with positive
  existence controls. 500/429/network/schema/signature failures do not count.
- Signed URL TTL is 15 seconds, checked against the issued token's expiry;
  expiry is checked after that timestamp within a ten-second grace window.
  Fetches have ten-second network timeouts. Expiry must be an explicit expired
  JWT/token response, followed by successful fresh-token and authenticated reads.
- Pure unit tests verify the rejection classifiers; they do NOT mock or replace
  the real Auth/RLS/Storage integration suite.

### Migration lifecycle checks still pending on the exclusive sandbox

These are required evidence, not results. Neither schema mode nor any of these
SQL exercises has been run while Docker is blocked. Use only the two historical
migrations listed above, plus the new migration. Never claim full production
history validation.

1. Baseline: run `STAGE_ISOLATION_SCHEMA=baseline` and retain the successful
   persisted-mismatch assertion/readback and cleanup results.
2. Dirty preflight: using only additional tracked synthetic IDs in the baseline
   sandbox, save snapshots of a valid document and one deliberately mismatched
   document, their agents and organizations. Apply the actual new migration on
   a separate local connection with SQL errors fatal. Require SQLSTATE 23514 and
   `document_agent_organization_mismatch`, not a timeout/connection failure.
   After that connection exits/rolls back, verify both new constraint names are
   absent from `pg_constraint`, original constraints unchanged, and snapshots
   byte-for-byte unchanged. No auto-repair or deletion is acceptable.
3. Remove only the deliberately inconsistent fixture using its tracked ID;
   verify the valid snapshot survives. Apply the actual migration and require
   both constraints present and `convalidated=true` for the composite FK. Run
   migrated mode: named-FK 23503 on mismatch, successful valid operations, real
   role/Storage suite, agent-to-document cascade and unaffected other company.
4. Snapshot valid fixtures, execute the documented rollback on the same sandbox,
   and confirm snapshots intact and only the two new constraints absent. In that
   state run baseline mode again to reproduce the missing guarantee. Reapply the
   actual SQL file locally (not history repair or production migration commands),
   verify validated constraints and surviving valid snapshots, rerun migrated
   mode. Drop/recreate of unrelated resources is forbidden.
5. Clean tracked Storage paths before metadata/agents/organizations/users;
   verify absence and retain cleanup result. Dispose only of the identified
   disposable project via the CLI workflow, never shared Docker resources.

No fixture or sandbox was created during this blocked follow-up. Therefore
cleanup is not claimed as executed. Publishing this branch may trigger the
existing preview build; that build is NOT database/migration validation.

References: [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html),
[Supabase Storage policies](https://supabase.com/docs/guides/storage/security/access-control).
