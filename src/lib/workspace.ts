import { supabase } from './supabase';

export type OrganizationRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type WorkspaceChannel = 'instagram' | 'whatsapp' | 'facebook' | 'tiktok' | 'email' | 'telegram' | 'sms';

export type WorkspaceContext = {
  organizationId: string;
  name: string;
  role: OrganizationRole;
  planCode: string;
  maxConnectedChannels: number;
  allowedChannels: WorkspaceChannel[];
};

type Membership = { organization_id: string; role: OrganizationRole };

export function selectWorkspaceMembership(memberships: Membership[]): Membership | null {
  return memberships.find((member) => member.role === 'owner') ?? memberships[0] ?? null;
}

export function canManageAgents(role: OrganizationRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

export function canManageWorkspace(role: OrganizationRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function roleLabel(role: OrganizationRole): string {
  return {
    owner: 'Propietario',
    admin: 'Administrador',
    editor: 'Operador',
    viewer: 'Lector',
  }[role];
}

export async function loadWorkspaceContext(userId: string, onboardingBusinessName: string | null): Promise<WorkspaceContext> {
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id,role')
    .eq('user_id', userId);
  if (membershipError) throw membershipError;

  let membership = selectWorkspaceMembership((memberships ?? []) as Membership[]);
  if (!membership) {
    // Legacy owners may not have an organization until they first open Agentes.
    const { data: organizationId, error: bootstrapError } = await supabase.rpc('bootstrap_my_organization', {
      organization_name: onboardingBusinessName?.trim() || 'Mi empresa',
    });
    if (bootstrapError || !organizationId) throw bootstrapError ?? new Error('No se pudo preparar el espacio.');
    membership = { organization_id: organizationId, role: 'owner' };
  }

  const [{ data: organization, error: organizationError }, { data: entitlement, error: entitlementError }] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', membership.organization_id).single(),
    supabase.from('organization_entitlements').select('plan_code,max_connected_channels,allowed_channels').eq('organization_id', membership.organization_id).single(),
  ]);
  if (organizationError || !organization) throw organizationError ?? new Error('No se pudo cargar el espacio.');
  if (entitlementError || !entitlement) throw entitlementError ?? new Error('No se pudo cargar el plan.');

  return {
    organizationId: membership.organization_id,
    name: organization.name,
    role: membership.role,
    planCode: entitlement.plan_code,
    maxConnectedChannels: entitlement.plan_code === 'launch'
      ? Math.min(entitlement.max_connected_channels, 3)
      : entitlement.max_connected_channels,
    allowedChannels: entitlement.allowed_channels as WorkspaceChannel[],
  };
}
