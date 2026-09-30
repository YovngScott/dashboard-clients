-- Team administration is deliberately RPC-only. Every mutation rechecks the
-- authenticated actor and serializes on the organization row before counting seats.
create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 320),
  role text not null check (role in ('admin', 'editor', 'viewer')),
  token_hash text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz
);

create unique index organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, email)
  where accepted_at is null and revoked_at is null;

create index organization_invitations_org_idx on public.organization_invitations(organization_id, created_at desc);
alter table public.organization_invitations enable row level security;
revoke all on public.organization_invitations from public, anon, authenticated;

create or replace function private.team_actor_role(target_organization_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role from public.organization_members
  where organization_id = target_organization_id and user_id = (select auth.uid());
$$;
revoke all on function private.team_actor_role(uuid) from public, anon, authenticated;

create or replace function private.team_seat_limit(target_organization_id uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select case plan_code
    when 'launch' then 3
    when 'pulse' then 6
    when 'infinity' then 15
    else null
  end from public.organization_entitlements
  where organization_id = target_organization_id;
$$;
revoke all on function private.team_seat_limit(uuid) from public, anon, authenticated;

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
        'user_id', member.user_id, 'email', member_user.email,
        'name', coalesce(nullif(member_user.raw_user_meta_data->>'full_name', ''),
                         nullif(member_user.raw_user_meta_data->>'name', ''), member_user.email),
        'role', member.role, 'created_at', member.created_at
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

create or replace function public.create_team_invitation(target_organization_id uuid, invite_email text, invite_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor_role text; normalized_email text := lower(btrim(invite_email));
  seat_limit integer; occupied integer; invite_token text; new_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(normalized_email) > 320 then
    raise exception 'invalid_email' using errcode = '22023'; end if;
  if invite_role not in ('admin','editor','viewer') then raise exception 'invalid_role' using errcode = '22023'; end if;
  perform 1 from public.organizations where id = target_organization_id for update;
  if not found then raise exception 'organization_not_found' using errcode = '22023'; end if;
  actor_role := private.team_actor_role(target_organization_id);
  if actor_role not in ('owner','admin') or (invite_role = 'admin' and actor_role <> 'owner') then
    raise exception 'insufficient_role' using errcode = '42501'; end if;
  if exists (select 1 from public.organization_members member join auth.users u on u.id = member.user_id
    where member.organization_id = target_organization_id and lower(u.email) = normalized_email) then
    raise exception 'already_a_member' using errcode = '23505'; end if;
  if exists (select 1 from public.organization_invitations where organization_id = target_organization_id
    and email = normalized_email and accepted_at is null and revoked_at is null and expires_at > now()) then
    raise exception 'invitation_already_pending' using errcode = '23505'; end if;
  -- Expired invitations must not block a fresh invitation or reserve a seat.
  update public.organization_invitations set revoked_at = now()
    where organization_id = target_organization_id and email = normalized_email
      and accepted_at is null and revoked_at is null and expires_at <= now();
  seat_limit := private.team_seat_limit(target_organization_id);
  if seat_limit is null then raise exception 'seat_limit_unavailable' using errcode = '22023'; end if;
  select (select count(*) from public.organization_members where organization_id = target_organization_id)
       + (select count(*) from public.organization_invitations where organization_id = target_organization_id
          and accepted_at is null and revoked_at is null and expires_at > now()) into occupied;
  if occupied >= seat_limit then raise exception 'seat_limit_reached' using errcode = '22023'; end if;
  invite_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by,expires_at)
  values(target_organization_id,normalized_email,invite_role,
    encode(sha256(convert_to(invite_token,'UTF8')),'hex'),auth.uid(),now() + interval '7 days')
  returning id into new_id;
  return jsonb_build_object('id',new_id,'token',invite_token);
end;
$$;

create or replace function public.accept_team_invitation(invite_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invite_record public.organization_invitations%rowtype; authenticated_email text;
  seat_limit integer; occupied integer;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if invite_token !~ '^[0-9a-f]{64}$' then raise exception 'invalid_invitation' using errcode = '22023'; end if;
  select * into invite_record from public.organization_invitations
    where token_hash = encode(sha256(convert_to(invite_token,'UTF8')),'hex');
  if not found or invite_record.accepted_at is not null or invite_record.revoked_at is not null
    or invite_record.expires_at <= now() then raise exception 'invitation_expired' using errcode = '22023'; end if;
  perform 1 from public.organizations where id = invite_record.organization_id for update;
  select lower(email) into authenticated_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if authenticated_email is distinct from invite_record.email then
    raise exception 'invitation_email_mismatch' using errcode = '42501'; end if;
  if exists (select 1 from public.organization_members where user_id = auth.uid()) then
    raise exception 'already_in_workspace' using errcode = '22023'; end if;
  select * into invite_record from public.organization_invitations where id = invite_record.id for update;
  if invite_record.accepted_at is not null or invite_record.revoked_at is not null
    or invite_record.expires_at <= now() then raise exception 'invitation_expired' using errcode = '22023'; end if;
  seat_limit := private.team_seat_limit(invite_record.organization_id);
  select count(*) into occupied from public.organization_members where organization_id = invite_record.organization_id;
  if seat_limit is null or occupied >= seat_limit then raise exception 'seat_limit_reached' using errcode = '22023'; end if;
  insert into public.organization_members(organization_id,user_id,role,invited_by)
    values(invite_record.organization_id,auth.uid(),invite_record.role,invite_record.invited_by);
  update public.organization_invitations set accepted_at = now() where id = invite_record.id;
  return invite_record.organization_id;
end;
$$;

create or replace function public.revoke_team_invitation(target_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare invitation_org uuid; actor_role text;
begin
  select organization_id into invitation_org from public.organization_invitations where id = target_invitation_id;
  if invitation_org is null then raise exception 'invitation_not_found' using errcode = '22023'; end if;
  perform 1 from public.organizations where id = invitation_org for update;
  actor_role := private.team_actor_role(invitation_org);
  if actor_role not in ('owner','admin') then raise exception 'insufficient_role' using errcode = '42501'; end if;
  update public.organization_invitations set revoked_at = now() where id = target_invitation_id
    and accepted_at is null and revoked_at is null;
end;
$$;

create or replace function public.set_team_member_role(target_organization_id uuid, target_user_id uuid, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_role text; current_role text;
begin
  if new_role not in ('admin','editor','viewer') then raise exception 'invalid_role' using errcode = '22023'; end if;
  perform 1 from public.organizations where id = target_organization_id for update;
  actor_role := private.team_actor_role(target_organization_id);
  select role into current_role from public.organization_members
    where organization_id = target_organization_id and user_id = target_user_id;
  if current_role is null then raise exception 'member_not_found' using errcode = '22023'; end if;
  if current_role = 'owner' or target_user_id = auth.uid() or actor_role not in ('owner','admin')
    or (actor_role = 'admin' and (current_role = 'admin' or new_role = 'admin')) then
    raise exception 'insufficient_role' using errcode = '42501'; end if;
  update public.organization_members set role = new_role
    where organization_id = target_organization_id and user_id = target_user_id;
end;
$$;

create or replace function public.remove_team_member(target_organization_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_role text; current_role text;
begin
  perform 1 from public.organizations where id = target_organization_id for update;
  actor_role := private.team_actor_role(target_organization_id);
  select role into current_role from public.organization_members
    where organization_id = target_organization_id and user_id = target_user_id;
  if current_role is null then raise exception 'member_not_found' using errcode = '22023'; end if;
  if current_role = 'owner' or target_user_id = auth.uid() or actor_role not in ('owner','admin')
    or (actor_role = 'admin' and current_role = 'admin') then
    raise exception 'insufficient_role' using errcode = '42501'; end if;
  delete from public.organization_members where organization_id = target_organization_id and user_id = target_user_id;
end;
$$;

revoke all on function public.get_team(uuid) from public, anon;
revoke all on function public.create_team_invitation(uuid,text,text) from public, anon;
revoke all on function public.accept_team_invitation(text) from public, anon;
revoke all on function public.revoke_team_invitation(uuid) from public, anon;
revoke all on function public.set_team_member_role(uuid,uuid,text) from public, anon;
revoke all on function public.remove_team_member(uuid,uuid) from public, anon;
grant execute on function public.get_team(uuid) to authenticated;
grant execute on function public.create_team_invitation(uuid,text,text) to authenticated;
grant execute on function public.accept_team_invitation(text) to authenticated;
grant execute on function public.revoke_team_invitation(uuid) to authenticated;
grant execute on function public.set_team_member_role(uuid,uuid,text) to authenticated;
grant execute on function public.remove_team_member(uuid,uuid) to authenticated;
