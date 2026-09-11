import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, ChevronRight, CircleAlert,
  FileText, Globe2, Instagram, Loader2, LockKeyhole, Mail, MessageCircle,
  Phone, Plus, Radio, Send, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react';
import {
  createAgent, ensureWorkspace, listAgents, uploadContextPdf,
  type AgentChannel, type AgentDraft, type AgentRecord, type Workspace,
} from './agent-service';

type Props = { userId: string; profileName: string | null };
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
  draft: { label: 'Borrador', tone: 'bg-ink/5 text-ink/55' },
  processing: { label: 'Procesando contexto', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  needs_attention: { label: 'Requiere atención', tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  ready: { label: 'Listo para conectar', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  activating: { label: 'Activando', tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  active: { label: 'Activo', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  failed: { label: 'Error', tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  paused: { label: 'Pausado', tone: 'bg-ink/5 text-ink/55' },
};

const emptyDraft: AgentDraft = {
  name: '', business_name: '', business_description: '', catalog_summary: '', important_facts: '',
  operating_instructions: '', website_url: '', phone: '', goal: 'customer_service', tone: 'clear_and_warm',
  handoff_instructions: '', requested_channels: ['instagram'],
};

export function AgentWorkspace({ userId, profileName }: Props) {
  const [tab, setTab] = useState<'ideas' | 'agents'>('ideas');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);

  async function refresh() {
    setLoading(true); setError('');
    try {
      const nextWorkspace = await ensureWorkspace(profileName);
      setWorkspace(nextWorkspace);
      setAgents(await listAgents(nextWorkspace.organizationId));
    } catch {
      setError('No pudimos cargar tus agentes. La base segura de agentes puede requerir la nueva migración.');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    ensureWorkspace(profileName)
      .then(async nextWorkspace => ({ nextWorkspace, nextAgents: await listAgents(nextWorkspace.organizationId) }))
      .then(({ nextWorkspace, nextAgents }) => {
        if (cancelled) return;
        setWorkspace(nextWorkspace);
        setAgents(nextAgents);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No pudimos cargar tus agentes. La base segura de agentes puede requerir la nueva migración.');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileName]);

  return (
    <section className="animate-rise" aria-labelledby="automation-title">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-teal-700 dark:text-teal-300">Centro de operaciones</p>
          <h1 id="automation-title" className="font-display text-4xl font-extrabold tracking-[-.045em] text-ink sm:text-5xl">Automatizaciones</h1>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-ink/10 bg-panel px-3 py-2 text-xs font-semibold text-ink/55 sm:flex">
          <ShieldCheck size={15} className="text-emerald-500" /> Aislamiento por organización
        </div>
      </div>

      <div className="mb-7 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Automatizaciones">
        <TabButton active={tab === 'ideas'} onClick={() => setTab('ideas')}>Para empezar</TabButton>
        <TabButton active={tab === 'agents'} onClick={() => setTab('agents')}>Mis agentes <span className="ml-1 opacity-60">{agents.length}</span></TabButton>
      </div>

      {error && <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-200"><CircleAlert className="mt-0.5 shrink-0" size={18} /><span>{error}</span></div>}

      {tab === 'ideas' ? (
        <div className="grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
          <button type="button" onClick={() => setBuilderOpen(true)} className="group relative overflow-hidden rounded-[28px] border border-violet-500/25 bg-[#11131a] p-6 text-left text-white shadow-[0_22px_70px_-44px_rgba(79,70,229,.9)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500 sm:p-8">
            <div className="absolute right-0 top-0 h-44 w-44 translate-x-12 -translate-y-12 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><Sparkles size={23} /></span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/60">CONFIGURACIÓN GUIADA</span>
              </div>
              <p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-teal-300">Agente multicanal</p>
              <h2 className="mt-3 max-w-xl font-display text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Agente de Atención Inteligente</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/60">Configura la identidad, el contexto y el comportamiento de tu empresa. Habla cualquier idioma y conserva las reglas de seguridad de Stage.</p>
              <span className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-bold text-[#11131a]">Crear agente <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></span>
            </div>
          </button>

          <aside className="rounded-[28px] border border-ink/10 bg-panel p-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><LockKeyhole size={20} /></span><h2 className="font-display text-lg font-bold">Protección permanente</h2></div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-ink/55">
              <li className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-emerald-500" />El cliente no puede desactivar la confidencialidad ni el aislamiento.</li>
              <li className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-emerald-500" />Si falta información, el agente lo reconoce o escala.</li>
              <li className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-emerald-500" />Publicar exige contexto procesado, pruebas aprobadas y un canal conectado.</li>
            </ul>
          </aside>
        </div>
      ) : (
        <AgentList agents={agents} loading={loading} onCreate={() => setBuilderOpen(true)} />
      )}

      {builderOpen && workspace && (
        <AgentBuilder
          workspace={workspace}
          userId={userId}
          initialBusinessName={profileName ?? ''}
          onClose={() => setBuilderOpen(false)}
          onCreated={async () => { setBuilderOpen(false); setTab('agents'); await refresh(); }}
        />
      )}
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${active ? 'bg-brand text-brand-ink' : 'border border-ink/10 bg-panel text-ink/55 hover:text-ink'}`}>{children}</button>;
}

function AgentList({ agents, loading, onCreate }: { agents: AgentRecord[]; loading: boolean; onCreate: () => void }) {
  if (loading) return <div className="grid min-h-64 place-items-center rounded-[28px] border border-ink/10 bg-panel"><Loader2 className="animate-spin text-violet-500" aria-label="Cargando agentes" /></div>;
  if (!agents.length) return (
    <div className="rounded-[28px] border border-dashed border-ink/15 bg-panel px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-500"><Bot size={24} /></span>
      <h2 className="mt-5 font-display text-2xl font-bold">Tu primer agente empieza aquí</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/50">Primero lo guardaremos como borrador. Solo podrá activarse después de aprobar calidad y conectar un canal.</p>
      <button type="button" onClick={onCreate} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink"><Plus size={18} /> Crear agente</button>
    </div>
  );
  return <div className="space-y-3">{agents.map(agent => { const state = statusMeta[agent.status]; return (
    <article key={agent.id} className="flex flex-col gap-5 rounded-2xl border border-ink/10 bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300"><Bot size={21} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-display text-lg font-bold">{agent.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${state.tone}`}>{state.label}</span></div><p className="mt-1 truncate text-sm text-ink/45">{agent.business_name} · {agent.requested_channels.map(channel => channelMeta[channel].label).join(', ')}</p></div></div>
      <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 text-sm font-bold text-ink/65 hover:text-ink">Ver preparación <ChevronRight size={16} /></button>
    </article>
  ); })}</div>;
}

function AgentBuilder({ workspace, userId, initialBusinessName, onClose, onCreated }: { workspace: Workspace; userId: string; initialBusinessName: string; onClose: () => void; onCreated: () => Promise<void> }) {
  const [step, setStep] = useState<BuilderStep>(0);
  const [draft, setDraft] = useState<AgentDraft>({ ...emptyDraft, business_name: initialBusinessName });
  const [pdf, setPdf] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const steps = ['Identidad', 'Contexto', 'Comportamiento', 'Canales', 'Revisar'];
  const canContinue = useMemo(() => step === 0 ? draft.name.trim().length >= 2 && draft.business_name.trim().length >= 2 : step === 1 ? draft.business_description.trim().length >= 20 : true, [step, draft]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  function setField<K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) { setDraft(current => ({ ...current, [key]: value })); }
  function toggleChannel(channel: AgentChannel) {
    const included = draft.requested_channels.includes(channel);
    if (included && draft.requested_channels.length === 1) return;
    if (!included && draft.requested_channels.length >= workspace.maxConnectedChannels) { setError(`Tu plan permite ${workspace.maxConnectedChannels} canal conectado.`); return; }
    setError('');
    setField('requested_channels', included ? draft.requested_channels.filter(item => item !== channel) : [...draft.requested_channels, channel]);
  }

  async function save() {
    setSaving(true); setError('');
    try {
      const agent = await createAgent(workspace.organizationId, userId, draft);
      if (pdf) await uploadContextPdf(workspace.organizationId, agent.id, userId, pdf);
      await onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar el agente.');
    } finally { setSaving(false); }
  }

  return (
    <div className="agent-dialog-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="builder-title">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-canvas shadow-2xl">
          <header className="border-b border-ink/10 bg-panel px-5 py-4 sm:px-7">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-700 dark:text-teal-300">Nuevo agente</p><h2 id="builder-title" className="mt-1 font-display text-xl font-extrabold">{steps[step]}</h2></div><button autoFocus type="button" onClick={onClose} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-xl text-ink/45 hover:bg-ink/5 hover:text-ink"><X size={20} /></button></div>
            <div className="mt-4 grid grid-cols-5 gap-2" aria-label={`Paso ${step + 1} de 5`}>{steps.map((label, index) => <div key={label} className="min-w-0"><div className={`h-1 rounded-full ${index <= step ? 'bg-violet-500' : 'bg-ink/10'}`} /><span className="mt-2 hidden truncate text-xs text-ink/45 sm:block">{label}</span></div>)}</div>
          </header>

          <div className="min-h-[430px] p-5 sm:p-8">
            {step === 0 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={Bot} title="Dale una identidad clara" text="Este nombre identifica al agente dentro de Stage. El nombre de la empresa se usa al responder a tus clientes." /><Field label="Nombre del agente" required value={draft.name} onChange={value => setField('name', value)} placeholder="Ej. Atlas Atención" /><Field label="Nombre de la empresa" required value={draft.business_name} onChange={value => setField('business_name', value)} placeholder="Stage AI Labs" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Sitio web" value={draft.website_url ?? ''} onChange={value => setField('website_url', value)} placeholder="Opcional" type="url" /><Field label="Teléfono" value={draft.phone ?? ''} onChange={value => setField('phone', value)} placeholder="Opcional" type="tel" /></div></div>}
            {step === 1 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={FileText} title="Enséñale lo que sí sabe" text="La descripción es obligatoria. El PDF es opcional, privado y se procesa antes de permitir la activación." /><TextArea label="¿Qué hace tu empresa?" required value={draft.business_description} onChange={value => setField('business_description', value)} placeholder="Describe servicios, clientes, horarios y cómo ayudas..." /><TextArea label="Catálogo o servicios clave" value={draft.catalog_summary ?? ''} onChange={value => setField('catalog_summary', value)} placeholder="Productos, servicios, precios o condiciones importantes" /><TextArea label="Datos que nunca debe olvidar" value={draft.important_facts ?? ''} onChange={value => setField('important_facts', value)} placeholder="Horarios, cobertura, políticas de entrega o contacto humano" /><label className="block rounded-2xl border border-dashed border-ink/20 bg-panel p-5"><span className="flex items-center gap-2 text-sm font-bold"><Upload size={17} /> PDF de contexto <span className="font-normal text-ink/40">(opcional, máximo 20 MB)</span></span><input type="file" accept="application/pdf,.pdf" onChange={event => setPdf(event.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm text-ink/50 file:mr-3 file:rounded-lg file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:font-semibold file:text-ink" />{pdf && <span className="mt-2 block text-xs text-emerald-600">{pdf.name}</span>}</label></div>}
            {step === 2 && <div className="mx-auto max-w-2xl space-y-5"><Intro icon={Sparkles} title="Define cómo debe atender" text="Tus instrucciones personalizan la operación. Las reglas de privacidad, veracidad y aislamiento siempre tienen prioridad." /><Select label="Objetivo principal" value={draft.goal} onChange={value => setField('goal', value)} options={[['customer_service','Servicio al cliente'],['sales_and_service','Ventas y servicio'],['lead_qualification','Calificación de prospectos']]} /><Select label="Estilo de conversación" value={draft.tone} onChange={value => setField('tone', value)} options={[['clear_and_warm','Claro y cercano'],['professional','Profesional'],['concise','Breve y directo'],['friendly','Amigable']]} /><TextArea label="Instrucciones operativas" value={draft.operating_instructions ?? ''} onChange={value => setField('operating_instructions', value)} placeholder="Ej. Primero comprende la necesidad; después recomienda solo opciones disponibles." /><TextArea label="Cuándo escalar a una persona" value={draft.handoff_instructions ?? ''} onChange={value => setField('handoff_instructions', value)} placeholder="Ej. Reclamos de pago, cancelaciones o cuando el cliente lo solicite." /><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-6 text-ink/60"><span className="font-bold text-ink">Protección fija:</span> responde en el idioma del cliente, no revela datos de otros negocios, no inventa y pide ayuda cuando falta información.</div></div>}
            {step === 3 && <div className="mx-auto max-w-3xl"><Intro icon={Globe2} title="Elige dónde atenderá" text={`Tu plan ${workspace.planCode} permite ${workspace.maxConnectedChannels} canal conectado. Aquí eliges la intención; las credenciales se autorizan en el paso seguro de conexión.`} /><div className="mt-6 grid gap-3 sm:grid-cols-2">{(Object.keys(channelMeta) as AgentChannel[]).map(channel => { const meta = channelMeta[channel]; const Icon = meta.icon; const allowed = workspace.allowedChannels.includes(channel); const selected = draft.requested_channels.includes(channel); return <button key={channel} type="button" disabled={!allowed} onClick={() => toggleChannel(channel)} className={`flex min-h-[82px] items-center gap-4 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${selected ? 'border-violet-500 bg-violet-500/8' : 'border-ink/10 bg-panel hover:border-ink/25'}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink/5"><Icon size={20} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{meta.label}</strong><span className="mt-1 block text-xs text-ink/45">{allowed ? meta.note : 'Requiere otro plan'}</span></span>{selected && <CheckCircle2 size={18} className="text-violet-500" />}</button>; })}</div></div>}
            {step === 4 && <div className="mx-auto max-w-2xl"><Intro icon={ShieldCheck} title="Revisa antes de guardar" text="Se creará un borrador real. Stage procesará el contexto y ejecutará las pruebas antes de habilitar la conexión y la activación explícita." /><dl className="mt-7 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-panel px-5"><ReviewRow label="Agente" value={draft.name} /><ReviewRow label="Empresa" value={draft.business_name} /><ReviewRow label="Idiomas" value="Automático, responde en el idioma del cliente" /><ReviewRow label="Contexto" value={pdf ? `Descripción + ${pdf.name}` : 'Descripción y datos ingresados'} /><ReviewRow label="Canales solicitados" value={draft.requested_channels.map(channel => channelMeta[channel].label).join(', ')} /><ReviewRow label="Activación" value="Explícita, después de conexión y calidad" /></dl></div>}
            {error && <p role="alert" className="mx-auto mt-5 max-w-2xl rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">{error}</p>}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-ink/10 bg-panel px-5 py-4 sm:px-7"><button type="button" onClick={() => step === 0 ? onClose() : setStep((step - 1) as BuilderStep)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink/55 hover:bg-ink/5 hover:text-ink"><ArrowLeft size={17} /> {step === 0 ? 'Cancelar' : 'Atrás'}</button>{step < 4 ? <button type="button" disabled={!canContinue} onClick={() => setStep((step + 1) as BuilderStep)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink disabled:cursor-not-allowed disabled:opacity-40">Continuar <ArrowRight size={17} /></button> : <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Guardar borrador</button>}</footer>
        </div>
      </div>
    </div>
  );
}

function Intro({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) { return <div><span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300"><Icon size={21} /></span><h3 className="mt-5 font-display text-2xl font-extrabold tracking-[-.03em]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-ink/50">{text}</p></div>; }
function Field({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) { return <label className="block text-sm font-bold text-ink/70">{label}{required && <span className="ml-1 text-violet-500">*</span>}<input type={type} required={required} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-panel px-4 font-normal text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15" /></label>; }
function TextArea({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) { return <label className="block text-sm font-bold text-ink/70">{label}{required && <span className="ml-1 text-violet-500">*</span>}<textarea required={required} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={3} className="mt-2 w-full resize-y rounded-xl border border-ink/10 bg-panel px-4 py-3 font-normal leading-6 text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15" /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="block text-sm font-bold text-ink/70">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-panel px-4 font-normal text-ink outline-none focus:border-violet-500">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr]"><dt className="text-sm font-semibold text-ink/40">{label}</dt><dd className="text-sm font-semibold text-ink/75">{value}</dd></div>; }
