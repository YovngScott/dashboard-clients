import { useEffect, useState, type FormEvent } from 'react';
import { Copy, MailPlus, RotateCw, UserMinus, Users, X } from 'lucide-react';
import type { WorkspaceContext } from '@/lib/workspace';
import { canManageWorkspace, roleLabel } from '@/lib/workspace';
import {
  inviteTeamMember, loadTeam, removeMember, revokeInvitation, setMemberRole,
  teamErrorMessage, type TeamInvitation, type TeamSnapshot,
} from '@/lib/team';

export function TeamSettings({ workspace, userId }: { workspace: WorkspaceContext; userId: string }) {
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'dashboard';
  const [team, setTeam] = useState<TeamSnapshot | null>(preview ? {
    seat_limit: 3,
    members: [{ user_id: userId, email: 'propietario@empresa.com', name: 'Vista previa', role: 'owner', created_at: new Date().toISOString() }],
    invitations: [],
  } : null);
  const [loading, setLoading] = useState(!preview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamInvitation['role']>('editor');
  const [lastLink, setLastLink] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const canManage = canManageWorkspace(workspace.role);

  async function refresh() {
    if (preview) return;
    setLoading(true);
    try { setTeam(await loadTeam(workspace.organizationId)); setError(''); }
    catch { setError('No pudimos cargar el equipo. Comprueba la conexión y reintenta.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    loadTeam(workspace.organizationId)
      .then((snapshot) => { if (!cancelled) { setTeam(snapshot); setError(''); } })
      .catch(() => { if (!cancelled) setError('No pudimos cargar el equipo. Comprueba la conexión y reintenta.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [workspace.organizationId, preview]);

  async function perform(action: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await refresh(); setNotice(success); }
    catch (cause) { setError(teamErrorMessage(cause)); }
    finally { setBusy(false); }
  }

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice(''); setLastLink('');
    try {
      const result = await inviteTeamMember(workspace.organizationId, email.trim(), role);
      setEmail(''); setLastLink(result.link);
      await refresh();
      setNotice(result.sent ? 'Invitación enviada. También puedes copiar el enlace.' : 'No se pudo enviar el correo. Copia y comparte el enlace de invitación.');
    } catch (cause) { setError(teamErrorMessage(cause)); }
    finally { setBusy(false); }
  }

  const occupied = (team?.members.length ?? 0) + (team?.invitations.length ?? 0);
  const seatsAvailable = team?.seat_limit != null && occupied < team.seat_limit;
  const allowInvite = canManage && !preview && !loading && seatsAvailable;

  return <section aria-labelledby="team-heading" className="lg:col-span-2">
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <h2 id="team-heading" className="font-display text-xl font-bold tracking-tight text-ink">Equipo</h2>
        <p className="mt-1 text-sm text-ink/65">Personas con acceso a {workspace.name}.</p>
      </div>
      <button type="button" onClick={() => void refresh()} disabled={loading || busy} aria-label="Actualizar equipo"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 px-3 text-sm font-semibold text-ink/75 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50">
        <RotateCw size={16} /> Actualizar
      </button>
    </div>
    <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-panel shadow-sm dark:border-zinc-800/80">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink"><Users size={18} className="text-teal-500" /> Miembros y acceso</div>
        {team && <span className="text-xs font-semibold text-ink/60">{team.seat_limit == null ? `${team.members.length} miembros` : `${occupied} de ${team.seat_limit} puestos ocupados`}</span>}
      </div>
      {error && <p role="alert" className="mx-5 mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="mx-5 mt-4 rounded-xl bg-teal-500/10 p-3 text-sm text-teal-800 dark:text-teal-200">{notice}</p>}
      {loading && !team ? <p role="status" className="p-5 text-sm text-ink/60">Cargando equipo...</p> : null}
      {team && <div className="divide-y divide-ink/10">
        {team.members.map((member) => {
          const canEdit = canManage && member.role !== 'owner' && member.user_id !== userId && (workspace.role === 'owner' || member.role !== 'admin');
          return <div key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-500/10 text-sm font-bold text-teal-700 dark:text-teal-300">{member.name?.trim().charAt(0).toUpperCase() || '?'}</span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{member.name}{member.user_id === userId ? ' (tú)' : ''}</p><p className="truncate text-xs text-ink/60">{member.email}</p></div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit ? <>
                <label className="sr-only" htmlFor={`team-role-${member.user_id}`}>Rol de {member.name}</label>
                <select id={`team-role-${member.user_id}`} value={member.role} disabled={busy}
                  onChange={(event) => void perform(() => setMemberRole(workspace.organizationId, member.user_id, event.target.value as TeamInvitation['role']), 'Rol actualizado.')}
                  className="min-h-11 rounded-xl border border-ink/15 bg-panel px-3 text-xs font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
                  {workspace.role === 'owner' && <option value="admin">Administrador</option>}<option value="editor">Operador</option><option value="viewer">Lector</option>
                </select>
                {removeTarget === member.user_id ? <span className="flex items-center gap-1 text-xs"><span className="mr-1 text-ink/65">¿Quitar?</span><button type="button" disabled={busy} onClick={() => void perform(async () => { await removeMember(workspace.organizationId, member.user_id); setRemoveTarget(null); }, 'Miembro retirado del equipo.')} className="min-h-11 rounded-lg px-2 font-bold text-red-700 hover:bg-red-500/10 dark:text-red-300">Sí</button><button type="button" onClick={() => setRemoveTarget(null)} className="min-h-11 rounded-lg px-2 text-ink/70">No</button></span> : <button type="button" aria-label={`Quitar a ${member.name}`} onClick={() => setRemoveTarget(member.user_id)} className="grid h-11 w-11 place-items-center rounded-xl text-ink/55 hover:bg-red-500/10 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"><UserMinus size={17} /></button>}
              </> : <span className="rounded-lg border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/70">{roleLabel(member.role)}</span>}
            </div>
          </div>;
        })}
      </div>}

      {canManage && team && <>
        {team.invitations.length > 0 && <div className="border-t border-ink/10 px-5 py-4"><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/55">Invitaciones pendientes</h3><div className="divide-y divide-ink/10">{team.invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{invitation.email}</p><p className="text-xs text-ink/60">{roleLabel(invitation.role)} · vence el {new Date(invitation.expires_at).toLocaleDateString('es')}</p></div><button type="button" disabled={busy} onClick={() => void perform(() => revokeInvitation(invitation.id), 'Invitación cancelada.')} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-ink/65 hover:bg-red-500/10 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"><X size={15} /> Cancelar</button></div>)}</div></div>}
        <form onSubmit={(event) => void submitInvite(event)} className="border-t border-ink/10 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><MailPlus size={18} className="text-teal-500" /> Invitar a alguien</h3>
          <p className="mt-1 text-xs leading-5 text-ink/60">La invitación vence en 7 días y reserva un puesto mientras está pendiente.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="min-w-0 flex-1 text-xs font-semibold text-ink/75">Correo electrónico<input type="email" required value={email} disabled={!allowInvite || busy} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" className="mt-1.5 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm text-ink placeholder:text-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50" /></label>
            <label className="text-xs font-semibold text-ink/75">Rol<select value={role} disabled={!allowInvite || busy} onChange={(event) => setRole(event.target.value as TeamInvitation['role'])} className="mt-1.5 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50 sm:w-40">{workspace.role === 'owner' && <option value="admin">Administrador</option>}<option value="editor">Operador</option><option value="viewer">Lector</option></select></label>
            <button type="submit" disabled={!allowInvite || busy} className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50">{busy ? 'Procesando...' : 'Enviar invitación'}</button>
          </div>
          {team.seat_limit == null && <p className="mt-3 text-xs text-ink/60">La gestión de miembros está disponible. Para enviar invitaciones, el plan debe tener un cupo de puestos confirmado.</p>}
          {team.seat_limit != null && !seatsAvailable && <p className="mt-3 text-xs text-ink/60">No quedan puestos disponibles. Cancela una invitación pendiente o ajusta tu plan.</p>}
          {lastLink && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-ink/5 p-3"><span className="min-w-0 flex-1 break-all text-xs text-ink/75">{lastLink}</span><button type="button" onClick={() => void navigator.clipboard.writeText(lastLink).then(() => setNotice('Enlace copiado.')).catch(() => setError('No se pudo copiar. Selecciona el enlace manualmente.'))} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/15 px-3 text-xs font-semibold text-ink"><Copy size={14} /> Copiar enlace</button></div>}
        </form>
      </>}
    </div>
  </section>;
}
