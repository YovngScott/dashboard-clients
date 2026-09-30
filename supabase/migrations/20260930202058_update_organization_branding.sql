alter table public.organizations
  add column if not exists logo_path text;

grant update (name, website_url, phone, logo_path)
  on public.organizations to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-logos',
  'organization-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy organization_logos_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'organization-logos'
    and exists (
      select 1 from public.organizations organization
      where organization.id::text = (storage.foldername(name))[1]
        and organization.owner_user_id = (select auth.uid())
    )
  );

create policy organization_logos_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'organization-logos'
    and exists (
      select 1 from public.organizations organization
      where organization.id::text = (storage.foldername(name))[1]
        and organization.owner_user_id = (select auth.uid())
    )
  );
