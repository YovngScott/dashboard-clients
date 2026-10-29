-- Forward-only fix: branding permits owners/admins, so Storage must use
-- the same tenant-scoped role check as organizations_update_admin.
alter policy organization_logos_insert_owner on storage.objects
  with check (
    bucket_id = 'organization-logos'
    and exists (
      select 1 from public.organizations organization
      where organization.id::text = (storage.foldername(name))[1]
        and private.has_org_role(organization.id, array['owner', 'admin'])
    )
  );

alter policy organization_logos_delete_owner on storage.objects
  using (
    bucket_id = 'organization-logos'
    and exists (
      select 1 from public.organizations organization
      where organization.id::text = (storage.foldername(name))[1]
        and private.has_org_role(organization.id, array['owner', 'admin'])
    )
  );
