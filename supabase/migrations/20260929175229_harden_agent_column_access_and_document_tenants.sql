-- Remove broad default grants before restoring the intended column-level API.
revoke all on public.organizations, public.organization_members, public.agents,
public.knowledge_documents, public.agent_channel_connections, public.organization_entitlements,
public.quality_runs, public.deployment_jobs, public.agent_audit_events from public, anon, authenticated;

grant select on public.organizations, public.organization_members, public.agents,
public.knowledge_documents, public.agent_channel_connections, public.organization_entitlements,
public.quality_runs, public.deployment_jobs, public.agent_audit_events to authenticated;
grant update (name, website_url, phone) on public.organizations to authenticated;
grant insert (organization_id, created_by, name, business_name, business_description, catalog_summary,
important_facts, operating_instructions, website_url, phone, goal, tone, handoff_instructions, requested_channels)
on public.agents to authenticated;
grant update (name, business_name, business_description, catalog_summary, important_facts,
operating_instructions, website_url, phone, goal, tone, handoff_instructions, requested_channels)
on public.agents to authenticated;
grant insert (id, organization_id, agent_id, uploaded_by, file_name, storage_path, mime_type, size_bytes)
on public.knowledge_documents to authenticated;

alter policy knowledge_documents_insert_editor on public.knowledge_documents
with check (
 uploaded_by = (select auth.uid())
 and (select private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
 and exists (
  select 1 from public.agents agent
  where agent.id = knowledge_documents.agent_id
  and agent.organization_id = knowledge_documents.organization_id
 )
);
