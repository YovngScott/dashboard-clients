# Agent builder validation checkpoint

## Scope

Four-step builder, in-memory draft scoped to authenticated user and organization,
guarded partial-save retry, explicit reconciliation of uncertain creates,
field limits, typed local PDF errors, and focus/pending/error behavior.
No ingestion, AI chat, channel connection, activation, database migration or
runtime-bot changes are included.

The existing schema requires a nonempty requested_channels array. The builder
retains one permitted channel internally without connecting or activating it.
Saving inserts an agent with the existing database default draft status.

## Reproduce

Use Node 24.19.0 and the existing bun.lock (Bun 1.4.2). Install with lifecycle
scripts disabled. The combined candidate passed npm run build: application
typecheck, lint, 46 Node tests, component/test/fixture typecheck, 54 Vitest
tests and Vite 8.3.3 build. git diff --check passed.

Component tests mock services and block fetch. Cases include App-level delayed
account hydration, old workspace/profile responses, logout during upload,
organization change during refresh, scope remount before paint, required fields,
maximum boundaries, partial-save edits, PDF retry, duplicate clicks, uncertain
creation recovery/discard, typed PDF MIME/signature/size/read errors, and focus.
PDF checks validate MIME/header/size, not full document parsing or malware.

Local browser fixture: npx vite --config vite.fixture.config.ts, then open
http://127.0.0.1:3188/tests/fixtures/agent-builder.html. Services are synthetic;
the file validator is real. Existing CSS may fetch public Google Fonts.
The fixture is not part of the production entry. Inspected at 1440x900 and
375x812, including recovery controls, long names, focus, errors, pending state,
and account/organization boundaries. No real backend session or writes used.

## Deployment/testing boundaries

The normal local build has no Supabase environment and eliminates unreachable
authenticated UI. A separate synthetic-config compilation confirmed the real
builder code is included when configuration is present. The latter output is
test-only and must not be deployed. It retains the >500 kB bundle warning.

The query preview=dashboard works only in Vite DEV mode. An automatically
deployed static preview is NOT automatically a synthetic sandbox. Inspect its
API target before login or saving; a production Supabase target would write
real agent records and Storage files. Do not test those writes without separate
authorization. No deployment/API configuration is changed by this PR.

Draft memory is lost on reload. A create already sent may have persisted even
if its response is lost; this patch does not provide server idempotency.
Reconciliation filters by current organization and author, requires explicit
selection/discard and never silently repeats the create. Empty results do not
prove the prior create did not happen. No full production authorization or
database integration is certified here.

## Dependency audit (2026-10-29)

The combined candidate includes the reviewed dev-tool patches and Vite 8.3.3.
`bun audit` reported zero known advisories among 315 packages at this point in
time. This is not a guarantee against unknown vulnerabilities. A frozen install
in the working copy was interrupted after it did not complete. An independent
clean temporary copy of the candidate with the same manifest and lock completed
`bun install --frozen-lockfile --ignore-scripts --backend=copyfile` successfully.
Do not expose development fixtures to public traffic.

No credentials, personal data, backup diagnostics or private local reports are
included in this public-facing validation note.
