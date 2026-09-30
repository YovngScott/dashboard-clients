-- Prefer the member's linked social-provider profile for team identity cards.
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
          nullif(linked_identity.identity_data->>'full_name', ''),
          nullif(linked_identity.identity_data->>'name', ''),
          nullif(concat_ws(' ', linked_identity.identity_data->>'given_name', linked_identity.identity_data->>'family_name'), ''),
          nullif(member_user.raw_user_meta_data->>'full_name', ''),
          nullif(member_user.raw_user_meta_data->>'name', ''),
          nullif(concat_ws(' ', member_user.raw_user_meta_data->>'given_name', member_user.raw_user_meta_data->>'family_name'), ''),
          member_user.email
        ),
        'avatar_url', case
          when coalesce(
            nullif(linked_identity.identity_data->>'avatar_url', ''),
            nullif(linked_identity.identity_data->>'picture', ''),
            nullif(member_user.raw_user_meta_data->>'avatar_url', ''),
            nullif(member_user.raw_user_meta_data->>'picture', '')
          ) ~* '^https://' then coalesce(
            nullif(linked_identity.identity_data->>'avatar_url', ''),
            nullif(linked_identity.identity_data->>'picture', ''),
            nullif(member_user.raw_user_meta_data->>'avatar_url', ''),
            nullif(member_user.raw_user_meta_data->>'picture', '')
          )
          else null
        end,
        'role', member.role,
        'created_at', member.created_at
      ) order by member.created_at)
      from public.organization_members member
      join auth.users member_user on member_user.id = member.user_id
      left join lateral (
        select identity.identity_data
        from auth.identities identity
        where identity.user_id = member.user_id
        order by identity.last_sign_in_at desc nulls last, identity.updated_at desc nulls last
        limit 1
      ) linked_identity on true
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
