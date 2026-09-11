create index if not exists organization_members_invited_by_idx
  on public.organization_members(invited_by);
create index if not exists agents_created_by_idx
  on public.agents(created_by);
create index if not exists knowledge_documents_uploaded_by_idx
  on public.knowledge_documents(uploaded_by);
create index if not exists quality_runs_organization_idx
  on public.quality_runs(organization_id);
create index if not exists deployment_jobs_organization_idx
  on public.deployment_jobs(organization_id);
create index if not exists deployment_jobs_requested_by_idx
  on public.deployment_jobs(requested_by);
create index if not exists agent_audit_events_agent_idx
  on public.agent_audit_events(agent_id);
create index if not exists agent_audit_events_actor_idx
  on public.agent_audit_events(actor_user_id);
create index if not exists knowledge_content_organization_idx
  on private.knowledge_content(organization_id);
