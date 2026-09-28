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
      and cardinality(requested) <= case
        when entitlement.plan_code = 'launch' then least(entitlement.max_connected_channels, 3)
        else entitlement.max_connected_channels
      end
  );
$$;
