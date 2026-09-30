-- Make invitations shareable: the secure token itself grants the invitation,
-- while the invitee chooses any enabled sign-in provider before redeeming it.
alter table public.organization_invitations alter column email drop not null;

drop index if exists public.organization_invitations_pending_email_idx;
create unique index organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, email)
  where email is not null and accepted_at is null and revoked_at is null;

create or replace function public.create_team_invitation(target_organization_id uuid, invite_email text, invite_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor_role text;
  normalized_email text := nullif(lower(btrim(coalesce(invite_email, ''))), '');
  seat_limit integer;
  occupied integer;
  invite_token text;
  new_id uuid;
  invite_expires_at timestamptz;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if normalized_email is not null and (
    normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(normalized_email) > 320
  ) then raise exception 'invalid_email' using errcode = '22023'; end if;
  if invite_role not in ('admin','editor','viewer') then raise exception 'invalid_role' using errcode = '22023'; end if;
  perform 1 from public.organizations where id = target_organization_id for update;
  if not found then raise exception 'organization_not_found' using errcode = '22023'; end if;
  actor_role := private.team_actor_role(target_organization_id);
  if actor_role not in ('owner','admin') or (invite_role = 'admin' and actor_role <> 'owner') then
    raise exception 'insufficient_role' using errcode = '42501'; end if;
  if normalized_email is not null and exists (
    select 1 from public.organization_members member
    join auth.users u on u.id = member.user_id
    where member.organization_id = target_organization_id and lower(u.email) = normalized_email
  ) then raise exception 'already_a_member' using errcode = '23505'; end if;
  if normalized_email is not null and exists (
    select 1 from public.organization_invitations
    where organization_id = target_organization_id and email = normalized_email
      and accepted_at is null and revoked_at is null and expires_at > now()
  ) then raise exception 'invitation_already_pending' using errcode = '23505'; end if;
  if normalized_email is not null then
    update public.organization_invitations set revoked_at = now()
      where organization_id = target_organization_id and email = normalized_email
        and accepted_at is null and revoked_at is null and expires_at <= now();
  end if;
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
    returning id, expires_at into new_id, invite_expires_at;
  return jsonb_build_object('id',new_id,'token',invite_token,'expires_at',invite_expires_at);
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
  -- Legacy invitations remain email-bound; newly-created shared links have no email binding.
  if invite_record.email is not null and authenticated_email is distinct from invite_record.email then
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

revoke all on function public.create_team_invitation(uuid,text,text) from public, anon;
revoke all on function public.accept_team_invitation(text) from public, anon;
grant execute on function public.create_team_invitation(uuid,text,text) to authenticated;
grant execute on function public.accept_team_invitation(text) to authenticated;
