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

Use Node 24.19.0 and the existing bun.lock (Bun 1.4.4). Install with lifecycle
scripts disabled. Run npm run build: app typecheck, lint, 32 Node tests,
component/test/fixture typecheck, 26 Vitest tests, Vite build.
The 58 tests passed for this checkpoint. git diff --check passed.

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

Bun native audit reports 12 development-toolchain advisories: 5 high, 6 moderate,
1 low, involving brace-expansion, postcss-selector-parser, source-map-js, Vite
and zod. These paths are lint/build/dev-server/test tooling, not application
production dependencies. The production-only audit reports no vulnerabilities.
This is NOT a clean full audit or a production-release approval.

Vite advisories include development-server/editor behavior: do not expose the
dev server to untrusted clients. Lint glob, source-map, CSS and schema-parser
DoS paths require review before handling untrusted build/test inputs. Fixtures
here are controlled synthetic inputs. No automatic audit fix or forced version
upgrade was applied in this scoped UI checkpoint. Follow-up dependency triage
remains required before a production release; review date: before merge.

No credentials, personal data, backup diagnostics or private local reports are
included in this public-facing validation note.
