import { supabase } from './supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { OrganizationRole } from './workspace';
import { safeAvatar } from './account-identity';

export type TeamMember = {
  user_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: OrganizationRole;
  created_at: string;
};
export type TeamInvitation = {
  id: string;
  email: string | null;
  role: Exclude<OrganizationRole, 'owner'>;
  created_at: string;
  expires_at: string;
};
export type TeamSnapshot = {
  seat_limit: number | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
};

export async function loadTeam(organizationId: string): Promise<TeamSnapshot> {
  const { data, error } = await supabase.rpc('get_team', { target_organization_id: organizationId });
  if (error) throw error;
  const snapshot = data as TeamSnapshot;
  return {
    ...snapshot,
    members: snapshot.members.map((member) => ({
      ...member,
      avatar_url: safeAvatar(member.avatar_url),
    })),
  };
}

export async function inviteTeamMember(organizationId: string, role: TeamInvitation['role']) {
  const { data, error } = await supabase.functions.invoke('team-invite', {
    body: { organizationId, role },
  });
  if (error instanceof FunctionsHttpError) {
    const details = await error.context.json().catch(() => null);
    throw new Error(details?.error ?? error.message);
  }
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { id: string; link: string; expiresAt: string };
}

export async function revokeInvitation(invitationId: string) {
  const { error } = await supabase.rpc('revoke_team_invitation', { target_invitation_id: invitationId });
  if (error) throw error;
}

export async function setMemberRole(organizationId: string, userId: string, role: TeamInvitation['role']) {
  const { error } = await supabase.rpc('set_team_member_role', {
    target_organization_id: organizationId, target_user_id: userId, new_role: role,
  });
  if (error) throw error;
}

export async function removeMember(organizationId: string, userId: string) {
  const { error } = await supabase.rpc('remove_team_member', {
    target_organization_id: organizationId, target_user_id: userId,
  });
  if (error) throw error;
}

export function teamErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('seat_limit_unavailable')) return 'Las invitaciones se habilitan cuando el plan activo informa el cupo del equipo.';
  if (message.includes('seat_limit_reached')) return 'Ya se ocuparon todos los puestos disponibles del plan.';
  if (message.includes('already_a_member')) return 'Esta persona ya pertenece al equipo.';
  if (message.includes('invitation_already_pending')) return 'Ya hay una invitación pendiente para este correo.';
  if (message.includes('insufficient_role')) return 'Tu rol no permite realizar esta acción.';
  return 'No pudimos completar la acción. Inténtalo de nuevo.';
}
