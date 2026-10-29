import { supabase } from '@/lib/supabase';
import type { WorkspaceContext } from '@/lib/workspace';
import { draftValidationError } from './draft-validation';
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
  if (draft.website_url?.trim()) {
    try {
      const website = new URL(draft.website_url.trim());
      if (!['https:', 'http:'].includes(website.protocol) || website.username || website.password) throw new Error();
    } catch { throw new Error('Introduce una dirección web válida que empiece por https://.'); }
  }
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
