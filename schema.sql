-- Stage AI Labs
-- Esquema PostgreSQL/Supabase multi-tenant deducido del onboarding, dashboard,
-- bandeja, contactos, automatizaciones, configuracion y planes del frontend.

begin;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Tipos de dominio
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.platform_role as enum ('user', 'support', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_status as enum ('invited', 'active', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.workspace_status as enum ('active', 'suspended', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_plan as enum ('launch', 'pulse', 'infinity');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum (
    'incomplete', 'trialing', 'active', 'past_due', 'paused', 'canceled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.billing_interval as enum ('monthly', 'annual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.channel_type as enum (
    'instagram', 'facebook', 'tiktok', 'whatsapp', 'telegram',
    'gmail', 'outlook', 'voice', 'sms', 'webchat'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.connection_status as enum ('pending', 'connected', 'error', 'disconnected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.bot_status as enum ('draft', 'active', 'paused', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.conversation_status as enum ('open', 'pending', 'resolved', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_actor as enum ('contact', 'bot', 'user', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.automation_kind as enum (
    'comment_reply', 'new_follower', 'story_reply', 'faq', 'custom'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.automation_status as enum ('draft', 'active', 'paused', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.run_status as enum ('queued', 'running', 'succeeded', 'failed', 'canceled');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Identidad, onboarding y tenants
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role public.platform_role not null default 'user',
  locale text not null default 'es',
  theme_preference text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_format_check
    check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint profiles_locale_check check (locale in ('es', 'en', 'pt')),
  constraint profiles_theme_check check (theme_preference in ('light', 'dark', 'system'))
);

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email)) where email is not null;

-- Compatibilidad directa con el frontend actual y su flujo de onboarding.
create table if not exists public.onboarding_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  channel text,
  account_type text,
  goals text[] not null default '{}',
  discovery_source text,
  onboarding_complete boolean not null default false,
  theme_preference text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.onboarding_profiles
  add column if not exists theme_preference text not null default 'system';

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_profiles_theme_check'
      and conrelid = 'public.onboarding_profiles'::regclass
  ) then
    alter table public.onboarding_profiles
      add constraint onboarding_profiles_theme_check
      check (theme_preference in ('light', 'dark', 'system'));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_profiles_account_type_check'
      and conrelid = 'public.onboarding_profiles'::regclass
  ) then
    alter table public.onboarding_profiles
      add constraint onboarding_profiles_account_type_check
      check (account_type is null or account_type in ('empresa', 'personal', 'cliente'));
  end if;
end $$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  status public.workspace_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_check check (length(btrim(name)) between 2 and 120),
  constraint workspaces_slug_check
    check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint workspaces_settings_object_check check (jsonb_typeof(settings) = 'object')
);

create unique index if not exists workspaces_slug_unique_idx
  on public.workspaces (lower(slug)) where slug is not null;
create index if not exists workspaces_created_by_idx on public.workspaces (created_by);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  status public.membership_status not null default 'active',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_members_workspace_user_key unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id, status);
create index if not exists workspace_members_workspace_id_idx
  on public.workspace_members (workspace_id, status);
create index if not exists workspace_members_invited_by_idx
  on public.workspace_members (invited_by) where invited_by is not null;

-- ---------------------------------------------------------------------------
-- Billing y limites de producto
-- null en un limite significa ilimitado.
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan public.subscription_plan not null default 'launch',
  status public.subscription_status not null default 'incomplete',
  interval public.billing_interval not null default 'monthly',
  contact_limit integer,
  email_limit integer,
  channel_limit smallint,
  seat_limit smallint,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  billing_customer_id text,
  billing_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_contact_limit_check check (contact_limit is null or contact_limit > 0),
  constraint subscriptions_email_limit_check check (email_limit is null or email_limit > 0),
  constraint subscriptions_channel_limit_check check (channel_limit is null or channel_limit > 0),
  constraint subscriptions_seat_limit_check check (seat_limit is null or seat_limit > 0),
  constraint subscriptions_period_check
    check (current_period_end is null or current_period_start is null or current_period_end > current_period_start),
  constraint subscriptions_trial_check
    check (trial_ends_at is null or current_period_start is null or trial_ends_at >= current_period_start)
);

create unique index if not exists subscriptions_billing_customer_unique_idx
  on public.subscriptions (billing_customer_id) where billing_customer_id is not null;
create unique index if not exists subscriptions_billing_subscription_unique_idx
  on public.subscriptions (billing_subscription_id) where billing_subscription_id is not null;

-- ---------------------------------------------------------------------------
-- Bots y conexiones de canales
-- Los tokens reales deben vivir en Supabase Vault o en un backend seguro.
-- credential_secret_id solo guarda la referencia al secreto.
-- ---------------------------------------------------------------------------

create table if not exists public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel public.channel_type not null,
  status public.connection_status not null default 'pending',
  display_name text,
  external_account_id text,
  credential_secret_id uuid,
  connected_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint channel_connections_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists channel_connections_workspace_id_idx
  on public.channel_connections (workspace_id, channel, status);
create index if not exists channel_connections_connected_by_idx
  on public.channel_connections (connected_by) where connected_by is not null;
create unique index if not exists channel_connections_external_account_unique_idx
  on public.channel_connections (workspace_id, channel, external_account_id)
  where external_account_id is not null;

create table if not exists public.client_bots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  tone text not null default 'profesional',
  objective text not null default '',
  website_url text,
  rules jsonb not null default '[]'::jsonb,
  active_channels public.channel_type[] not null default '{}',
  status public.bot_status not null default 'draft',
  language text not null default 'es',
  system_prompt text,
  configuration jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_bots_name_check check (length(btrim(name)) between 2 and 100),
  constraint client_bots_tone_check check (length(btrim(tone)) between 2 and 80),
  constraint client_bots_website_url_check
    check (website_url is null or website_url ~* '^https?://'),
  constraint client_bots_rules_array_check check (jsonb_typeof(rules) = 'array'),
  constraint client_bots_configuration_object_check check (jsonb_typeof(configuration) = 'object'),
  constraint client_bots_language_check check (language in ('es', 'en', 'pt')),
  constraint client_bots_active_channels_check check (array_position(active_channels, null) is null)
);

-- Compatibilidad no destructiva: algunas instalaciones de Stage ya poseen
-- client_bots para la consola interna (client_id, slug, bot_secret, etc.).
-- Se conservan esas filas y se amplía la tabla con el modelo multi-tenant.
alter table public.client_bots
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists tone text not null default 'profesional',
  add column if not exists objective text not null default '',
  add column if not exists website_url text,
  add column if not exists rules jsonb not null default '[]'::jsonb,
  add column if not exists active_channels public.channel_type[] not null default '{}',
  add column if not exists language text not null default 'es',
  add column if not exists system_prompt text,
  add column if not exists configuration jsonb not null default '{}'::jsonb,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Una tabla heredada puede exigir client_id. Se vuelve opcional para que los
-- bots del SaaS se vinculen por workspace_id sin romper los bots existentes.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_bots'
      and column_name = 'client_id'
  ) then
    alter table public.client_bots alter column client_id drop not null;
  end if;
end $$;

-- Las restricciones declaradas dentro de CREATE TABLE no se agregan cuando la
-- tabla ya existía. Este bloque las instala de forma idempotente.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'client_bots_name_check' and conrelid = 'public.client_bots'::regclass) then
    alter table public.client_bots add constraint client_bots_name_check check (length(btrim(name)) between 2 and 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'client_bots_tone_check' and conrelid = 'public.client_bots'::regclass) then
    alter table public.client_bots add constraint client_bots_tone_check check (length(btrim(tone)) between 2 and 80) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'client_bots_website_url_check' and conrelid = 'public.client_bots'::regclass) then
    alter table public.client_bots add constraint client_bots_website_url_check check (website_url is null or website_url ~* '^https?://') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'client_bots_rules_array_check' and conrelid = 'public.client_bots'::regclass) then
    alter table public.client_bots add constraint client_bots_rules_array_check check (jsonb_typeof(rules) = 'array') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'client_bots_configuration_object_check' and conrelid = 'public.client_bots'::regclass) then
    alter table public.client_bots add constraint client_bots_configuration_object_check check (jsonb_typeof(configuration) = 'object') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'client_bots_language_check' and conrelid = 'public.client_bots'::regclass) then
    alter table public.client_bots add constraint client_bots_language_check check (language in ('es', 'en', 'pt')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'client_bots_active_channels_check' and conrelid = 'public.client_bots'::regclass) then
    alter table public.client_bots add constraint client_bots_active_channels_check check (array_position(active_channels, null) is null) not valid;
  end if;
end $$;

create index if not exists client_bots_workspace_id_idx
  on public.client_bots (workspace_id, status);
create index if not exists client_bots_created_by_idx
  on public.client_bots (created_by) where created_by is not null;
create index if not exists client_bots_active_channels_gin_idx
  on public.client_bots using gin (active_channels);
create unique index if not exists client_bots_workspace_name_unique_idx
  on public.client_bots (workspace_id, lower(name)) where status <> 'archived';

-- ---------------------------------------------------------------------------
-- CRM, bandeja y actividad del dashboard
-- ---------------------------------------------------------------------------

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  primary_channel public.channel_type,
  external_contact_id text,
  full_name text,
  email text,
  phone text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  attributes jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_email_format_check
    check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint contacts_attributes_object_check check (jsonb_typeof(attributes) = 'object')
);

create index if not exists contacts_workspace_active_idx
  on public.contacts (workspace_id, created_at desc) where is_active;
create index if not exists contacts_created_by_idx
  on public.contacts (created_by) where created_by is not null;
create index if not exists contacts_tags_gin_idx on public.contacts using gin (tags);
create index if not exists contacts_workspace_email_idx
  on public.contacts (workspace_id, lower(email)) where email is not null;
create unique index if not exists contacts_external_identity_unique_idx
  on public.contacts (workspace_id, primary_channel, external_contact_id)
  where primary_channel is not null and external_contact_id is not null;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel_connection_id uuid references public.channel_connections(id) on delete restrict,
  bot_id uuid references public.client_bots(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  channel public.channel_type not null,
  status public.conversation_status not null default 'open',
  subject text,
  external_thread_id text,
  unread_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_unread_count_check check (unread_count >= 0),
  constraint conversations_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists conversations_workspace_status_idx
  on public.conversations (workspace_id, status, last_message_at desc);
create index if not exists conversations_contact_id_idx on public.conversations (contact_id);
create index if not exists conversations_channel_connection_id_idx
  on public.conversations (channel_connection_id) where channel_connection_id is not null;
create index if not exists conversations_bot_id_idx
  on public.conversations (bot_id) where bot_id is not null;
create index if not exists conversations_assigned_to_idx
  on public.conversations (assigned_to) where assigned_to is not null;
create unique index if not exists conversations_external_thread_unique_idx
  on public.conversations (workspace_id, channel, external_thread_id)
  where external_thread_id is not null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  bot_id uuid references public.client_bots(id) on delete set null,
  sent_by uuid references public.profiles(id) on delete set null,
  direction public.message_direction not null,
  actor public.message_actor not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  external_message_id text,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_content_check
    check (nullif(btrim(coalesce(body, '')), '') is not null or payload <> '{}'::jsonb),
  constraint messages_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint messages_delivery_order_check check (delivered_at is null or delivered_at >= sent_at),
  constraint messages_read_order_check check (read_at is null or read_at >= sent_at)
);

create index if not exists messages_workspace_sent_at_idx
  on public.messages (workspace_id, sent_at desc);
create index if not exists messages_conversation_sent_at_idx
  on public.messages (conversation_id, sent_at desc);
create index if not exists messages_bot_id_idx on public.messages (bot_id) where bot_id is not null;
create index if not exists messages_sent_by_idx on public.messages (sent_by) where sent_by is not null;
create unique index if not exists messages_external_message_unique_idx
  on public.messages (workspace_id, external_message_id)
  where external_message_id is not null;

-- ---------------------------------------------------------------------------
-- Automatizaciones y ejecuciones
-- ---------------------------------------------------------------------------

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_id uuid not null references public.client_bots(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  kind public.automation_kind not null default 'custom',
  status public.automation_status not null default 'draft',
  trigger_config jsonb not null default '{}'::jsonb,
  action_config jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automations_name_check check (length(btrim(name)) between 2 and 120),
  constraint automations_version_check check (version > 0),
  constraint automations_trigger_object_check check (jsonb_typeof(trigger_config) = 'object'),
  constraint automations_action_object_check check (jsonb_typeof(action_config) = 'object')
);

create index if not exists automations_workspace_status_idx
  on public.automations (workspace_id, status, updated_at desc);
create index if not exists automations_bot_id_idx on public.automations (bot_id);
create index if not exists automations_created_by_idx
  on public.automations (created_by) where created_by is not null;
create unique index if not exists automations_workspace_name_unique_idx
  on public.automations (workspace_id, lower(name)) where status <> 'archived';

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  status public.run_status not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint automation_runs_input_object_check check (jsonb_typeof(input) = 'object'),
  constraint automation_runs_output_object_check check (jsonb_typeof(output) = 'object'),
  constraint automation_runs_time_order_check
    check (finished_at is null or started_at is null or finished_at >= started_at)
);

create index if not exists automation_runs_workspace_created_idx
  on public.automation_runs (workspace_id, created_at desc);
create index if not exists automation_runs_automation_created_idx
  on public.automation_runs (automation_id, created_at desc);
create index if not exists automation_runs_pending_idx
  on public.automation_runs (created_at)
  where status in ('queued', 'running');

-- ---------------------------------------------------------------------------
-- Triggers de consistencia
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create or replace function private.apply_subscription_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.plan = 'launch'::public.subscription_plan then
    new.contact_limit := 5000;
    new.email_limit := 25000;
    new.channel_limit := 4;
    new.seat_limit := 3;
  elsif new.plan = 'pulse'::public.subscription_plan then
    new.contact_limit := 15000;
    new.email_limit := 75000;
    new.channel_limit := null;
    new.seat_limit := 6;
  elsif new.plan = 'infinity'::public.subscription_plan then
    new.contact_limit := null;
    new.email_limit := 250000;
    new.channel_limit := null;
    new.seat_limit := 15;
  end if;
  return new;
end;
$$;

revoke execute on function private.apply_subscription_limits() from public, anon, authenticated;

drop trigger if exists subscriptions_apply_limits on public.subscriptions;
create trigger subscriptions_apply_limits
before insert or update of plan on public.subscriptions
for each row execute function private.apply_subscription_limits();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'onboarding_profiles', 'workspaces', 'workspace_members',
    'subscriptions', 'channel_connections', 'client_bots', 'contacts',
    'conversations', 'automations'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

-- Impide vincular filas de un tenant con entidades de otro tenant.
create or replace function private.validate_conversation_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.contacts c
    where c.id = new.contact_id and c.workspace_id = new.workspace_id
  ) then
    raise exception 'contact_id does not belong to workspace_id';
  end if;

  if new.channel_connection_id is not null and not exists (
    select 1 from public.channel_connections cc
    where cc.id = new.channel_connection_id and cc.workspace_id = new.workspace_id
  ) then
    raise exception 'channel_connection_id does not belong to workspace_id';
  end if;

  if new.bot_id is not null and not exists (
    select 1 from public.client_bots b
    where b.id = new.bot_id and b.workspace_id = new.workspace_id
  ) then
    raise exception 'bot_id does not belong to workspace_id';
  end if;

  if new.assigned_to is not null and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.assigned_to
      and wm.status = 'active'::public.membership_status
  ) then
    raise exception 'assigned_to is not an active member of workspace_id';
  end if;

  return new;
end;
$$;

create or replace function private.validate_message_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.conversations c
    where c.id = new.conversation_id and c.workspace_id = new.workspace_id
  ) then
    raise exception 'conversation_id does not belong to workspace_id';
  end if;

  if new.bot_id is not null and not exists (
    select 1 from public.client_bots b
    where b.id = new.bot_id and b.workspace_id = new.workspace_id
  ) then
    raise exception 'bot_id does not belong to workspace_id';
  end if;

  return new;
end;
$$;

create or replace function private.validate_automation_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.client_bots b
    where b.id = new.bot_id and b.workspace_id = new.workspace_id
  ) then
    raise exception 'bot_id does not belong to workspace_id';
  end if;
  return new;
end;
$$;

create or replace function private.validate_automation_run_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.automations a
    where a.id = new.automation_id and a.workspace_id = new.workspace_id
  ) then
    raise exception 'automation_id does not belong to workspace_id';
  end if;
  return new;
end;
$$;

revoke execute on function private.validate_conversation_workspace() from public, anon, authenticated;
revoke execute on function private.validate_message_workspace() from public, anon, authenticated;
revoke execute on function private.validate_automation_workspace() from public, anon, authenticated;
revoke execute on function private.validate_automation_run_workspace() from public, anon, authenticated;

drop trigger if exists conversations_validate_workspace on public.conversations;
create trigger conversations_validate_workspace
before insert or update of workspace_id, contact_id, channel_connection_id, bot_id, assigned_to
on public.conversations
for each row execute function private.validate_conversation_workspace();

drop trigger if exists messages_validate_workspace on public.messages;
create trigger messages_validate_workspace
before insert or update of workspace_id, conversation_id, bot_id
on public.messages
for each row execute function private.validate_message_workspace();

drop trigger if exists automations_validate_workspace on public.automations;
create trigger automations_validate_workspace
before insert or update of workspace_id, bot_id
on public.automations
for each row execute function private.validate_automation_workspace();

drop trigger if exists automation_runs_validate_workspace on public.automation_runs;
create trigger automation_runs_validate_workspace
before insert or update of workspace_id, automation_id
on public.automation_runs
for each row execute function private.validate_automation_run_workspace();

-- ---------------------------------------------------------------------------
-- Helpers RLS privados. Evitan politicas recursivas sobre workspace_members.
-- ---------------------------------------------------------------------------

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'::public.membership_status
  );
$$;

create or replace function private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'::public.membership_status
      and wm.role in (
        'owner'::public.workspace_role,
        'admin'::public.workspace_role,
        'member'::public.workspace_role
      )
  );
$$;

create or replace function private.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'::public.membership_status
      and wm.role in ('owner'::public.workspace_role, 'admin'::public.workspace_role)
  );
$$;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'::public.membership_status
      and wm.role = 'owner'::public.workspace_role
  );
$$;

revoke execute on function private.is_workspace_member(uuid) from public, anon;
revoke execute on function private.can_manage_workspace(uuid) from public, anon;
revoke execute on function private.is_workspace_admin(uuid) from public, anon;
revoke execute on function private.is_workspace_owner(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.can_manage_workspace(uuid) to authenticated;
grant execute on function private.is_workspace_admin(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: ningun usuario autenticado puede salir de sus workspaces.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.onboarding_profiles enable row level security;
alter table public.onboarding_profiles force row level security;
alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_members force row level security;
alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;
alter table public.channel_connections enable row level security;
alter table public.channel_connections force row level security;
alter table public.client_bots enable row level security;
alter table public.client_bots force row level security;
alter table public.contacts enable row level security;
alter table public.contacts force row level security;
alter table public.conversations enable row level security;
alter table public.conversations force row level security;
alter table public.messages enable row level security;
alter table public.messages force row level security;
alter table public.automations enable row level security;
alter table public.automations force row level security;
alter table public.automation_runs enable row level security;
alter table public.automation_runs force row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists onboarding_profiles_select_own on public.onboarding_profiles;
create policy onboarding_profiles_select_own on public.onboarding_profiles for select to authenticated
using ((select auth.uid()) = id);
drop policy if exists onboarding_profiles_insert_own on public.onboarding_profiles;
create policy onboarding_profiles_insert_own on public.onboarding_profiles for insert to authenticated
with check ((select auth.uid()) = id);
drop policy if exists onboarding_profiles_update_own on public.onboarding_profiles;
create policy onboarding_profiles_update_own on public.onboarding_profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
drop policy if exists onboarding_profiles_delete_own on public.onboarding_profiles;
create policy onboarding_profiles_delete_own on public.onboarding_profiles for delete to authenticated
using ((select auth.uid()) = id);

drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member on public.workspaces for select to authenticated
using ((select private.is_workspace_member(id)));
drop policy if exists workspaces_insert_creator on public.workspaces;
create policy workspaces_insert_creator on public.workspaces for insert to authenticated
with check ((select auth.uid()) = created_by);
drop policy if exists workspaces_update_admin on public.workspaces;
create policy workspaces_update_admin on public.workspaces for update to authenticated
using ((select private.is_workspace_admin(id)))
with check ((select private.is_workspace_admin(id)));
drop policy if exists workspaces_delete_owner on public.workspaces;
create policy workspaces_delete_owner on public.workspaces for delete to authenticated
using ((select private.is_workspace_owner(id)));

drop policy if exists workspace_members_select_member on public.workspace_members;
create policy workspace_members_select_member on public.workspace_members for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
drop policy if exists workspace_members_insert_admin on public.workspace_members;
create policy workspace_members_insert_admin on public.workspace_members for insert to authenticated
with check (
  (select private.is_workspace_owner(workspace_id))
  or (
    (select private.is_workspace_admin(workspace_id))
    and role in ('member'::public.workspace_role, 'viewer'::public.workspace_role)
  )
);
drop policy if exists workspace_members_update_admin on public.workspace_members;
create policy workspace_members_update_admin on public.workspace_members for update to authenticated
using (
  (select private.is_workspace_owner(workspace_id))
  or (
    (select private.is_workspace_admin(workspace_id))
    and role <> 'owner'::public.workspace_role
  )
)
with check (
  (select private.is_workspace_owner(workspace_id))
  or (
    (select private.is_workspace_admin(workspace_id))
    and role in ('member'::public.workspace_role, 'viewer'::public.workspace_role)
  )
);
drop policy if exists workspace_members_delete_admin on public.workspace_members;
create policy workspace_members_delete_admin on public.workspace_members for delete to authenticated
using (
  not (
    role = 'owner'::public.workspace_role
    and user_id = (select auth.uid())
  )
  and (
    (select private.is_workspace_owner(workspace_id))
    or (
      (select private.is_workspace_admin(workspace_id))
      and role <> 'owner'::public.workspace_role
    )
  )
);

drop policy if exists subscriptions_select_member on public.subscriptions;
create policy subscriptions_select_member on public.subscriptions for select to authenticated
using ((select private.is_workspace_member(workspace_id)));

drop policy if exists channel_connections_select_member on public.channel_connections;
create policy channel_connections_select_member on public.channel_connections for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
drop policy if exists channel_connections_insert_manager on public.channel_connections;
create policy channel_connections_insert_manager on public.channel_connections for insert to authenticated
with check (
  (select private.can_manage_workspace(workspace_id))
  and (connected_by is null or connected_by = (select auth.uid()))
);
drop policy if exists channel_connections_update_manager on public.channel_connections;
create policy channel_connections_update_manager on public.channel_connections for update to authenticated
using ((select private.can_manage_workspace(workspace_id)))
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists channel_connections_delete_admin on public.channel_connections;
create policy channel_connections_delete_admin on public.channel_connections for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

drop policy if exists client_bots_select_member on public.client_bots;
create policy client_bots_select_member on public.client_bots for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
drop policy if exists client_bots_insert_manager on public.client_bots;
create policy client_bots_insert_manager on public.client_bots for insert to authenticated
with check (
  (select private.can_manage_workspace(workspace_id))
  and (created_by is null or created_by = (select auth.uid()))
);
drop policy if exists client_bots_update_manager on public.client_bots;
create policy client_bots_update_manager on public.client_bots for update to authenticated
using ((select private.can_manage_workspace(workspace_id)))
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists client_bots_delete_admin on public.client_bots;
create policy client_bots_delete_admin on public.client_bots for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

drop policy if exists contacts_select_member on public.contacts;
create policy contacts_select_member on public.contacts for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
drop policy if exists contacts_insert_manager on public.contacts;
create policy contacts_insert_manager on public.contacts for insert to authenticated
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists contacts_update_manager on public.contacts;
create policy contacts_update_manager on public.contacts for update to authenticated
using ((select private.can_manage_workspace(workspace_id)))
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists contacts_delete_admin on public.contacts;
create policy contacts_delete_admin on public.contacts for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

drop policy if exists conversations_select_member on public.conversations;
create policy conversations_select_member on public.conversations for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
drop policy if exists conversations_insert_manager on public.conversations;
create policy conversations_insert_manager on public.conversations for insert to authenticated
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists conversations_update_manager on public.conversations;
create policy conversations_update_manager on public.conversations for update to authenticated
using ((select private.can_manage_workspace(workspace_id)))
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists conversations_delete_admin on public.conversations;
create policy conversations_delete_admin on public.conversations for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
drop policy if exists messages_insert_manager on public.messages;
create policy messages_insert_manager on public.messages for insert to authenticated
with check (
  (select private.can_manage_workspace(workspace_id))
  and (sent_by is null or sent_by = (select auth.uid()))
);
drop policy if exists messages_update_manager on public.messages;
create policy messages_update_manager on public.messages for update to authenticated
using ((select private.can_manage_workspace(workspace_id)))
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists messages_delete_admin on public.messages;
create policy messages_delete_admin on public.messages for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

drop policy if exists automations_select_member on public.automations;
create policy automations_select_member on public.automations for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
drop policy if exists automations_insert_manager on public.automations;
create policy automations_insert_manager on public.automations for insert to authenticated
with check (
  (select private.can_manage_workspace(workspace_id))
  and (created_by is null or created_by = (select auth.uid()))
);
drop policy if exists automations_update_manager on public.automations;
create policy automations_update_manager on public.automations for update to authenticated
using ((select private.can_manage_workspace(workspace_id)))
with check ((select private.can_manage_workspace(workspace_id)));
drop policy if exists automations_delete_admin on public.automations;
create policy automations_delete_admin on public.automations for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

drop policy if exists automation_runs_select_member on public.automation_runs;
create policy automation_runs_select_member on public.automation_runs for select to authenticated
using ((select private.is_workspace_member(workspace_id)));

-- ---------------------------------------------------------------------------
-- Privilegios minimos para Data API. anon no recibe acceso a datos privados.
-- ---------------------------------------------------------------------------

revoke all on table
  public.profiles,
  public.onboarding_profiles,
  public.workspaces,
  public.workspace_members,
  public.subscriptions,
  public.channel_connections,
  public.client_bots,
  public.contacts,
  public.conversations,
  public.messages,
  public.automations,
  public.automation_runs
from anon, authenticated;

-- Endurece una funcion heredada de roles si existe: las visitas anonimas no
-- necesitan invocarla por RPC. authenticated conserva acceso porque las
-- politicas heredadas la usan para autorizar a los administradores internos.
do $$
begin
  if to_regprocedure('public.has_role(uuid,public.app_role)') is not null then
    execute 'revoke execute on function public.has_role(uuid, public.app_role) from anon';
  end if;
end $$;

grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, locale, theme_preference, updated_at)
  on public.profiles to authenticated;

grant select, insert, update, delete on public.onboarding_profiles to authenticated;

grant select, insert, delete on public.workspaces to authenticated;
grant update (name, slug, settings, updated_at) on public.workspaces to authenticated;

grant select, insert, delete on public.workspace_members to authenticated;
grant update (role, status, updated_at) on public.workspace_members to authenticated;

grant select on public.subscriptions to authenticated;

grant select, insert, delete on public.channel_connections to authenticated;
grant update (
  status, display_name, external_account_id, credential_secret_id,
  metadata, connected_at, last_synced_at, updated_at
) on public.channel_connections to authenticated;

-- client_bots puede contener bot_secret de una consola heredada. Nunca se
-- concede esa columna a sesiones del navegador; debe leerse desde backend.
grant select (
  id, workspace_id, created_by, name, tone, objective, website_url, rules,
  active_channels, status, language, system_prompt, configuration,
  published_at, created_at, updated_at
) on public.client_bots to authenticated;
grant insert (
  workspace_id, created_by, name, tone, objective, website_url, rules,
  active_channels, status, language, system_prompt, configuration, published_at
) on public.client_bots to authenticated;
grant delete on public.client_bots to authenticated;
grant update (
  name, tone, objective, website_url, rules, active_channels, status,
  language, system_prompt, configuration, published_at, updated_at
) on public.client_bots to authenticated;

-- Si la tabla client_bots ya pertenecia a la consola operativa, conserva
-- acceso a sus columnas no sensibles. bot_secret queda deliberadamente fuera.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_bots'
      and column_name = 'client_id'
  ) then
    execute 'grant select (client_id, slug, kind, product_name, bot_status_url, dashboard_url, github_commit_url) on public.client_bots to authenticated';
    execute 'grant insert (client_id, slug, kind, product_name, bot_status_url, dashboard_url, github_commit_url) on public.client_bots to authenticated';
    execute 'grant update (client_id, slug, kind, product_name, bot_status_url, dashboard_url, github_commit_url) on public.client_bots to authenticated';
  end if;
end $$;

grant select, insert, delete on public.contacts to authenticated;
grant update (
  primary_channel, external_contact_id, full_name, email, phone, tags,
  is_active, attributes, last_seen_at, updated_at
) on public.contacts to authenticated;

grant select, insert, delete on public.conversations to authenticated;
grant update (
  assigned_to, bot_id, status, subject, unread_count, metadata,
  last_message_at, updated_at
) on public.conversations to authenticated;

grant select, insert, delete on public.messages to authenticated;
grant update (body, payload, delivered_at, read_at) on public.messages to authenticated;

grant select, insert, delete on public.automations to authenticated;
grant update (
  name, kind, status, trigger_config, action_config, version,
  activated_at, updated_at
) on public.automations to authenticated;

-- Los runs se escriben desde Edge Functions o backend con service_role.
grant select on public.automation_runs to authenticated;

-- ---------------------------------------------------------------------------
-- Provision automatica desde Supabase Auth
-- Crea perfil, onboarding y un workspace personal con membresia owner.
-- raw_user_meta_data solo se usa para nombres visibles, nunca para autorizacion.
-- ---------------------------------------------------------------------------

create or replace function private.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.workspace_members (workspace_id, user_id, role, status)
    values (
      new.id,
      new.created_by,
      'owner'::public.workspace_role,
      'active'::public.membership_status
    )
    on conflict (workspace_id, user_id) do update
      set role = 'owner'::public.workspace_role,
          status = 'active'::public.membership_status,
          updated_at = now();
  end if;
  return new;
end;
$$;

revoke execute on function private.add_workspace_owner() from public, anon, authenticated;

drop trigger if exists workspaces_add_owner on public.workspaces;
create trigger workspaces_add_owner
after insert on public.workspaces
for each row execute function private.add_workspace_owner();

create or replace function private.provision_auth_user(
  p_user_id uuid,
  p_user_email text,
  p_user_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  visible_name text;
begin
  visible_name := coalesce(
    nullif(btrim(p_user_metadata ->> 'display_name'), ''),
    nullif(btrim(p_user_metadata ->> 'full_name'), ''),
    nullif(split_part(coalesce(p_user_email, ''), '@', 1), ''),
    'Mi empresa'
  );

  if length(visible_name) < 2 then
    visible_name := 'Mi empresa';
  end if;

  insert into public.profiles (id, email, full_name)
  values (p_user_id, p_user_email, visible_name)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();

  insert into public.onboarding_profiles (id, display_name)
  values (p_user_id, visible_name)
  on conflict (id) do update
    set display_name = coalesce(public.onboarding_profiles.display_name, excluded.display_name),
        updated_at = now();

  if not exists (
    select 1 from public.workspace_members wm where wm.user_id = p_user_id
  ) then
    insert into public.workspaces (name, created_by)
    values (visible_name, p_user_id);
  end if;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.provision_auth_user(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

revoke execute on function private.provision_auth_user(uuid, text, jsonb)
  from public, anon, authenticated;
revoke execute on function private.handle_new_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Backfill seguro para usuarios que existian antes de ejecutar este archivo.
do $$
declare
  existing_user record;
begin
  for existing_user in
    select id, email, raw_user_meta_data from auth.users
  loop
    perform private.provision_auth_user(
      existing_user.id,
      existing_user.email,
      existing_user.raw_user_meta_data
    );
  end loop;
end $$;

commit;

-- Verificacion rapida opcional tras ejecutar:
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' order by tablename;
-- select tgname from pg_trigger where tgname = 'on_auth_user_created';
