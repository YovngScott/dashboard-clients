-- Keep team cards grounded in each member's linked identity profile.
create or replace function public.get_team(target_organization_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if private.team_actor_role(target_organization_id) is null then
    raise exception 'not_a_team_member' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'seat_limit', private.team_seat_limit(target_organization_id),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', member.user_id,
        'email', member_user.email,
        'name', coalesce(
          nullif(member_user.raw_user_meta_data->>'full_name', ''),
          nullif(member_user.raw_user_meta_data->>'name', ''),
          nullif(concat_ws(' ', member_user.raw_user_meta_data->>'given_name', member_user.raw_user_meta_data->>'family_name'), ''),
          member_user.email
        ),
        'avatar_url', case
          when coalesce(member_user.raw_user_meta_data->>'avatar_url', member_user.raw_user_meta_data->>'picture') ~* '^https://' then
            coalesce(member_user.raw_user_meta_data->>'avatar_url', member_user.raw_user_meta_data->>'picture')
          else null
        end,
        'role', member.role,
        'created_at', member.created_at
      ) order by member.created_at)
      from public.organization_members member
      join auth.users member_user on member_user.id = member.user_id
      where member.organization_id = target_organization_id
    ), '[]'::jsonb),
    'invitations', case when private.team_actor_role(target_organization_id) in ('owner','admin') then
      coalesce((select jsonb_agg(jsonb_build_object(
        'id', invitation.id, 'email', invitation.email, 'role', invitation.role,
        'created_at', invitation.created_at, 'expires_at', invitation.expires_at
      ) order by invitation.created_at desc)
      from public.organization_invitations invitation
      where invitation.organization_id = target_organization_id and invitation.accepted_at is null
        and invitation.revoked_at is null and invitation.expires_at > now()), '[]'::jsonb)
      else '[]'::jsonb end
  ) into result;
  return result;
end;
$$;

-- Store routing preferences separately from Inbox execution. Conversations are
-- not yet distributed by the product, so this table records configuration only.
create table public.organization_auto_assignment_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  mode text not null default 'off' check (mode in ('off', 'basic', 'advanced')),
  agents jsonb not null default '[]'::jsonb
    check (jsonb_typeof(agents) = 'array' and jsonb_array_length(agents) <= 100),
  rules jsonb not null default '[]'::jsonb
    check (jsonb_typeof(rules) = 'array' and jsonb_array_length(rules) <= 100),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_auto_assignment_settings enable row level security;
revoke all on public.organization_auto_assignment_settings from public, anon, authenticated;
grant select, insert, update on public.organization_auto_assignment_settings to authenticated;

create policy organization_auto_assignment_settings_select_member
  on public.organization_auto_assignment_settings for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy organization_auto_assignment_settings_insert_admin
  on public.organization_auto_assignment_settings for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['owner', 'admin'])));

create policy organization_auto_assignment_settings_update_admin
  on public.organization_auto_assignment_settings for update to authenticated
  using ((select private.has_org_role(organization_id, array['owner', 'admin'])))
  with check ((select private.has_org_role(organization_id, array['owner', 'admin'])));

create or replace function private.validate_auto_assignment_targets()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(new.agents) = 'array' and exists (
    select 1
    from jsonb_array_elements(new.agents) as elements(item)
    where not exists (
      select 1 from public.organization_members member
      where member.organization_id = new.organization_id
        and member.user_id = (item->>'user_id')::uuid
        and member.role in ('owner', 'admin', 'editor')
    )
  ) then
    raise exception 'auto_assignment_agent_not_in_workspace' using errcode = '22023';
  end if;

  if jsonb_typeof(new.rules) = 'array' and exists (
    select 1
    from jsonb_array_elements(new.rules) as elements(item)
    where coalesce(item->>'channel', '') not in ('instagram', 'whatsapp', 'facebook', 'tiktok', 'email', 'telegram', 'sms')
       or not exists (
         select 1 from public.organization_members member
         where member.organization_id = new.organization_id
           and member.user_id = (item->>'target_user_id')::uuid
           and member.role in ('owner', 'admin', 'editor')
       )
  ) then
    raise exception 'auto_assignment_rule_target_invalid' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_auto_assignment_targets() from public, anon, authenticated;

create trigger organization_auto_assignment_validate_targets
  before insert or update on public.organization_auto_assignment_settings
  for each row execute function private.validate_auto_assignment_targets();

create trigger organization_auto_assignment_set_updated_at
  before update on public.organization_auto_assignment_settings
  for each row execute function private.set_updated_at();
