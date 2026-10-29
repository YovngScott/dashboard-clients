import { supabase } from '@/lib/supabase';
import { canManageAgents, type WorkspaceContext } from '@/lib/workspace';
import { draftValidationError, websiteValidationError } from './draft-validation';
import { validateContextPdf } from './context-pdf';
export { validateContextPdf } from './context-pdf';

export const supportedChannels = [
  'instagram',
  'whatsapp',
  'facebook',
  'tiktok',
  'email',
  'telegram',
  'sms',
] as const;

export type AgentChannel = (typeof supportedChannels)[number];
export type AgentStatus = 'draft' | 'processing' | 'needs_attention' | 'ready' | 'activating' | 'active' | 'failed' | 'paused';

export type AgentRecord = {
  created_by?: string;
  id: string;
  organization_id: string;
  name: string;
  business_name: string;
  business_description: string;
  catalog_summary: string | null;
  important_facts: string | null;
  operating_instructions: string | null;
  website_url: string | null;
  phone: string | null;
  goal: string;
  tone: string;
  handoff_instructions: string | null;
  requested_channels: AgentChannel[];
  status: AgentStatus;
  status_detail: string | null;
  updated_at: string;
};

export type AgentDraft = Omit<AgentRecord, 'id' | 'organization_id' | 'status' | 'status_detail' | 'updated_at' | 'created_by'>;

export type Workspace = WorkspaceContext;

export class AgentUpdateConflict extends Error {}

// Do not spread caller input: ownership, status and security fields are never writable here.
export function editableAgentFields(draft: AgentDraft): AgentDraft {
  return {
    name: draft.name, business_name: draft.business_name, business_description: draft.business_description,
    catalog_summary: draft.catalog_summary, important_facts: draft.important_facts,
    operating_instructions: draft.operating_instructions, website_url: draft.website_url?.trim() || null,
    phone: draft.phone, goal: draft.goal, tone: draft.tone, handoff_instructions: draft.handoff_instructions,
    requested_channels: [...draft.requested_channels],
  };
}

export async function updateAgent(workspace: Workspace, agent: AgentRecord, draft: AgentDraft): Promise<AgentRecord> {
  if (!canManageAgents(workspace.role) || agent.organization_id !== workspace.organizationId || !agent.id || !agent.updated_at) {
    throw new Error('No tienes permiso para editar este agente en este espacio.');
  }
  const invalid = draftValidationError(draft) ?? websiteValidationError(draft.website_url ?? '');
  if (invalid) throw new Error(invalid);
  const fields = editableAgentFields(draft);
  // Editing the profile must not change channel selections.
  fields.requested_channels = [...agent.requested_channels];
  const { data, error } = await supabase.from('agents').update(fields)
    .eq('organization_id', workspace.organizationId).eq('id', agent.id).eq('updated_at', agent.updated_at)
    .select('id,organization_id,created_by,name,business_name,business_description,catalog_summary,important_facts,operating_instructions,website_url,phone,goal,tone,handoff_instructions,requested_channels,status,status_detail,updated_at').maybeSingle();
  if (error) throw error;
  if (!data || data.id !== agent.id || data.organization_id !== workspace.organizationId) throw new AgentUpdateConflict();
  return data as AgentRecord;
}

export async function listAgents(organizationId: string): Promise<AgentRecord[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('id,organization_id,created_by,name,business_name,business_description,catalog_summary,important_facts,operating_instructions,website_url,phone,goal,tone,handoff_instructions,requested_channels,status,status_detail,updated_at')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AgentRecord[];
}

export async function createAgent(organizationId: string, userId: string, draft: AgentDraft): Promise<AgentRecord> {
  const validationError = draftValidationError(draft);
  if (validationError) throw new Error(validationError);
  const websiteError = websiteValidationError(draft.website_url ?? '');
  if (websiteError) throw new Error(websiteError);
  const { data, error } = await supabase
    .from('agents')
    .insert({ ...draft, organization_id: organizationId, created_by: userId })
    .select('id,organization_id,name,business_name,business_description,catalog_summary,important_facts,operating_instructions,website_url,phone,goal,tone,handoff_instructions,requested_channels,status,status_detail,updated_at')
    .single();
  if (error) throw error;
  return data as AgentRecord;
}

const pendingUploads = new WeakMap<File, { scope: string; documentId: string; registered: boolean; complete: boolean }>();

export async function uploadContextPdf(organizationId: string, agentId: string, userId: string, file: File) {
  await validateContextPdf(file);
  const scope = `${organizationId}/${agentId}/${userId}`;
  let pending = pendingUploads.get(file);
  if (!pending || pending.scope !== scope) {
    pending = { scope, documentId: crypto.randomUUID(), registered: false, complete: false };
    pendingUploads.set(file, pending);
  }
  const { documentId } = pending;
  if (pending.complete) return documentId;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-160);
  const storagePath = `${organizationId}/${agentId}/${documentId}/${safeName}`;
  // Storage RLS authorizes uploads using this ownership record. Register it first.
  if (!pending.registered) {
    const { error: metadataError } = await supabase.from('knowledge_documents').insert({
    id: documentId,
    organization_id: organizationId,
    agent_id: agentId,
    uploaded_by: userId,
    file_name: file.name.slice(-240),
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    });
    if (metadataError) throw metadataError;
    pending.registered = true;
  }
  const { error: uploadError } = await supabase.storage.from('agent-context').upload(storagePath, file, {
    cacheControl: '3600',
    contentType: 'application/pdf',
    upsert: false,
  });
  if (uploadError) throw uploadError;
  pending.complete = true;
  return documentId;
}
