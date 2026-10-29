import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ArrowRight, Bot, Check, ChevronRight, CircleAlert,
  FileText, Instagram, Loader2, Mail, MessageCircle,
  Phone, Plus, Radio, Send, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react';
import {
  createAgent, listAgents, uploadContextPdf, validateContextPdf,
  type AgentChannel, type AgentDraft, type AgentRecord, type Workspace,
} from './agent-service';
import { canManageAgents } from '@/lib/workspace';
import { canRetrySavedAgent, createOutcomeUnknown, scopedMemory } from './save-safety';
import { agentLimits, draftValidationError, safeAgentError, websiteValidationError } from './draft-validation';
import { localPdfMessage } from './context-pdf';
import { AgentEditor } from './AgentEditor';

export type AgentDraftMemory = { scope: string; draft: AgentDraft; pdf: File | null; savedAgent: AgentRecord | null; savedDraft: string | null; outcomeUnknown: boolean };
type Props = { userId: string; workspace: Workspace; createRequest?: number; preview?: boolean; draftMemory: AgentDraftMemory | null; setDraftMemory: React.Dispatch<React.SetStateAction<AgentDraftMemory | null>> };
type BuilderStep = 0 | 1 | 2 | 3;

const channelMeta: Record<AgentChannel, { label: string; icon: typeof Instagram; note: string }> = {
  instagram: { label: 'Instagram', icon: Instagram, note: 'Primera conexión disponible para prueba' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, note: 'Disponible según tu plan' },
  facebook: { label: 'Facebook', icon: MessageCircle, note: 'Messenger y comentarios' },
  tiktok: { label: 'TikTok', icon: Radio, note: 'Disponible según tu plan' },
  email: { label: 'Email', icon: Mail, note: 'Bandeja de atención' },
  telegram: { label: 'Telegram', icon: Send, note: 'Chats y comunidades' },
  sms: { label: 'SMS', icon: Phone, note: 'Mensajería transaccional' },
};

const statusMeta: Record<AgentRecord['status'], { label: string; tone: string }> = {
  draft: { label: 'Borrador', tone: 'bg-ink/5 text-ink/70' },
  processing: { label: 'Preparando información', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  needs_attention: { label: 'Requiere atención', tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  ready: { label: 'Listo para conectar', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  activating: { label: 'Activando', tone: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  active: { label: 'Activo', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  failed: { label: 'Error', tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  paused: { label: 'Pausado', tone: 'bg-ink/5 text-ink/70' },
};

const emptyDraft: AgentDraft = {
  name: '', business_name: '', business_description: '', catalog_summary: '', important_facts: '',
  operating_instructions: '', website_url: '', phone: '', goal: 'customer_service', tone: 'clear_and_warm',
  handoff_instructions: '', requested_channels: ['instagram'],
};

export function AgentWorkspace({ userId, workspace, createRequest = 0, preview = false, draftMemory, setDraftMemory }: Props) {
  return <ScopedAgentWorkspace key={`${userId}:${workspace.organizationId}:${workspace.role}`} {...{ userId, workspace, createRequest, preview, draftMemory, setDraftMemory }} />;
}

function ScopedAgentWorkspace({ userId, workspace, createRequest = 0, preview = false, draftMemory, setDraftMemory }: Props) {
  const editable = canManageAgents(workspace.role);
  const [tab, setTab] = useState<'ideas' | 'agents'>(editable ? 'ideas' : 'agents');
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState('');
  const [builderOpen, setBuilderOpen] = useState(editable && createRequest > 0);
  const [editing, setEditing] = useState<AgentRecord | null>(null);
  const refreshVersion = useRef(0);
  useEffect(() => () => { refreshVersion.current++; }, []);

  async function refresh() {
    const version = ++refreshVersion.current;
    if (preview) { setError(''); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const nextAgents = await listAgents(workspace.organizationId);
      if (version !== refreshVersion.current) return;
      setAgents(nextAgents.filter(agent => agent.organization_id === workspace.organizationId));
    } catch {
      if (version !== refreshVersion.current) return;
      setError('No pudimos cargar tus asistentes. Inténtalo de nuevo en unos segundos.');
    } finally { if (version === refreshVersion.current) setLoading(false); }
  }

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    listAgents(workspace.organizationId)
      .then((nextAgents) => {
        if (cancelled) return;
        setAgents(nextAgents.filter(agent => agent.organization_id === workspace.organizationId));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No pudimos cargar tus asistentes. Inténtalo de nuevo en unos segundos.');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [workspace.organizationId, preview]);

  function openBuilder() {
    if (!editable) return;
    setBuilderOpen(true);
  }

  return (
    <section className="stage-agent-workspace animate-rise" aria-labelledby="automation-title">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">Centro de operaciones</p>
          <h1 id="automation-title" className="font-display text-4xl font-extrabold tracking-[-.035em] text-ink sm:text-5xl">Agentes</h1>
        </div>
      </div>

      <div className="mb-7 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Automatizaciones" onKeyDown={event => {
        if (!editable || editing || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 'ideas' : event.key === 'End' ? 'agents' : tab === 'ideas' ? 'agents' : 'ideas';
        setTab(next);
        document.getElementById(`agent-tab-${next}`)?.focus();
      }}>
        {editable && <TabButton id="agent-tab-ideas" active={tab === 'ideas'} disabled={!!editing} onClick={() => setTab('ideas')}>Para empezar</TabButton>}
        <TabButton id="agent-tab-agents" active={tab === 'agents'} onClick={() => setTab('agents')}>Mis agentes <span className="ml-1 opacity-60">{agents.length}</span></TabButton>
      </div>

      {error && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-200"><CircleAlert className="shrink-0" size={18} /><span className="flex-1">{error}</span><button type="button" onClick={() => void refresh()} className="min-h-11 rounded-xl border border-current/25 px-4 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Reintentar</button></div>}

      {tab === 'ideas' ? (
        <div id="agent-tab-panel" role="tabpanel" aria-labelledby="agent-tab-ideas" className="space-y-5">
          {loading ? <p role="status" className="text-sm text-ink/70">Cargando asistentes…</p> : !error && (agents.length === 0 ? (
          <button type="button" onClick={openBuilder} className="group relative overflow-hidden rounded-[28px] border border-indigo-500/25 bg-[#172c43] p-6 text-left text-white shadow-[0_22px_70px_-44px_rgba(18,103,105,.45)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 sm:p-8">
            <div className="absolute right-0 top-0 h-44 w-44 translate-x-12 -translate-y-12 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300"><Sparkles size={23} /></span>
              </div>
              <h2 className="mt-6 max-w-xl font-display text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Agente de Atención Inteligente</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70">Crea un asistente que conoce tu negocio, conversa con tus clientes y te ayuda a recuperar tiempo. Sin configuraciones complicadas.</p>
              <p className="mt-3 text-sm text-white/70">Configuración guiada para varios canales.</p>
              <span className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-bold text-[#172c43]">Crear mi asistente <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></span>
            </div>
          </button>
          ) : (
            <section className="rounded-[28px] border border-ink/10 bg-panel p-6 sm:p-8" aria-labelledby="agent-next-title">
              <h2 id="agent-next-title" className="font-display text-2xl font-bold">Siguientes pasos</h2>
              <p className="mt-3 text-sm leading-6 text-ink/70">Ya tienes {agents.length} {agents.length === 1 ? 'asistente' : 'asistentes'} en este espacio. Revisa su configuración y estado antes de continuar.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setTab('agents')} className="min-h-11 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink">Revisar mis agentes</button>
                <button type="button" onClick={openBuilder} className="min-h-11 rounded-xl border border-ink/20 px-4 text-sm font-bold">Crear otro asistente</button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div id="agent-tab-panel" role="tabpanel" aria-labelledby="agent-tab-agents">
          <AgentList agents={agents} loading={loading} onCreate={editable ? openBuilder : undefined} onEdit={editable && !preview && !editing ? setEditing : undefined} />
          {editing && editable && !preview && editing.organization_id === workspace.organizationId && <AgentEditor key={`${userId}:${workspace.organizationId}:${editing.id}`} agent={editing} workspace={workspace} userId={userId} onClose={() => { setEditing(null); void refresh(); }} onSaved={async () => { setEditing(null); await refresh(); }} />}
        </div>
      )}

      {builderOpen && editable && (
        <AgentBuilder
          key={`${userId}:${workspace.organizationId}`}
          workspace={workspace}
          userId={userId}
          draftMemory={draftMemory}
          setDraftMemory={setDraftMemory}
          preview={preview}
          initialBusinessName={workspace.name}
          onClose={() => setBuilderOpen(false)}
          onCreated={async () => { setDraftMemory(null); setBuilderOpen(false); setTab('agents'); await refresh(); }}
        />
      )}
    </section>
  );
}

function TabButton({ id, active, disabled = false, onClick, children }: { id: string; active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button id={id} type="button" role="tab" disabled={disabled} aria-controls="agent-tab-panel" tabIndex={active ? 0 : -1} aria-selected={active} onClick={onClick} className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 ${active ? 'bg-brand text-brand-ink' : 'border border-ink/10 bg-panel text-ink/70 hover:text-ink'}`}>{children}</button>;
}

function AgentList({ agents, loading, onCreate, onEdit }: { agents: AgentRecord[]; loading: boolean; onCreate?: () => void; onEdit?: (agent: AgentRecord) => void }) {
  if (loading) return <div className="grid min-h-64 place-items-center rounded-[28px] border border-ink/10 bg-panel"><Loader2 className="animate-spin text-indigo-500" aria-label="Cargando agentes" /></div>;
  if (!agents.length) return (
    <div className="rounded-[28px] border border-dashed border-ink/15 bg-panel px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500"><Bot size={24} /></span>
      <h2 className="mt-5 font-display text-2xl font-bold">{onCreate ? 'Tu primer agente empieza aquí' : 'Aún no hay agentes en este espacio'}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/70">{onCreate ? 'Primero lo guardaremos para que puedas revisarlo. Tú decides cuándo conectarlo y ponerlo a trabajar.' : 'Un propietario, administrador u operador puede preparar el primer agente.'}</p>
      {onCreate && <button type="button" onClick={onCreate} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink"><Plus size={18} /> Crear asistente</button>}
    </div>
  );
  return <div className="space-y-3">{agents.map(agent => { const state = statusMeta[agent.status]; return (
    <article key={agent.id} className="flex flex-col gap-5 rounded-2xl border border-ink/10 bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Bot size={21} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-display text-lg font-bold">{agent.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${state.tone}`}>{state.label}</span></div><p className="mt-1 truncate text-sm text-ink/70">{agent.business_name} · {agent.requested_channels.map(channel => channelMeta[channel].label).join(', ')}</p></div></div>
      <details className="stage-agent-record min-w-0 sm:max-w-lg">
        <summary className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 text-sm font-bold text-ink/70">Ver preparación <ChevronRight size={16} /></summary>
        <dl className="mt-4 space-y-4 text-sm">{[
          ['Descripción del negocio', agent.business_description], ['Catálogo', agent.catalog_summary],
          ['Información importante', agent.important_facts], ['Instrucciones', agent.operating_instructions],
          ['Objetivo', agent.goal], ['Tono', agent.tone], ['Transferencia a una persona', agent.handoff_instructions],
          ['Sitio web', agent.website_url], ['Teléfono', agent.phone], ['Estado de preparación', agent.status_detail],
        ].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-6 text-ink/70">{value}</dd></div>)}</dl>
      </details>
      {onEdit && <button type="button" onClick={() => onEdit(agent)} className="min-h-11 rounded-xl border border-ink/20 px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Editar {agent.name}</button>}
    </article>
  ); })}</div>;
}

type BuilderProps = { workspace: Workspace; userId: string; initialBusinessName: string; onClose: () => void; onCreated: () => Promise<void>; preview?: boolean; draftMemory: AgentDraftMemory | null; setDraftMemory: React.Dispatch<React.SetStateAction<AgentDraftMemory | null>> };

export function AgentBuilder(props: BuilderProps) {
  // Remount synchronously on identity changes: an effect reset could expose the
  // previous account's controlled input values for one committed frame.
  return <ScopedAgentBuilder key={`${props.userId}:${props.workspace.organizationId}`} {...props} />;
}

function ScopedAgentBuilder({ workspace, userId, initialBusinessName, onClose, onCreated, preview = false, draftMemory, setDraftMemory }: BuilderProps) {
  const scope = `${userId}:${workspace.organizationId}`;
  const previous = scopedMemory(draftMemory, scope);
  const [step, setStep] = useState<BuilderStep>(0);
  const [draft, setDraft] = useState<AgentDraft>(previous?.draft ?? { ...emptyDraft, name: initialBusinessName.trim() ? `${initialBusinessName.trim()} Atención`.slice(0, 80) : '', business_name: initialBusinessName, requested_channels: workspace.allowedChannels.includes('instagram') ? ['instagram'] : workspace.allowedChannels.slice(0, 1) });
  const [pdf, setPdf] = useState<File | null>(previous?.pdf ?? null);
  const [saving, setSaving] = useState(false);
  const [savePhase, setSavePhase] = useState('Guardando configuración');
  const [error, setError] = useState('');
  const [websiteTouched, setWebsiteTouched] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(previous?.outcomeUnknown ?? false);
  const [partiallySaved, setPartiallySaved] = useState(Boolean(previous?.savedAgent));
  const [reconciling, setReconciling] = useState(false);
  const [reconciled, setReconciled] = useState<AgentRecord[] | null>(null);
  const steps = ['Negocio', 'Conocimiento', 'Tono y reglas', 'Revisar'];
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(document.activeElement as HTMLElement | null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveInProgress = useRef(false);
  const savedAgent = useRef<AgentRecord | null>(previous?.savedAgent ?? null);
  const savedDraft = useRef<string | null>(previous?.savedDraft ?? null);
  const active = useRef(true);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const websiteError = websiteValidationError(draft.website_url ?? '');
  const canContinue = useMemo(() => step === 0 ? [...draft.name.trim()].length >= 2 && [...draft.business_name.trim()].length >= 2 && [...draft.name].length <= agentLimits.name && [...draft.business_name].length <= agentLimits.business_name && !websiteError : step === 1 ? [...draft.business_description.trim()].length >= 20 && [...draft.business_description].length <= agentLimits.business_description : true, [step, draft, websiteError]);
  useEffect(() => { setDraftMemory({ scope, draft, pdf, savedAgent: savedAgent.current, savedDraft: savedDraft.current, outcomeUnknown }); }, [setDraftMemory, scope, draft, pdf, outcomeUnknown]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previousFocus = returnFocus.current;
    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.hasAttribute('inert');
    appRoot?.setAttribute('inert', '');
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saveInProgress.current) closeRef.current();
      if (event.key !== 'Tab') return;
      if (saveInProgress.current) {
        event.preventDefault();
        dialogRef.current?.querySelector<HTMLElement>('#builder-title')?.focus();
        return;
      }
      const fields = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])') ?? [])
        .filter(field => field.getClientRects().length > 0);
      const first = fields[0]; const last = fields[fields.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (!wasInert) appRoot?.removeAttribute('inert');
      if (previousFocus?.isConnected) previousFocus.focus();
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    const heading = dialogRef.current?.querySelector<HTMLElement>('#builder-title');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  }, [step]);

  useEffect(() => {
    if (error) dialogRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
  }, [error]);

  useEffect(() => {
    if (saving) dialogRef.current?.querySelector<HTMLElement>('#builder-title')?.focus();
  }, [saving]);

  function setField<K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) { setDraft(current => ({ ...current, [key]: value })); }

  async function save() {
    if (preview) { setError('La vista previa no guarda asistentes. Inicia sesión en la app publicada para crear uno.'); return; }
    if (saveInProgress.current) return;
    if (outcomeUnknown) { setError('No pudimos confirmar si se guardó. Revisa Mis agentes antes de intentar crear otro; conserva tus datos mientras tanto.'); return; }
    const invalid = draftValidationError(draft);
    if (invalid) { setError(invalid); return; }
    if (websiteError) { setError(websiteError); return; }
    if (savedAgent.current && !canRetrySavedAgent(savedDraft.current, draft)) {
      setError('El asistente ya se guardó con los datos anteriores. Para reintentar el documento, vuelve a esos valores; tus cambios actuales aún no se han guardado.');
      return;
    }
    saveInProgress.current = true;
    setSaving(true); setError('');
    setSavePhase('Guardando configuración');
    try {
      if (pdf) await validateContextPdf(pdf);
      if (!active.current) return;
      let agent = savedAgent.current;
      if (!agent) {
        try { agent = await createAgent(workspace.organizationId, userId, draft); }
        catch (createError) {
          if (createOutcomeUnknown(createError)) {
            setOutcomeUnknown(true);
            setError('No pudimos confirmar si se guardó. Revisa Mis agentes antes de intentar crear otro; conserva tus datos mientras tanto.');
            return;
          }
          throw createError;
        }
      }
      if (!active.current) return;
      savedAgent.current = agent;
      setPartiallySaved(true);
      if (savedDraft.current === null) savedDraft.current = JSON.stringify(draft);
      setDraftMemory({ scope, draft, pdf, savedAgent: agent, savedDraft: savedDraft.current, outcomeUnknown: false });
      if (pdf) {
        setSavePhase('Subiendo PDF');
        await uploadContextPdf(workspace.organizationId, agent.id, userId, pdf);
      }
      if (!active.current) return;
      setSavePhase('Actualizando lista');
      await onCreated();
    } catch (caught) {
      setError(localPdfMessage(caught) ?? (savedAgent.current ? 'El asistente está guardado, pero el documento no pudo subirse. Reintenta para adjuntarlo sin crear otro asistente.' : safeAgentError(caught)));
    } finally { saveInProgress.current = false; setSaving(false); }
  }

  async function reconcile() {
    if (reconciling) return;
    setReconciling(true);
    try {
      const rows = await listAgents(workspace.organizationId);
      if (!active.current) return;
      setReconciled(rows.filter(row => row.organization_id === workspace.organizationId && row.created_by === userId));
      setError('Consulta completada. Recupera un agente propio o descarta explícitamente este borrador. La ausencia en la lista no prueba que la solicitud anterior no se guardara.');
    } catch { if (active.current) setError('No pudimos consultar tus agentes. El reintento de creación sigue bloqueado.'); }
    finally { if (active.current) setReconciling(false); }
  }

  return createPortal(
      <div ref={dialogRef} className="agent-dialog-backdrop fixed inset-0 z-[100] overflow-hidden bg-canvas" role="dialog" aria-modal="true" aria-labelledby="builder-title" aria-busy={saving} onClickCapture={event => { if (saveInProgress.current) { event.preventDefault(); event.stopPropagation(); } }}>
      <div className="agent-builder-panel mx-auto flex h-[100dvh] min-h-0 max-w-7xl flex-col bg-canvas">
          <header className="shrink-0 border-b border-ink/10 bg-panel px-5 py-4 sm:px-8">
<div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4"><div className="min-w-0"><button disabled={saving} type="button" onClick={() => step === 0 ? onClose() : setStep((step - 1) as BuilderStep)} className="mb-3 inline-flex min-h-9 items-center gap-2 rounded-lg text-xs font-bold text-ink/70 hover:text-ink"><ArrowLeft size={15} /> {step === 0 ? 'Volver a automatizaciones' : 'Paso anterior'}</button><div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 id="builder-title" className="font-display text-xl font-extrabold sm:text-2xl">{steps[step]}</h2><span className="text-xs font-semibold text-ink/70" aria-live="polite">Paso {step + 1} de {steps.length}</span></div></div><button disabled={saving} autoFocus type="button" onClick={onClose} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink/70 hover:bg-ink/5 hover:text-ink"><X size={20} /></button></div>
            <div className="mt-4 grid grid-cols-4 gap-2" aria-label={`Paso ${step + 1} de 4`}>{steps.map((label, index) => <div key={label} className="min-w-0"><div className={`h-1 rounded-full ${index <= step ? 'bg-indigo-500' : 'bg-ink/10'}`} /><span className="mt-2 hidden truncate text-xs text-ink/70 sm:block">{label}</span></div>)}</div>
          </header>

          <div ref={scrollRef} className="agent-builder-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-5 pb-10 sm:px-8 sm:pb-14">
            <fieldset disabled={saving} key={step} className="agent-step-enter min-w-0 border-0 mx-auto min-h-[500px] w-full max-w-5xl py-8 sm:py-12">
            {step === 0 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={Bot} title="Dale una identidad clara" text="Este nombre identifica al agente dentro de Stage. El nombre de la empresa se usa al responder a tus clientes." /><Field maxLength={agentLimits.name} label="Nombre del agente" required value={draft.name} onChange={value => setField('name', value)} placeholder="Ej. Atlas Atención" /><Field maxLength={agentLimits.business_name} label="Nombre de la empresa" required value={draft.business_name} onChange={value => setField('business_name', value)} placeholder="Stage AI Labs" /><Select label="Objetivo principal" value={draft.goal} onChange={value => setField('goal', value)} options={[['customer_service','Servicio al cliente'],['sales_and_service','Ventas y servicio'],['lead_qualification','Calificación de prospectos']]} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Sitio web" value={draft.website_url ?? ''} onChange={value => setField('website_url', value)} onBlur={() => { setWebsiteTouched(true); setField('website_url', (draft.website_url ?? '').trim()); }} error={websiteTouched ? websiteError : null} placeholder="Opcional" type="url" /><Field label="Teléfono" value={draft.phone ?? ''} onChange={value => setField('phone', value)} placeholder="Opcional" type="tel" /></div></div>}
            {step === 1 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={FileText} title="Enséñale lo que sí sabe" text="Cuéntale cómo funciona tu negocio. Puedes adjuntar un PDF; Excel todavía no está disponible. El archivo se guarda de forma privada y aún no se procesa." /><TextArea maxLength={agentLimits.business_description} label="¿Qué hace tu empresa?" required value={draft.business_description} onChange={value => setField('business_description', value)} placeholder="Describe servicios, clientes, horarios y cómo ayudas..." /><TextArea label="Catálogo o servicios clave" value={draft.catalog_summary ?? ''} onChange={value => setField('catalog_summary', value)} placeholder="Productos, servicios, precios o condiciones importantes" /><TextArea label="Datos que nunca debe olvidar" value={draft.important_facts ?? ''} onChange={value => setField('important_facts', value)} placeholder="Horarios, cobertura, políticas de entrega o contacto humano" /><label className="block rounded-2xl border border-dashed border-ink/20 bg-panel p-5"><span className="flex items-center gap-2 text-sm font-bold"><Upload size={17} /> Documento de apoyo <span className="font-normal text-ink/70">(opcional, máximo 20 MB)</span></span><input type="file" accept="application/pdf,.pdf" onChange={event => setPdf(event.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:font-semibold file:text-ink" />{pdf && <span className="mt-2 block text-xs text-emerald-600">{pdf.name}</span>}</label></div>}
            {step === 2 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={Sparkles} title="Define cómo debe atender" text="Tus instrucciones personalizan la operación. Las reglas de privacidad, veracidad y aislamiento siempre tienen prioridad." /><Select label="Estilo de conversación" value={draft.tone} onChange={value => setField('tone', value)} options={[['clear_and_warm','Claro y cercano'],['professional','Profesional'],['concise','Breve y directo'],['friendly','Amigable']]} /><TextArea label="Instrucciones operativas" value={draft.operating_instructions ?? ''} onChange={value => setField('operating_instructions', value)} placeholder="Ej. Primero comprende la necesidad; después recomienda solo opciones disponibles." /><TextArea label="Cuándo escalar a una persona" value={draft.handoff_instructions ?? ''} onChange={value => setField('handoff_instructions', value)} placeholder="Ej. Reclamos de pago, cancelaciones o cuando el cliente lo solicite." /><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-6 text-ink/70"><span className="font-bold text-ink">Reglas de atención:</span> configura veracidad, privacidad y derivación a una persona. Verifica su comportamiento antes de activarlo.</div></div>}
            {step === 3 && <div className="mx-auto max-w-2xl"><Intro icon={ShieldCheck} title="Revisa la configuración" text="Se guardará como borrador. La información todavía no se procesa y el asistente no responde automáticamente." /><dl className="mt-7 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-panel px-5"><ReviewRow label="Asistente" value={draft.name} /><ReviewRow label="Empresa" value={draft.business_name} /><ReviewRow label="Idiomas" value="Todos: responderá en el idioma del cliente" /><ReviewRow label="Información" value={pdf ? `Datos ingresados + ${pdf.name}` : 'Datos ingresados'} /><ReviewRow label="Canales" value="Se conectan y asignan por separado más adelante" /></dl></div>}
            {error && <div role="alert" tabIndex={-1} className="mx-auto mt-5 max-w-2xl rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200"><p>{error}</p>{partiallySaved && <button type="button" className="mt-3 min-h-11 rounded-lg border border-current px-3 font-semibold focus-visible:outline focus-visible:outline-2" onClick={() => { if (savedDraft.current) { setDraft(JSON.parse(savedDraft.current) as AgentDraft); setError('Se restauraron los valores guardados. Puedes reintentar el documento.'); } }}>Restaurar configuración guardada</button>}</div>}
            {outcomeUnknown && <section className="mx-auto mt-5 max-w-2xl space-y-3" aria-label="Recuperar guardado incierto">
              <button type="button" disabled={reconciling} onClick={() => void reconcile()} className="min-h-11 rounded-xl border border-ink/20 px-4 font-semibold">{reconciling ? 'Consultando agentes' : 'Consultar mis agentes para recuperar'}</button>
              {reconciled !== null && <div className="space-y-3">
                <p className="text-sm">Solo agentes creados por ti en este espacio. Recuperar usa su configuración guardada y permite adjuntar el PDF actual.</p>
                {reconciled.map(row => <button key={row.id} type="button" className="block max-w-full break-words min-h-11 rounded-xl border border-ink/20 px-4 text-left" onClick={() => {
                  const restored = Object.fromEntries(Object.keys(emptyDraft).map(key => [key, row[key as keyof AgentDraft]])) as AgentDraft;
                  savedAgent.current = row; savedDraft.current = JSON.stringify(restored); setDraft(restored);
                  setPartiallySaved(true); setOutcomeUnknown(false); setReconciled(null); setError('Agente recuperado. Revisa su configuración antes de reintentar el PDF.');
                }}>Recuperar {row.name}</button>)}
                {!reconciled.length && <p>No encontramos agentes propios. Esto no descarta un guardado aún pendiente.</p>}
                <button type="button" className="min-h-11 rounded-xl border border-ink/20 px-4" onClick={() => { setDraftMemory(null); onClose(); }}>Descartar borrador sin borrar agentes</button>
                <p className="text-sm">Crear otro después de descartar puede duplicar una solicitud anterior. No se crea nada automáticamente.</p>
              </div>}
            </section>}
            </fieldset>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-ink/10 bg-panel px-5 py-4 sm:px-7"><div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3"><button type="button" disabled={saving} onClick={() => step === 0 ? onClose() : setStep((step - 1) as BuilderStep)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink/70 hover:bg-ink/5 hover:text-ink"><ArrowLeft size={17} /> {step === 0 ? 'Cancelar' : 'Atrás'}</button>{step < 3 ? <button type="button" disabled={!canContinue} onClick={() => setStep((step + 1) as BuilderStep)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink disabled:cursor-not-allowed disabled:opacity-40">Continuar <ArrowRight size={17} /></button> : <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink disabled:opacity-50">{saving ? <><Loader2 size={17} className="animate-spin" aria-hidden="true" /> <span role="status">{savePhase}</span></> : <><Check size={17} aria-hidden="true" /> Guardar asistente</>}</button>}</div></footer>
      </div>
    </div>, document.body
  );
}

function Intro({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) { return <div><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Icon size={21} /></span><h3 className="mt-5 font-display text-2xl font-extrabold tracking-[-.03em]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-ink/70">{text}</p></div>; }
function Field({ label, value, onChange, placeholder, type = 'text', required = false, maxLength, onBlur, error }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean; maxLength?: number; onBlur?: () => void; error?: string | null }) { return <label className="block text-sm font-bold text-ink/70">{label}{required && <span className="ml-1 text-indigo-500">*</span>}<input aria-invalid={error ? true : undefined} aria-describedby={error ? "website-error" : undefined} onBlur={onBlur} type={type} required={required} maxLength={maxLength} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-panel px-4 font-normal text-ink outline-none transition-transform duration-150 placeholder:text-ink/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15" />{error && <span id="website-error" className="mt-1 block text-sm font-normal text-rose-700 dark:text-rose-200">{error}</span>}{maxLength && <span className="mt-1 block text-xs font-normal">Entre 2 y {maxLength} caracteres.</span>}</label>; }
function TextArea({ label, value, onChange, placeholder, required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; maxLength?: number }) { return <label className="block text-sm font-bold text-ink/70">{label}{required && <span className="ml-1 text-indigo-500">*</span>}<textarea required={required} maxLength={maxLength} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={3} className="mt-2 w-full resize-y rounded-xl border border-ink/10 bg-panel px-4 py-3 font-normal leading-6 text-ink outline-none transition-transform duration-150 placeholder:text-ink/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15" />{maxLength && <span className="mt-1 block text-xs font-normal">Entre 20 y {maxLength} caracteres.</span>}</label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="block text-sm font-bold text-ink/70">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-panel px-4 font-normal text-ink outline-none focus:border-indigo-500">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <div className="grid min-w-0 gap-1 py-4 sm:grid-cols-[150px_1fr]"><dt className="text-sm font-semibold text-ink/70">{label}</dt><dd className="min-w-0 break-words text-sm font-semibold text-ink/75">{value}</dd></div>; }
