import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, ChevronRight, CircleAlert,
  FileText, Globe2, Instagram, Loader2, LockKeyhole, Mail, MessageCircle,
  Phone, Plus, Radio, Send, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react';
import {
  createAgent, listAgents, uploadContextPdf, validateContextPdf,
  type AgentChannel, type AgentDraft, type AgentRecord, type Workspace,
} from './agent-service';
import { canManageAgents } from '@/lib/workspace';

type Props = { userId: string; workspace: Workspace; createRequest?: number; preview?: boolean };
type BuilderStep = 0 | 1 | 2 | 3 | 4;

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

export function AgentWorkspace({ userId, workspace, createRequest = 0, preview = false }: Props) {
  const editable = canManageAgents(workspace.role);
  const [tab, setTab] = useState<'ideas' | 'agents'>(editable ? 'ideas' : 'agents');
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState('');
  const [builderOpen, setBuilderOpen] = useState(editable && createRequest > 0);

  async function refresh() {
    if (preview) { setError(''); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      setAgents(await listAgents(workspace.organizationId));
    } catch {
      setError('No pudimos cargar tus asistentes. Inténtalo de nuevo en unos segundos.');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    listAgents(workspace.organizationId)
      .then((nextAgents) => {
        if (cancelled) return;
        setAgents(nextAgents);
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
        <div className="hidden items-center gap-2 rounded-full border border-ink/10 bg-panel px-3 py-2 text-xs font-semibold text-ink/70 sm:flex">
          <ShieldCheck size={15} className="text-emerald-500" /> Tus datos quedan separados
        </div>
      </div>

      <div className="mb-7 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Automatizaciones" onKeyDown={event => {
        if (!editable || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 'ideas' : event.key === 'End' ? 'agents' : tab === 'ideas' ? 'agents' : 'ideas';
        setTab(next);
        document.getElementById(`agent-tab-${next}`)?.focus();
      }}>
        {editable && <TabButton id="agent-tab-ideas" active={tab === 'ideas'} onClick={() => setTab('ideas')}>Para empezar</TabButton>}
        <TabButton id="agent-tab-agents" active={tab === 'agents'} onClick={() => setTab('agents')}>Mis agentes <span className="ml-1 opacity-60">{agents.length}</span></TabButton>
      </div>

      {error && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-200"><CircleAlert className="shrink-0" size={18} /><span className="flex-1">{error}</span><button type="button" onClick={() => void refresh()} className="min-h-11 rounded-xl border border-current/25 px-4 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Reintentar</button></div>}

      {tab === 'ideas' ? (
        <div id="agent-tab-panel" role="tabpanel" aria-labelledby="agent-tab-ideas" className="grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
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

          <aside className="rounded-[28px] border border-ink/10 bg-panel p-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><LockKeyhole size={20} /></span><h2 className="font-display text-lg font-bold">Protección permanente</h2></div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-ink/70">
              <li className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-emerald-500" />Cada empresa ve únicamente su propia información.</li>
              <li className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-emerald-500" />Cuando no sabe algo, lo dice o pide ayuda.</li>
              <li className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-emerald-500" />Tú decides cuándo conectarlo y ponerlo a trabajar.</li>
            </ul>
          </aside>
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-end justify-between gap-4"><h2 className="font-display text-2xl font-extrabold tracking-[-.03em]">Biblioteca de ideas para automatizar lo repetitivo</h2><span className="hidden text-sm text-ink/70 sm:block">Conecta un canal cuando estés listo</span></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <AutomationIdea onClick={openBuilder} icon={MessageCircle} title="Responder mensajes" text="Envía respuestas útiles cuando alguien te escribe." />
              <AutomationIdea onClick={openBuilder} icon={Instagram} title="Cuidar comentarios" text="Detecta una palabra y envía la información correcta." />
              <AutomationIdea onClick={openBuilder} icon={Radio} title="Compartir un video" text="Entrega un video elegido cuando tu cliente lo necesite." />
            </div>
          </div>
        </div>
      ) : (
        <div id="agent-tab-panel" role="tabpanel" aria-labelledby="agent-tab-agents"><AgentList agents={agents} loading={loading} onCreate={editable ? openBuilder : undefined} /></div>
      )}

      {builderOpen && editable && (
        <AgentBuilder
          workspace={workspace}
          userId={userId}
          preview={preview}
          initialBusinessName={workspace.name}
          onClose={() => setBuilderOpen(false)}
          onCreated={async () => { setBuilderOpen(false); setTab('agents'); await refresh(); }}
        />
      )}
    </section>
  );
}

function AutomationIdea({ icon: Icon, title, text, onClick }: { icon: typeof MessageCircle; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="stage-agent-idea group flex min-h-32 flex-col items-start justify-between rounded-2xl border border-ink/10 bg-panel p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Icon size={18} /></span><span><strong className="block text-sm font-bold">{title}</strong><span className="mt-1 block text-xs leading-5 text-ink/70">{text}</span></span><ChevronRight size={17} aria-hidden="true" /></button>;
}

function TabButton({ id, active, onClick, children }: { id: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button id={id} type="button" role="tab" aria-controls="agent-tab-panel" tabIndex={active ? 0 : -1} aria-selected={active} onClick={onClick} className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${active ? 'bg-brand text-brand-ink' : 'border border-ink/10 bg-panel text-ink/70 hover:text-ink'}`}>{children}</button>;
}

function AgentList({ agents, loading, onCreate }: { agents: AgentRecord[]; loading: boolean; onCreate?: () => void }) {
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
    </article>
  ); })}</div>;
}

export function AgentBuilder({ workspace, userId, initialBusinessName, onClose, onCreated, preview = false }: { workspace: Workspace; userId: string; initialBusinessName: string; onClose: () => void; onCreated: () => Promise<void>; preview?: boolean }) {
  const [step, setStep] = useState<BuilderStep>(0);
  const [draft, setDraft] = useState<AgentDraft>({ ...emptyDraft, business_name: initialBusinessName, requested_channels: workspace.allowedChannels.includes('instagram') ? ['instagram'] : workspace.allowedChannels.slice(0, 1) });
  const [pdf, setPdf] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const steps = ['Identidad', 'Contexto', 'Comportamiento', 'Canales', 'Revisar'];
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveInProgress = useRef(false);
  const savedAgent = useRef<AgentRecord | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const canContinue = useMemo(() => step === 0 ? draft.name.trim().length >= 2 && draft.business_name.trim().length >= 2 : step === 1 ? draft.business_description.trim().length >= 20 : step === 3 ? draft.requested_channels.length > 0 && draft.requested_channels.length <= workspace.maxConnectedChannels : true, [step, draft, workspace.maxConnectedChannels]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previousFocus = document.activeElement as HTMLElement | null;
    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.hasAttribute('inert');
    appRoot?.setAttribute('inert', '');
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saveInProgress.current) closeRef.current();
      if (event.key !== 'Tab') return;
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
      previousFocus?.focus();
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    const heading = dialogRef.current?.querySelector<HTMLElement>('#builder-title');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  }, [step]);

  function setField<K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) { setDraft(current => ({ ...current, [key]: value })); }
  function toggleChannel(channel: AgentChannel) {
    const included = draft.requested_channels.includes(channel);
    if (included && draft.requested_channels.length === 1) return;
    if (!included && draft.requested_channels.length >= workspace.maxConnectedChannels) { setError(`Tu plan permite ${workspace.maxConnectedChannels} canal conectado.`); return; }
    setError('');
    setField('requested_channels', included ? draft.requested_channels.filter(item => item !== channel) : [...draft.requested_channels, channel]);
  }

  async function save() {
    if (preview) { setError('La vista previa no guarda asistentes. Inicia sesión en la app publicada para crear uno.'); return; }
    if (saveInProgress.current) return;
    saveInProgress.current = true;
    setSaving(true); setError('');
    try {
      if (pdf) await validateContextPdf(pdf);
      const agent = savedAgent.current ?? await createAgent(workspace.organizationId, userId, draft);
      savedAgent.current = agent;
      if (pdf) await uploadContextPdf(workspace.organizationId, agent.id, userId, pdf);
      await onCreated();
    } catch (caught) {
      setError(savedAgent.current ? 'El asistente está guardado, pero el documento no pudo subirse. Reintenta para adjuntarlo sin crear otro asistente.' : caught instanceof Error ? caught.message : 'No pudimos guardar el agente.');
    } finally { saveInProgress.current = false; setSaving(false); }
  }

  return createPortal(
      <div ref={dialogRef} className="agent-dialog-backdrop fixed inset-0 z-[100] overflow-hidden bg-canvas" role="dialog" aria-modal="true" aria-labelledby="builder-title" aria-busy={saving} onClickCapture={event => { if (saveInProgress.current) { event.preventDefault(); event.stopPropagation(); } }}>
      <div className="agent-builder-panel mx-auto flex h-[100dvh] min-h-0 max-w-7xl flex-col bg-canvas">
          <header className="shrink-0 border-b border-ink/10 bg-panel px-5 py-4 sm:px-8">
<div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4"><div className="min-w-0"><button type="button" onClick={() => step === 0 ? onClose() : setStep((step - 1) as BuilderStep)} className="mb-3 inline-flex min-h-9 items-center gap-2 rounded-lg text-xs font-bold text-ink/70 hover:text-ink"><ArrowLeft size={15} /> {step === 0 ? 'Volver a automatizaciones' : 'Paso anterior'}</button><div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 id="builder-title" className="font-display text-xl font-extrabold sm:text-2xl">{steps[step]}</h2><span className="text-xs font-semibold text-ink/70" aria-live="polite">Paso {step + 1} de {steps.length}</span></div></div><button autoFocus type="button" onClick={onClose} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink/70 hover:bg-ink/5 hover:text-ink"><X size={20} /></button></div>
            <div className="mt-4 grid grid-cols-5 gap-2" aria-label={`Paso ${step + 1} de 5`}>{steps.map((label, index) => <div key={label} className="min-w-0"><div className={`h-1 rounded-full ${index <= step ? 'bg-indigo-500' : 'bg-ink/10'}`} /><span className="mt-2 hidden truncate text-xs text-ink/70 sm:block">{label}</span></div>)}</div>
          </header>

          <div ref={scrollRef} className="agent-builder-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-5 pb-10 sm:px-8 sm:pb-14">
            <div key={step} className="agent-step-enter mx-auto min-h-[500px] w-full max-w-5xl py-8 sm:py-12">
            {step === 0 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={Bot} title="Dale una identidad clara" text="Este nombre identifica al agente dentro de Stage. El nombre de la empresa se usa al responder a tus clientes." /><Field label="Nombre del agente" required value={draft.name} onChange={value => setField('name', value)} placeholder="Ej. Atlas Atención" /><Field label="Nombre de la empresa" required value={draft.business_name} onChange={value => setField('business_name', value)} placeholder="Stage AI Labs" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Sitio web" value={draft.website_url ?? ''} onChange={value => setField('website_url', value)} placeholder="Opcional" type="url" /><Field label="Teléfono" value={draft.phone ?? ''} onChange={value => setField('phone', value)} placeholder="Opcional" type="tel" /></div></div>}
            {step === 1 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={FileText} title="Enséñale lo que sí sabe" text="Cuéntale cómo funciona tu negocio. El PDF es opcional, privado y se revisa antes de ponerlo a trabajar." /><TextArea label="¿Qué hace tu empresa?" required value={draft.business_description} onChange={value => setField('business_description', value)} placeholder="Describe servicios, clientes, horarios y cómo ayudas..." /><TextArea label="Catálogo o servicios clave" value={draft.catalog_summary ?? ''} onChange={value => setField('catalog_summary', value)} placeholder="Productos, servicios, precios o condiciones importantes" /><TextArea label="Datos que nunca debe olvidar" value={draft.important_facts ?? ''} onChange={value => setField('important_facts', value)} placeholder="Horarios, cobertura, políticas de entrega o contacto humano" /><label className="block rounded-2xl border border-dashed border-ink/20 bg-panel p-5"><span className="flex items-center gap-2 text-sm font-bold"><Upload size={17} /> Documento de apoyo <span className="font-normal text-ink/70">(opcional, máximo 20 MB)</span></span><input type="file" accept="application/pdf,.pdf" onChange={event => setPdf(event.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:font-semibold file:text-ink" />{pdf && <span className="mt-2 block text-xs text-emerald-600">{pdf.name}</span>}</label></div>}
            {step === 2 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={Sparkles} title="Define cómo debe atender" text="Tus instrucciones personalizan la operación. Las reglas de privacidad, veracidad y aislamiento siempre tienen prioridad." /><Select label="Objetivo principal" value={draft.goal} onChange={value => setField('goal', value)} options={[['customer_service','Servicio al cliente'],['sales_and_service','Ventas y servicio'],['lead_qualification','Calificación de prospectos']]} /><Select label="Estilo de conversación" value={draft.tone} onChange={value => setField('tone', value)} options={[['clear_and_warm','Claro y cercano'],['professional','Profesional'],['concise','Breve y directo'],['friendly','Amigable']]} /><TextArea label="Instrucciones operativas" value={draft.operating_instructions ?? ''} onChange={value => setField('operating_instructions', value)} placeholder="Ej. Primero comprende la necesidad; después recomienda solo opciones disponibles." /><TextArea label="Cuándo escalar a una persona" value={draft.handoff_instructions ?? ''} onChange={value => setField('handoff_instructions', value)} placeholder="Ej. Reclamos de pago, cancelaciones o cuando el cliente lo solicite." /><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-6 text-ink/70"><span className="font-bold text-ink">Protección fija:</span> responde en el idioma del cliente, no revela datos de otros negocios, no inventa y pide ayuda cuando falta información.</div></div>}
            {step === 3 && <div className="mx-auto max-w-3xl"><Intro icon={Globe2} title="Elige dónde atenderá" text={`Selecciona hasta ${workspace.maxConnectedChannels} ${workspace.maxConnectedChannels === 1 ? 'canal incluido' : 'canales incluidos'} en tu plan. La autorización y activación se revisan desde Canales; elegirlos aquí no los conecta.`} /><div className="mt-6 grid gap-3 sm:grid-cols-2">{(Object.keys(channelMeta) as AgentChannel[]).map(channel => { const meta = channelMeta[channel]; const Icon = meta.icon; const allowed = workspace.allowedChannels.includes(channel); const selected = draft.requested_channels.includes(channel); return <button key={channel} type="button" aria-pressed={selected} disabled={!allowed} onClick={() => toggleChannel(channel)} className={`channel-card group flex min-h-[82px] items-center gap-4 rounded-2xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-45 ${selected ? 'border-indigo-500 bg-indigo-500/8' : 'border-ink/10 bg-panel hover:border-ink/25'}`}><span className={`channel-brand-icon channel-brand-icon--${channel} grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink/5 text-ink/70`}><Icon size={20} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{meta.label}</strong><span className="mt-1 block text-xs text-ink/70">{allowed ? meta.note : 'Disponible en otro plan'}</span></span>{selected && <CheckCircle2 size={18} className="text-indigo-500" />}</button>; })}</div></div>}
            {step === 4 && <div className="mx-auto max-w-2xl"><Intro icon={ShieldCheck} title="Todo listo para revisar" text="Guardaremos tu asistente para que puedas revisarlo. Solo empezará a responder cuando tú conectes un canal y lo actives." /><dl className="mt-7 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-panel px-5"><ReviewRow label="Asistente" value={draft.name} /><ReviewRow label="Empresa" value={draft.business_name} /><ReviewRow label="Idiomas" value="Todos: responderá en el idioma del cliente" /><ReviewRow label="Información" value={pdf ? `Datos ingresados + ${pdf.name}` : 'Datos ingresados'} /><ReviewRow label="Lugares" value={draft.requested_channels.map(channel => channelMeta[channel].label).join(', ')} /><ReviewRow label="Inicio" value="Lo activas cuando quieras" /></dl></div>}
            {error && <p role="alert" className="mx-auto mt-5 max-w-2xl rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">{error}</p>}
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-ink/10 bg-panel px-5 py-4 sm:px-7"><div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3"><button type="button" onClick={() => step === 0 ? onClose() : setStep((step - 1) as BuilderStep)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink/70 hover:bg-ink/5 hover:text-ink"><ArrowLeft size={17} /> {step === 0 ? 'Cancelar' : 'Atrás'}</button>{step < 4 ? <button type="button" disabled={!canContinue} onClick={() => setStep((step + 1) as BuilderStep)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink disabled:cursor-not-allowed disabled:opacity-40">Continuar <ArrowRight size={17} /></button> : <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Guardar asistente</button>}</div></footer>
        </div>
    </div>, document.body
  );
}

function Intro({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) { return <div><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Icon size={21} /></span><h3 className="mt-5 font-display text-2xl font-extrabold tracking-[-.03em]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-ink/70">{text}</p></div>; }
function Field({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) { return <label className="block text-sm font-bold text-ink/70">{label}{required && <span className="ml-1 text-indigo-500">*</span>}<input type={type} required={required} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-panel px-4 font-normal text-ink outline-none transition-transform duration-150 placeholder:text-ink/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15" /></label>; }
function TextArea({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) { return <label className="block text-sm font-bold text-ink/70">{label}{required && <span className="ml-1 text-indigo-500">*</span>}<textarea required={required} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={3} className="mt-2 w-full resize-y rounded-xl border border-ink/10 bg-panel px-4 py-3 font-normal leading-6 text-ink outline-none transition-transform duration-150 placeholder:text-ink/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15" /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="block text-sm font-bold text-ink/70">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-panel px-4 font-normal text-ink outline-none focus:border-indigo-500">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr]"><dt className="text-sm font-semibold text-ink/70">{label}</dt><dd className="text-sm font-semibold text-ink/75">{value}</dd></div>; }
