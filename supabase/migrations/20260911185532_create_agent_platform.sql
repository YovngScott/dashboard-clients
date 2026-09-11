create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  website_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx
  on public.organization_members(user_id, organization_id);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  business_name text not null check (char_length(business_name) between 2 and 120),
  business_description text not null check (char_length(business_description) between 20 and 8000),
  catalog_summary text,
  important_facts text,
  operating_instructions text,
  website_url text,
  phone text,
  goal text not null default 'customer_service' check (goal in ('customer_service', 'sales_and_service', 'lead_qualification')),
  tone text not null default 'clear_and_warm' check (tone in ('clear_and_warm', 'professional', 'concise', 'friendly')),
  handoff_instructions text,
  language_mode text not null default 'auto' check (language_mode = 'auto'),
  always_on boolean not null default true check (always_on = true),
  requested_channels text[] not null default array['instagram']::text[] check (
    requested_channels <@ array['instagram', 'whatsapp', 'facebook', 'tiktok', 'email', 'telegram', 'sms']::text[]
    and cardinality(requested_channels) > 0
  ),
  status text not null default 'draft' check (status in ('draft', 'processing', 'needs_attention', 'ready', 'activating', 'active', 'failed', 'paused')),
  status_detail text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agents_organization_status_idx
  on public.agents(organization_id, status, updated_at desc);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  file_name text not null check (char_length(file_name) between 1 and 240),
  storage_path text not null unique,
  mime_type text not null check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  sha256 text,
  status text not null default 'uploading' check (status in ('uploading', 'uploaded', 'processing', 'ready', 'failed', 'quarantined')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_documents_agent_idx
  on public.knowledge_documents(agent_id, created_at desc);
create index knowledge_documents_organization_idx
  on public.knowledge_documents(organization_id);

create table public.agent_channel_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  channel text not null check (channel in ('instagram', 'whatsapp', 'facebook', 'tiktok', 'email', 'telegram', 'sms')),
  status text not null default 'not_connected' check (status in ('not_connected', 'connecting', 'connected', 'expired', 'error', 'disabled')),
  provider_account_id text,
  provider_account_label text,
  capabilities text[] not null default '{}',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, channel)
);

create index agent_channel_connections_org_status_idx
  on public.agent_channel_connections(organization_id, status);

create table public.organization_entitlements (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan_code text not null default 'trial',
  max_connected_channels integer not null default 1 check (max_connected_channels > 0),
  allowed_channels text[] not null default array['instagram']::text[],
  metered_usage boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.quality_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'passed', 'failed')),
  score numeric(5,2) check (score between 0 and 100),
  checks_total integer not null default 0 check (checks_total >= 0),
  checks_passed integer not null default 0 check (checks_passed >= 0 and checks_passed <= checks_total),
  failure_summary text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index quality_runs_agent_created_idx
  on public.quality_runs(agent_id, created_at desc);

create table public.deployment_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  idempotency_key uuid not null unique default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued', 'validating', 'deploying', 'active', 'failed')),
  requested_by uuid not null references auth.users(id) on delete restrict,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deployment_jobs_agent_created_idx
  on public.deployment_jobs(agent_id, created_at desc);

create table public.agent_audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index agent_audit_events_org_created_idx
  on public.agent_audit_events(organization_id, created_at desc);

create table private.knowledge_content (
  document_id uuid primary key references public.knowledge_documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  extracted_text text not null,
  extraction_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on all tables in schema private from public, anon, authenticated;

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_org_role(target_organization_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = (select auth.uid())
      and member.role = any(allowed_roles)
  );
$$;

create or replace function private.channels_within_entitlement(target_organization_id uuid, requested text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_entitlements entitlement
    where entitlement.organization_id = target_organization_id
      and requested <@ entitlement.allowed_channels
      and cardinality(requested) <= entitlement.max_connected_channels
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid, text[]) from public, anon;
revoke all on function private.channels_within_entitlement(uuid, text[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;
grant execute on function private.channels_within_entitlement(uuid, text[]) to authenticated;

create or replace function public.bootstrap_my_organization(organization_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_organization_id uuid;
  created_organization_id uuid;
  normalized_name text := nullif(btrim(organization_name), '');
  normalized_slug text;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select organization.id into existing_organization_id
  from public.organizations organization
  where organization.owner_user_id = current_user_id;

  if existing_organization_id is not null then
    return existing_organization_id;
  end if;

  if normalized_name is null or char_length(normalized_name) < 2 then
    raise exception 'organization_name_required' using errcode = '22023';
  end if;

  normalized_slug := trim(both '-' from regexp_replace(lower(normalized_name), '[^a-z0-9]+', '-', 'g'));
  if normalized_slug = '' then
    normalized_slug := 'organization';
  end if;
  normalized_slug := normalized_slug || '-' || left(replace(current_user_id::text, '-', ''), 8);

  insert into public.organizations(owner_user_id, name, slug)
  values (current_user_id, left(normalized_name, 120), normalized_slug)
  returning id into created_organization_id;

  insert into public.organization_members(organization_id, user_id, role)
  values (created_organization_id, current_user_id, 'owner');

  insert into public.organization_entitlements(organization_id)
  values (created_organization_id);

  return created_organization_id;
end;
$$;

revoke all on function public.bootstrap_my_organization(text) from public, anon;
grant execute on function public.bootstrap_my_organization(text) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger organizations_set_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger agents_set_updated_at before update on public.agents
for each row execute function private.set_updated_at();
create trigger knowledge_documents_set_updated_at before update on public.knowledge_documents
for each row execute function private.set_updated_at();
create trigger agent_channel_connections_set_updated_at before update on public.agent_channel_connections
for each row execute function private.set_updated_at();
create trigger organization_entitlements_set_updated_at before update on public.organization_entitlements
for each row execute function private.set_updated_at();
create trigger deployment_jobs_set_updated_at before update on public.deployment_jobs
for each row execute function private.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.agents enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.agent_channel_connections enable row level security;
alter table public.organization_entitlements enable row level security;
alter table public.quality_runs enable row level security;
alter table public.deployment_jobs enable row level security;
alter table public.agent_audit_events enable row level security;

create policy organizations_select_member on public.organizations
for select to authenticated
using ((select private.is_org_member(id)));

create policy organizations_update_admin on public.organizations
for update to authenticated
using ((select private.has_org_role(id, array['owner', 'admin'])))
with check ((select private.has_org_role(id, array['owner', 'admin'])));

create policy organization_members_select_member on public.organization_members
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy agents_select_member on public.agents
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy agents_insert_editor on public.agents
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  and (select private.channels_within_entitlement(organization_id, requested_channels))
);

create policy agents_update_editor on public.agents
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin', 'editor'])))
with check (
  (select private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  and (select private.channels_within_entitlement(organization_id, requested_channels))
);

create policy knowledge_documents_select_member on public.knowledge_documents
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy knowledge_documents_insert_editor on public.knowledge_documents
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  and exists (
    select 1 from public.agents agent
    where agent.id = agent_id and agent.organization_id = organization_id
  )
);

create policy agent_channel_connections_select_member on public.agent_channel_connections
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy organization_entitlements_select_member on public.organization_entitlements
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy quality_runs_select_member on public.quality_runs
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy deployment_jobs_select_member on public.deployment_jobs
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy agent_audit_events_select_member on public.agent_audit_events
for select to authenticated
using ((select private.is_org_member(organization_id)));

grant select on public.organizations to authenticated;
grant update (name, website_url, phone) on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select on public.agents to authenticated;
grant insert (organization_id, created_by, name, business_name, business_description, catalog_summary, important_facts, operating_instructions, website_url, phone, goal, tone, handoff_instructions, requested_channels)
  on public.agents to authenticated;
grant update (name, business_name, business_description, catalog_summary, important_facts, operating_instructions, website_url, phone, goal, tone, handoff_instructions, requested_channels)
  on public.agents to authenticated;
grant select on public.knowledge_documents to authenticated;
grant insert (id, organization_id, agent_id, uploaded_by, file_name, storage_path, mime_type, size_bytes)
  on public.knowledge_documents to authenticated;
grant select on public.agent_channel_connections to authenticated;
grant select on public.organization_entitlements to authenticated;
grant select on public.quality_runs to authenticated;
grant select on public.deployment_jobs to authenticated;
grant select on public.agent_audit_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('agent-context', 'agent-context', false, 20971520, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy agent_context_insert_editor on storage.objects
for insert to authenticated
with check (
  bucket_id = 'agent-context'
  and exists (
    select 1
    from public.knowledge_documents document
    where document.storage_path = name
      and document.uploaded_by = (select auth.uid())
      and (select private.has_org_role(document.organization_id, array['owner', 'admin', 'editor']))
  )
);

create policy agent_context_select_member on storage.objects
for select to authenticated
using (
  bucket_id = 'agent-context'
  and exists (
    select 1
    from public.knowledge_documents document
    where document.storage_path = name
      and (select private.has_org_role(document.organization_id, array['owner', 'admin', 'editor']))
  )
);
