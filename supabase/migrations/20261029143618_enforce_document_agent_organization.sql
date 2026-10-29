-- Integrity only: authorization remains in the existing RLS policies/grants.
-- No data repair, identity reassignment, or legacy bot changes.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Prevent a privileged concurrent writer from changing the checked relationship
-- between preflight and constraint installation. Schedule/review lock impact.
lock table public.agents, public.knowledge_documents in access exclusive mode;

do $$
begin
  if exists (
    select 1
    from public.knowledge_documents document
    left join public.agents agent on agent.id = document.agent_id
    where agent.id is null or agent.organization_id <> document.organization_id
  ) then
    raise exception 'document_agent_organization_mismatch: review existing data; no automatic repair'
      using errcode = '23514';
  end if;
end;
$$;

alter table public.agents
  add constraint agents_id_organization_key unique (id, organization_id);

alter table public.knowledge_documents
  add constraint knowledge_documents_agent_organization_fkey
  foreign key (agent_id, organization_id)
  references public.agents (id, organization_id)
  on update no action on delete cascade not valid;

alter table public.knowledge_documents
  validate constraint knowledge_documents_agent_organization_fkey;
commit;
