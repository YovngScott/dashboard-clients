create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_assigned_message boolean not null default false,
  notify_unassigned_conversation boolean not null default false,
  notify_conversation_assigned boolean not null default false,
  notify_via_browser boolean not null default false,
  notify_via_email boolean not null default false,
  notify_via_telegram boolean not null default false,
  notify_via_sms boolean not null default false,
  notification_email text,
  notification_phone text,
  sms_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_notification_preferences_email_format
    check (notification_email is null or notification_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint user_notification_preferences_phone_e164
    check (notification_phone is null or notification_phone ~ '^\+[1-9][0-9]{7,14}$'),
  constraint user_notification_preferences_sms_consent
    check (not notify_via_sms or (notification_phone is not null and sms_consent_at is not null))
);

alter table public.user_notification_preferences enable row level security;

revoke all on public.user_notification_preferences from public, anon, authenticated;
grant select, insert, update on public.user_notification_preferences to authenticated;

create policy user_notification_preferences_select_own
  on public.user_notification_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_notification_preferences_insert_own
  on public.user_notification_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_notification_preferences_update_own
  on public.user_notification_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
