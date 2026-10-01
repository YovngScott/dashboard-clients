import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Plus, RotateCw, Save, Trash2, Users } from 'lucide-react';
import type { WorkspaceContext, WorkspaceChannel } from '@/lib/workspace';
import { canManageWorkspace, roleLabel } from '@/lib/workspace';
import { loadTeam, type TeamMember, type TeamSnapshot } from '@/lib/team';
import { supabase } from '@/lib/supabase';

type AssignmentMode = 'off' | 'basic' | 'advanced';
type AssignmentAgent = { user_id: string; enabled: boolean; max_open_conversations: number | null };
type AssignmentRule = { id: string; channel: WorkspaceChannel; target_user_id: string; enabled: boolean };
type AssignmentConfig = { mode: AssignmentMode; agents: AssignmentAgent[]; rules: AssignmentRule[] };

const modeOptions: { value: AssignmentMode; title: string; description: string }[] = [
  { value: 'off', title: 'Desactivada', description: 'Las nuevas conversaciones quedan sin asignar hasta que alguien del equipo las tome.' },
  { value: 'basic', title: 'Básica', description: 'Reparte por turnos las nuevas conversaciones entre los agentes disponibles.' },
  { value: 'advanced', title: 'Avanzada', description: 'Dirige conversaciones según su canal a una persona concreta del equipo.' },
];

const channels: { value: WorkspaceChannel; label: string }[] = [
  { value: 'instagram', label: 'Instagram' }, { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Messenger' }, { value: 'tiktok', label: 'TikTok' },
  { value: 'email', label: 'Correo electrónico' }, { value: 'telegram', label: 'Telegram' },
  { value: 'sms', label: 'SMS' },
];

function defaultConfig(members: TeamMember[] = []): AssignmentConfig {
  return {
    mode: 'off',
    agents: members.filter((member) => member.role !== 'viewer').map((member) => ({
      user_id: member.user_id, enabled: true, max_open_conversations: 10,
    })),
    rules: [],
  };
}

function isMode(value: unknown): value is AssignmentMode {
  return value === 'off' || value === 'basic' || value === 'advanced';
}

function safeConfig(value: unknown, members: TeamMember[]): AssignmentConfig {
  const fallback = defaultConfig(members);
  if (!value || typeof value !== 'object') return fallback;
  const source = value as Partial<AssignmentConfig>;
  const memberIds = new Set(members.filter((member) => member.role !== 'viewer').map((member) => member.user_id));
  const savedAgents = Array.isArray(source.agents) ? source.agents : [];
  const agents = members.filter((member) => member.role !== 'viewer').map((member) => {
    const saved = savedAgents.find((item) => item?.user_id === member.user_id);
    return saved && typeof saved.enabled === 'boolean'
      ? { user_id: member.user_id, enabled: saved.enabled, max_open_conversations: saved.max_open_conversations === null ? null : Math.max(1, Math.min(500, Number(saved.max_open_conversations) || 10)) }
      : { user_id: member.user_id, enabled: false, max_open_conversations: 10 };
  });
  const rules = (Array.isArray(source.rules) ? source.rules : []).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const rule = item as AssignmentRule;
    if (!channels.some((channel) => channel.value === rule.channel) || !memberIds.has(rule.target_user_id)) return [];
    return [{ id: String(rule.id || crypto.randomUUID()), channel: rule.channel, target_user_id: rule.target_user_id, enabled: Boolean(rule.enabled) }];
  });
  return { mode: isMode(source.mode) ? source.mode : fallback.mode, agents, rules };
}

function previewTeam(userId: string): TeamSnapshot {
  const now = new Date().toISOString();
  return {
    seat_limit: 5,
    members: [
      { user_id: userId, email: 'propietario@ejemplo.invalid', name: 'Propietario de muestra', avatar_url: null, role: 'owner', created_at: now },
      { user_id: 'preview-operator', email: 'operador@ejemplo.invalid', name: 'Operador de muestra', avatar_url: null, role: 'editor', created_at: now },
      { user_id: 'preview-reader', email: 'lector@ejemplo.invalid', name: 'Lector de muestra', avatar_url: null, role: 'viewer', created_at: now },
    ],
    invitations: [],
  };
}

export function AutoAssignmentSettings({ workspace, userId, preview = false }: { workspace: WorkspaceContext; userId: string; preview?: boolean }) {
  const canManage = canManageWorkspace(workspace.role);
  const [team, setTeam] = useState<TeamSnapshot | null>(() => preview ? previewTeam(userId) : null);
  const [config, setConfig] = useState<AssignmentConfig | null>(() => preview ? defaultConfig(previewTeam(userId).members) : null);
  const [loading, setLoading] = useState(!preview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const agentsById = useMemo(() => new Map((team?.members ?? []).map((member) => [member.user_id, member])), [team]);
  const eligibleAgents = config?.agents.filter((agent) => agent.enabled && agentsById.has(agent.user_id)) ?? [];

  async function refresh() {
    setLoading(true);
    setError('');
    if (preview) {
      const nextTeam = previewTeam(userId);
      setTeam(nextTeam);
      setConfig(defaultConfig(nextTeam.members));
      setLoading(false);
      return;
    }
    try {
      const [nextTeam, { data, error: configError }] = await Promise.all([
        loadTeam(workspace.organizationId),
        supabase.from('organization_auto_assignment_settings').select('mode,agents,rules').eq('organization_id', workspace.organizationId).maybeSingle(),
      ]);
      if (configError) throw configError;
      setTeam(nextTeam);
      setConfig(data ? safeConfig(data, nextTeam.members) : defaultConfig(nextTeam.members));
    } catch {
      setError('No se pudo cargar la configuración ni el equipo. Revisa la conexión y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    Promise.all([
      loadTeam(workspace.organizationId),
      supabase.from('organization_auto_assignment_settings').select('mode,agents,rules').eq('organization_id', workspace.organizationId).maybeSingle(),
    ]).then(([nextTeam, result]) => {
      if (cancelled) return;
      if (result.error) throw result.error;
      setTeam(nextTeam);
      setConfig(result.data ? safeConfig(result.data, nextTeam.members) : defaultConfig(nextTeam.members));
      setError('');
    }).catch(() => {
      if (!cancelled) setError('No se pudo cargar la configuración ni el equipo. Revisa la conexión y vuelve a intentarlo.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [preview, userId, workspace.organizationId]);

  function updateConfig(update: (current: AssignmentConfig) => AssignmentConfig) {
    setConfig((current) => current ? update(current) : current);
    setNotice('');
  }

  async function save() {
    if (!config || !canManage) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: saveError } = await supabase.from('organization_auto_assignment_settings').upsert({
        organization_id: workspace.organizationId,
        mode: config.mode,
        agents: config.agents,
        rules: config.rules,
        updated_by: userId,
      }, { onConflict: 'organization_id' });
      if (saveError) throw saveError;
      setNotice('Preferencias guardadas. El reparto de conversaciones sigue pendiente de conectar a Inbox.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setError(message.includes('auto_assignment')
        ? 'Una regla apunta a una persona que ya no pertenece a este espacio. Actualiza el equipo y vuelve a guardar.'
        : 'No se pudieron guardar las preferencias. Comprueba tus permisos y vuelve a intentarlo.');
    } finally {
      setBusy(false);
    }
  }

  function addRule() {
    if (!config) return;
    const target = eligibleAgents[0]?.user_id ?? '';
    updateConfig((current) => ({
      ...current,
      rules: [...current.rules, { id: crypto.randomUUID(), channel: 'instagram', target_user_id: target, enabled: true }],
    }));
  }

  return <section aria-labelledby="assignment-heading" className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 id="assignment-heading" className="text-base font-bold">Asignación automática</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/70">Elige cómo deberían repartirse las nuevas conversaciones entre las personas de tu equipo.</p>
      </div>
      <button type="button" onClick={() => void refresh()} disabled={loading || busy} aria-label="Actualizar asignación automática" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 px-3 text-sm font-semibold text-ink/75 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50">
        <RotateCw size={16} /> Actualizar
      </button>
    </div>

    <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-600/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-950 dark:text-amber-100">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <p><strong>{preview ? 'Vista previa con personas de muestra.' : 'La bandeja aún no ejecuta el reparto.'}</strong> {preview ? 'Los controles sirven para explorar la interfaz; no se guardan.' : 'Estas preferencias se guardan para el espacio; conectar conversaciones y asignarlas automáticamente será una fase posterior.'}</p>
    </div>

    {error && <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-800 dark:text-red-200">{error}</p>}
    {loading && <p role="status" className="rounded-2xl border border-ink/10 bg-panel p-5 text-sm text-ink/70">Cargando equipo y preferencias…</p>}

    {!loading && config && team && <>
      <fieldset disabled={!canManage || busy} className="min-w-0">
        <legend className="mb-3 text-sm font-semibold">Modo de asignación</legend>
        <div className="grid gap-3 lg:grid-cols-3">
          {modeOptions.map((option) => <label key={option.value} className={`flex min-h-28 cursor-pointer gap-3 rounded-2xl border p-4 transition-transform duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-500 ${config.mode === option.value ? 'border-indigo-600/45 bg-indigo-500/10' : 'border-ink/10 bg-panel hover:border-ink/25'}`}>
            <input type="radio" name="assignment-mode" value={option.value} checked={config.mode === option.value} onChange={() => updateConfig((current) => ({ ...current, mode: option.value }))} className="mt-0.5 h-4 w-4 accent-teal-700" />
            <span className="min-w-0"><span className="block text-sm font-semibold text-ink">{option.title}</span><span className="mt-1 block text-xs leading-5 text-ink/70">{option.description}</span></span>
          </label>)}
        </div>
      </fieldset>

      {config.mode !== 'off' && <>
        <section aria-labelledby="assignment-agents-heading" className="overflow-hidden rounded-2xl border border-ink/10 bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-5">
            <div><h4 id="assignment-agents-heading" className="flex items-center gap-2 text-sm font-bold"><Users size={17} className="text-indigo-600" /> Agentes disponibles</h4><p className="mt-1 text-xs leading-5 text-ink/70">El límite evita dirigir más conversaciones a una persona de las que puede atender.</p></div>
            <span className="text-xs font-medium text-ink/70">{eligibleAgents.length} seleccionados</span>
          </div>
          {config.agents.map((agent) => {
            const member = agentsById.get(agent.user_id);
            if (!member) return null;
            return <div key={agent.user_id} className="grid gap-3 border-b border-ink/10 px-4 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)] sm:items-center sm:px-5">
              <label className="flex min-w-0 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={agent.enabled} disabled={!canManage || busy} onChange={(event) => updateConfig((current) => ({ ...current, agents: current.agents.map((item) => item.user_id === agent.user_id ? { ...item, enabled: event.target.checked } : item) }))} className="h-4 w-4 shrink-0 accent-teal-700 disabled:cursor-not-allowed" />
                {member.avatar_url ? <img src={member.avatar_url} alt="" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-ink/10" /> : <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-700 dark:text-indigo-300">{member.name.trim().charAt(0).toUpperCase() || '?'}</span>}
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{member.name}</span><span className="block truncate text-xs text-ink/70">{roleLabel(member.role)} · {member.email}</span></span>
              </label>
              <label className={`grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-3 text-xs font-medium text-ink/70 ${agent.enabled ? '' : 'opacity-45'}`}>
                <span>Límite abierto</span>
                <input type="number" min={1} max={500} step={1} value={agent.max_open_conversations ?? ''} disabled={!canManage || busy || !agent.enabled || agent.max_open_conversations === null} aria-label={`Límite de conversaciones de ${member.name}`} onChange={(event) => updateConfig((current) => ({ ...current, agents: current.agents.map((item) => item.user_id === agent.user_id ? { ...item, max_open_conversations: Math.max(1, Math.min(500, Number(event.target.value) || 1)) } : item) }))} className="min-h-10 w-full rounded-lg border border-ink/15 bg-canvas px-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 disabled:cursor-not-allowed" />
              </label>
              <label className="sm:col-start-2 sm:justify-self-end inline-flex min-h-8 items-center gap-2 text-xs text-ink/70">
                <input type="checkbox" checked={agent.max_open_conversations === null} disabled={!canManage || busy || !agent.enabled} onChange={(event) => updateConfig((current) => ({ ...current, agents: current.agents.map((item) => item.user_id === agent.user_id ? { ...item, max_open_conversations: event.target.checked ? null : 10 } : item) }))} className="h-4 w-4 accent-teal-700 disabled:cursor-not-allowed" /> Sin límite
              </label>
            </div>;
          })}
          {config.agents.length === 0 && <p className="px-5 py-4 text-sm text-ink/70">No hay miembros elegibles. Invita un operador o cambia un rol de lector desde Miembros del equipo.</p>}
        </section>

        {config.mode === 'basic' && <p className="rounded-xl border border-ink/10 bg-panel px-4 py-3 text-sm leading-6 text-ink/70">La distribución básica usa turnos entre las personas activadas y respeta su límite de conversaciones abiertas.</p>}

        {config.mode === 'advanced' && <section aria-labelledby="assignment-rules-heading" className="overflow-hidden rounded-2xl border border-ink/10 bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-5">
            <div><h4 id="assignment-rules-heading" className="text-sm font-bold">Reglas por canal</h4><p className="mt-1 text-xs leading-5 text-ink/70">Cada regla dirige conversaciones de un canal a una persona seleccionada.</p></div>
            <button type="button" onClick={addRule} disabled={!canManage || busy || eligibleAgents.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 px-3 text-sm font-semibold text-ink hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"><Plus size={16} /> Añadir regla</button>
          </div>
          {config.rules.map((rule, index) => <div key={rule.id} className="grid gap-3 border-b border-ink/10 p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:px-5">
            <label className="block min-w-0 text-xs font-semibold text-ink/70">Canal<select disabled={!canManage || busy} value={rule.channel} onChange={(event) => updateConfig((current) => ({ ...current, rules: current.rules.map((item) => item.id === rule.id ? { ...item, channel: event.target.value as WorkspaceChannel } : item) }))} className="mt-1.5 block min-h-11 w-full rounded-xl border border-ink/15 bg-canvas px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{channels.map((channel) => <option key={channel.value} value={channel.value}>{channel.label}</option>)}</select></label>
            <label className="block min-w-0 text-xs font-semibold text-ink/70">Asignar a<select disabled={!canManage || busy} value={rule.target_user_id} onChange={(event) => updateConfig((current) => ({ ...current, rules: current.rules.map((item) => item.id === rule.id ? { ...item, target_user_id: event.target.value } : item) }))} className="mt-1.5 block min-h-11 w-full rounded-xl border border-ink/15 bg-canvas px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{config.agents.filter((agent) => agent.enabled).map((agent) => { const member = agentsById.get(agent.user_id)!; return <option key={member.user_id} value={member.user_id}>{member.name}</option>; })}</select></label>
            <div className="flex items-center justify-between gap-3 sm:justify-end"><label className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-ink/70"><input type="checkbox" checked={rule.enabled} disabled={!canManage || busy} onChange={(event) => updateConfig((current) => ({ ...current, rules: current.rules.map((item) => item.id === rule.id ? { ...item, enabled: event.target.checked } : item) }))} className="h-4 w-4 accent-teal-700 disabled:cursor-not-allowed" />Regla activa</label><button type="button" aria-label={`Eliminar regla ${index + 1}`} disabled={!canManage || busy} onClick={() => updateConfig((current) => ({ ...current, rules: current.rules.filter((item) => item.id !== rule.id) }))} className="grid h-11 w-11 place-items-center rounded-lg text-ink/70 hover:bg-red-500/10 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={16} /></button></div>
          </div>)}
          {config.rules.length === 0 && <p className="px-5 py-4 text-sm text-ink/70">Aún no hay reglas. Añade una para dirigir un canal a una persona del equipo.</p>}
          <p className="border-t border-ink/10 px-4 py-3 text-xs leading-5 text-ink/70 sm:px-5">Las reglas actuales permiten elegir canal y persona. Los grupos y otras condiciones avanzadas de Inbox todavía no existen en Stage.</p>
        </section>}
      </>}

      {!canManage && <p className="rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink/70">Solo propietarios y administradores pueden cambiar estas preferencias.</p>}
      {notice && <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-700/20 bg-emerald-700/8 px-4 py-3 text-sm leading-5 text-emerald-950 dark:text-emerald-100"><Check size={17} className="mt-0.5 shrink-0" />{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <p className="text-xs text-ink/70">Los cambios son por espacio y se aplicarán cuando Inbox tenga motor de asignación.</p>
        {canManage && !preview && <button type="button" onClick={() => void save()} disabled={busy || loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"><Save size={16} />{busy ? 'Guardando…' : 'Guardar preferencias'}</button>}
      </div>
    </>}
  </section>;
}
