import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, Check, CircleHelp,
  Clock3, Globe, Instagram, LayoutGrid, Link2, Search,
  Sparkles, Store, Target, Users, Zap,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { DashboardTopBar } from './components/DashboardTopBar';
import { SettingsScreen } from './components/SettingsScreen';
import { UpgradeModal } from './components/UpgradeModal';
import { ChannelsModal } from './components/ChannelsModal';
import { BottomNavBar } from './components/BottomNavBar';
import { AnimatedEmptyState } from './components/AnimatedEmptyState';
import { MobileAuthView } from './components/MobileAuthView';
import { DesktopLanding } from './components/DesktopLanding';
import { InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon, TelegramIcon, GmailIcon } from './components/BrandIcons';
import { STAGE_PLANS, type StagePlan } from './lib/product-data';
import { AgentWorkspace } from './features/agents/AgentWorkspace';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardOverview } from './components/DashboardOverview';

type Screen = 'landing' | 'auth' | 'channel' | 'questions' | 'dashboard';
type DashboardTab = 'Inicio' | 'Bandeja' | 'Contactos' | 'Automatizaciones' | 'Configuración';
type ThemePref = 'light' | 'dark' | 'system';
type PlanId = StagePlan['id'];
type Profile = {
  id: string;
  display_name: string | null;
  channel: string | null;
  account_type: string | null;
  goals: string[];
  discovery_source: string | null;
  onboarding_complete: boolean;
  theme_preference: ThemePref;
};

const previewMode = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('preview')
  : null;

const previewProfile: Profile = {
  id: 'demo-desktop-preview',
  display_name: 'Stage AI Labs',
  channel: 'Instagram',
  account_type: 'empresa',
  goals: ['digital', 'fisico'],
  discovery_source: 'ia',
  onboarding_complete: true,
  theme_preference: 'light',
};

type Option = { label: string; value: string; icon: ReactNode };

const channels = [
  { name: 'Instagram', detail: 'Automatiza comentarios, DMs y respuestas a historias', icon: <InstagramIcon />, tone: 'from-pink-500 to-orange-400' },
  { name: 'WhatsApp', detail: 'Conecta con tus clientes en su app favorita', icon: <WhatsAppIcon />, tone: 'from-green-500 to-emerald-400' },
  { name: 'Facebook', detail: 'Construye conversaciones que convierten en Messenger', icon: <FacebookIcon />, tone: 'from-blue-500 to-cyan-400' },
  { name: 'Telegram', detail: 'Respuestas automáticas para tu comunidad y grupos', icon: <TelegramIcon />, tone: 'from-sky-400 to-blue-500' },
  { name: 'Email', detail: 'Responde correos y consultas automáticamente', icon: <GmailIcon />, tone: 'from-red-500 to-rose-400' },
  { name: 'TikTok', detail: 'Convierte tus visualizaciones en una comunidad activa', icon: <TikTokIcon />, tone: 'from-slate-700 to-slate-900 text-white' },
];

const accountOptions: Option[] = [
  { label: 'Para mi empresa', value: 'empresa', icon: <Store size={23} /> },
  { label: 'Para mí', value: 'personal', icon: <Users size={23} /> },
  { label: 'Para un cliente', value: 'cliente', icon: <Target size={23} /> },
];

const goalOptions: Option[] = [
  { label: 'Productos o servicios digitales', value: 'digital', icon: <Zap size={22} /> },
  { label: 'Marketing de afiliados', value: 'afiliados', icon: <Link2 size={22} /> },
  { label: 'Colaboraciones y patrocinios', value: 'marcas', icon: <Sparkles size={22} /> },
  { label: 'Monetización del canal', value: 'canal', icon: <BarChart3 size={22} /> },
  { label: 'Productos o servicios físicos', value: 'fisico', icon: <Store size={22} /> },
  { label: 'Todavía no monetizo mi cuenta', value: 'ninguno', icon: <CircleHelp size={22} /> },
];

const sourceOptions: Option[] = [
  { label: 'Una agencia', value: 'agencia', icon: <Store size={22} /> },
  { label: 'Un anuncio online', value: 'anuncio', icon: <LayoutGrid size={22} /> },
  { label: 'Un evento de creadores', value: 'evento', icon: <Clock3 size={22} /> },
  { label: 'Instagram o YouTube', value: 'social', icon: <Instagram size={22} /> },
  { label: 'Una búsqueda con IA', value: 'ia', icon: <Sparkles size={22} /> },
  { label: 'Un creador que sigo', value: 'creador', icon: <Users size={22} /> },
  { label: 'Un buscador', value: 'buscador', icon: <Search size={22} /> },
  { label: 'Un amigo', value: 'amigo', icon: <Users size={22} /> },
];

/* ── Theme hook ────────────────────────────────────────────── */

function useTheme(profile: Profile | null) {
  const [themePref, setThemePref] = useState<ThemePref>(profile?.theme_preference ?? 'system');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function apply() {
      const isDark = themePref === 'dark' || (themePref === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', isDark);
    }
    apply();
    if (themePref === 'system') mq.addEventListener('change', apply);
    return () => { mq.removeEventListener('change', apply); };
  }, [themePref]);

  async function updateTheme(pref: ThemePref) {
    setThemePref(pref);
    localStorage.setItem('theme', pref);
    if (profile && !profile.id.startsWith('user-') && !profile.id.startsWith('demo-')) {
      await supabase.from('onboarding_profiles').upsert({ id: profile.id, theme_preference: pref });
    }
  }

  return { themePref, updateTheme };
}

/* ── Shared UI ──────────────────────────────────────────────── */

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white p-1"><img src="/stage-logo.png" alt="" className="h-full w-full object-contain" /></span>
      <div className="flex items-center gap-1.5">
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">
          Stage AI Labs
        </span>
        {!compact && (
          <span className="rounded-md border border-zinc-300/80 bg-zinc-100/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            LLC
          </span>
        )}
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button', className = '' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  const styles = variant === 'primary'
    ? 'bg-[#126769] text-white hover:bg-[#0d5052] dark:bg-teal-600 dark:hover:bg-teal-500 shadow-md shadow-[#126769]/20'
    : variant === 'secondary'
    ? 'border border-ink/15 bg-ink/5 text-ink hover:bg-ink/10'
    : 'text-ink/60 hover:bg-ink/5 hover:text-ink';
  return <button type={type} disabled={disabled} onClick={onClick} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-[background-color,color,transform] duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}>{children}</button>;
}

/* ── Onboarding ─────────────────────────────────────────────── */

function Progress({ step }: { step: number }) {
  return <div className="mb-9 flex items-center gap-2" aria-label={`Paso ${step} de 4`}>{[1, 2, 3, 4].map(item => <div key={item} className={`h-1 flex-1 rounded-full transition-colors duration-150 ${item <= step ? 'bg-teal-500' : 'bg-ink/10'}`} />)}</div>;
}

function ChoiceCard({ option, selected, onClick, multi = false }: { option: Option; selected: boolean; onClick: () => void; multi?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`group flex min-h-[76px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${selected ? 'border-teal-500 bg-teal-500/10' : 'border-ink/10 bg-panel hover:border-ink/25'}`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${selected ? 'bg-teal-500 text-white' : 'bg-ink/5 text-ink/60 group-hover:text-ink'}`}>{option.icon}</span>
      <span className={`flex-1 text-sm font-semibold ${selected ? 'text-ink' : 'text-ink/70'}`}>{option.label}</span>
      <span className={`grid h-5 w-5 place-items-center rounded-md border transition ${selected ? 'border-teal-500 bg-teal-500 text-white' : 'border-ink/20'} ${!multi && selected ? 'rounded-full' : ''}`}>{selected && <Check size={13} strokeWidth={3} />}</span>
    </button>
  );
}

function SetupShell({ children, onBack, eyebrow, lang, setLang }: { children: ReactNode; onBack: () => void; eyebrow: string; lang: 'ES' | 'EN' | 'PT'; setLang: (l: 'ES' | 'EN' | 'PT') => void }) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  return (
    <div className="min-h-screen bg-canvas px-4 py-4 text-ink sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-xl border border-ink/10 text-ink/60 transition-colors duration-150 hover:border-ink/25 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"><ArrowLeft size={19} /></button>
          <Logo />
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-[.16em] text-ink/35">{eyebrow}</span>
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex min-h-11 items-center gap-1.5 rounded-xl border border-ink/10 bg-panel px-3 text-xs font-bold text-ink hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
              >
                <Globe size={14} className="text-teal-600" />
                {lang}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full z-20 mt-2 w-36 rounded-xl bg-panel p-1.5 shadow-xl">
                  {(['ES', 'EN', 'PT'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setShowLangMenu(false); }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${lang === l ? 'bg-teal-500/10 text-teal-600' : 'text-ink/70 hover:bg-ink/5'}`}
                    >
                      {l === 'ES' ? 'Español' : l === 'EN' ? 'English' : 'Português'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-8 lg:mt-14 lg:grid-cols-[280px_minmax(0,720px)] lg:justify-center lg:gap-16 xl:gap-24">
          <aside className="hidden lg:block">
            <div className="sticky top-12">
              <h2 className="font-display text-2xl font-extrabold tracking-[-.025em]">Configura tu espacio</h2>
              <p className="mt-3 text-sm leading-6 text-ink/55">Cuatro decisiones breves para adaptar Stage a tu forma de atender.</p>
              <ul className="mt-8 space-y-5 text-sm text-ink/55">
                <li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-teal-600" />Tus respuestas se guardan en tu cuenta.</li>
                <li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-teal-600" />Elegir un canal no lo conecta todavía.</li>
                <li className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-teal-600" />Podrás cambiar esta información después.</li>
              </ul>
            </div>
          </aside>
          <main className="min-w-0 rounded-2xl bg-panel p-5 shadow-[0_24px_70px_-56px_rgba(15,23,42,.65)] sm:p-8 lg:p-10">
            <div className="mb-5 text-xs font-bold uppercase tracking-[.14em] text-ink/40 lg:hidden">{eyebrow}</div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

const setupTranslations = {
  ES: {
    channelTitle: '¿Dónde quieres empezar?',
    channelDesc: 'Elige por dónde empezar. Después podrás seleccionar hasta 3 canales desde Canales, en tu espacio de trabajo.',
    connect: 'Elegir',
    connected: 'Elegido',
    continue: 'Continuar',
    qTitle1: '¿Para quién es este espacio?',
    qDesc1: 'Así podremos recomendarte automatizaciones más útiles.',
    qTitle2: '¿Cómo generas ingresos normalmente?',
    qDesc2: 'Te mostraremos ideas que encajen con tu forma de crecer.',
    qTitle3: '¿Cómo nos encontraste?',
    qDesc3: 'Nos ayuda a aparecer en los lugares correctos.',
    qName: '¿Cómo te llamamos?',
    qNamePlaceholder: 'Tu nombre o marca',
    step: 'Paso',
    of: 'de',
    save: 'Guardando...',
    next: 'Siguiente',
    dashboard: 'Entrar a mi dashboard',
    error: 'No pudimos guardar tus respuestas. Inténtalo de nuevo.',
    title: 'Hagamos que sea tuyo.'
  },
  EN: {
    channelTitle: 'Where would you like to start?',
    channelDesc: 'Choose where to start. Later, you can select up to 3 channels from Channels in your workspace.',
    connect: 'Choose',
    connected: 'Selected',
    continue: 'Continue',
    qTitle1: 'Who is this space for?',
    qDesc1: 'So we can recommend the most useful automations.',
    qTitle2: 'How do you usually generate income?',
    qDesc2: 'We will show you ideas that fit your growth model.',
    qTitle3: 'How did you find us?',
    qDesc3: 'It helps us appear in the right places.',
    qName: 'What should we call you?',
    qNamePlaceholder: 'Your name or brand',
    step: 'Step',
    of: 'of',
    save: 'Saving...',
    next: 'Next',
    dashboard: 'Enter my dashboard',
    error: 'We couldn’t save your answers. Please try again.',
    title: 'Let’s make it yours.'
  },
  PT: {
    channelTitle: 'Onde você quer começar?',
    channelDesc: 'Escolha por onde começar. Depois, você poderá selecionar até 3 canais em Canais, no seu espaço de trabalho.',
    connect: 'Escolher',
    connected: 'Escolhido',
    continue: 'Continuar',
    qTitle1: 'Para quem é este espaço?',
    qDesc1: 'Assim podemos recomendar as automações mais úteis.',
    qTitle2: 'Como você geralmente gera renda?',
    qDesc2: 'Mostraremos ideias que se encaixam no seu modelo de crescimento.',
    qTitle3: 'Como você nos encontrou?',
    qDesc3: 'Isso nos ajuda a aparecer nos lugares certos.',
    qName: 'Como devemos chamar você?',
    qNamePlaceholder: 'Seu nome ou marca',
    step: 'Passo',
    of: 'de',
    save: 'Salvando...',
    next: 'Próximo',
    dashboard: 'Entrar no meu dashboard',
    error: 'Não conseguimos salvar suas respostas. Tente novamente.',
    title: 'Vamos deixar com a sua cara.'
  }
};

function Channel({ onNext, onBack, selected, setSelected, lang, setLang }: { onNext: () => Promise<void>; onBack: () => void; selected: string; setSelected: (channel: string) => void; lang: 'ES' | 'EN' | 'PT'; setLang: (l: 'ES' | 'EN' | 'PT') => void }) {
  const t = setupTranslations[lang];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function continueSetup() {
    if (!selected || saving) return;
    setSaving(true);
    setError('');
    try {
      await onNext();
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SetupShell onBack={onBack} eyebrow={`${t.step} 1 ${t.of} 4`} lang={lang} setLang={setLang}>
      <Progress step={1} />
      <div className="mb-8 max-w-xl">
        <h1 className="text-balance font-display text-3xl font-extrabold tracking-[-.03em] text-ink sm:text-4xl">{t.channelTitle}</h1>
        <p className="mt-3 text-base leading-7 text-ink/55">{t.channelDesc}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {channels.map(channel => (
          <button key={channel.name} type="button" aria-pressed={selected === channel.name} onClick={() => setSelected(channel.name)} className={`flex min-h-[126px] flex-col items-start rounded-2xl border p-4 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${selected === channel.name ? 'border-teal-500 bg-teal-500/5' : 'border-ink/10 bg-canvas/55 hover:border-ink/25'}`}>
            <span className="flex w-full items-start justify-between gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${channel.tone}`}>{channel.icon}</span>
              <span className={`text-xs font-bold ${selected === channel.name ? 'text-teal-700 dark:text-teal-300' : 'text-ink/42'}`}>{selected === channel.name ? t.connected : t.connect}</span>
            </span>
            <span className="mt-4 block font-display text-base font-bold text-ink">{channel.name}</span>
            <span className="mt-1 block text-xs leading-5 text-ink/48">{channel.detail}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <div className="mt-8 flex justify-end"><Button disabled={!selected || saving} onClick={() => void continueSetup()}>{saving ? t.save : t.continue} <ArrowRight size={17} /></Button></div>
    </SetupShell>
  );
}

function Questions({ profile, setProfile, onFinish, onBack, lang, setLang }: { profile: Profile; setProfile: (profile: Profile) => void; onFinish: () => void; onBack: () => void; lang: 'ES' | 'EN' | 'PT'; setLang: (l: 'ES' | 'EN' | 'PT') => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(profile.display_name ?? '');
  const [account, setAccount] = useState(profile.account_type ?? '');
  const [goals, setGoals] = useState<string[]>(profile.goals ?? []);
  const [source, setSource] = useState(profile.discovery_source ?? '');
  
  const t = setupTranslations[lang];
  const options = step === 1 ? accountOptions : step === 2 ? goalOptions : sourceOptions;
  const title = step === 1 ? t.qTitle1 : step === 2 ? t.qTitle2 : t.qTitle3;
  const subtitle = step === 1 ? t.qDesc1 : step === 2 ? t.qDesc2 : t.qDesc3;
  const selected = step === 1 ? account : step === 2 ? goals : source;
  const canContinue = step === 1
    ? account.length > 0 && name.trim().length >= 2
    : step === 2
      ? goals.length > 0
      : source.length > 0;

  function toggle(value: string) {
    if (step === 1) setAccount(value);
    else if (step === 3) setSource(value);
    else setGoals(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }

  async function next() {
    if (!canContinue || saving) return;
    setSaving(true);
    setError('');
    const isFinalStep = step === 3;
    const payload = {
      id: profile.id,
      display_name: name.trim(),
      account_type: account || null,
      goals,
      discovery_source: source || null,
      channel: profile.channel,
      onboarding_complete: isFinalStep,
      updated_at: new Date().toISOString(),
    };
    
    const { error: saveError } = await supabase.from('onboarding_profiles').upsert(payload);
    setSaving(false);
    if (saveError) {
      setError('No pudimos guardar tu configuración. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    setProfile({ ...profile, ...payload });
    if (isFinalStep) onFinish();
    else setStep(step + 1);
  }

  return (
    <SetupShell onBack={step === 1 ? onBack : () => setStep(step - 1)} eyebrow={`${t.step} ${step + 1} ${t.of} 4`} lang={lang} setLang={setLang}>
      <Progress step={step + 1} />
      <div className="mb-8">
        <h1 className="text-balance font-display text-3xl font-extrabold tracking-[-.03em] text-ink sm:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-lg text-base leading-7 text-ink/55">{subtitle}</p>
      </div>
      {step === 1 && (
        <label className="mb-7 block">
          <span className="mb-2 block text-sm text-ink/60">{t.qName}</span>
          <input value={name} onChange={e => setName(e.target.value)} className="min-h-12 w-full rounded-xl border border-ink/10 bg-canvas/55 px-4 text-ink outline-none transition-colors duration-150 placeholder:text-ink/30 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" placeholder={t.qNamePlaceholder} />
        </label>
      )}
      <h2 className="mb-4 font-display text-xl font-bold text-ink">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(option => <ChoiceCard key={option.value} option={option} selected={Array.isArray(selected) ? selected.includes(option.value) : selected === option.value} onClick={() => toggle(option.value)} multi={step === 2} />)}
      </div>
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
      <div className="mt-8 flex justify-end">
        <Button disabled={!canContinue || saving} onClick={() => void next()}>{saving ? t.save : step === 3 ? t.dashboard : t.next} <ArrowRight size={17} /></Button>
      </div>
    </SetupShell>
  );
}

/* ── Dashboard ─────────────────────────────────────────────── */

function Dashboard({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const requestedPlan = new URLSearchParams(window.location.search).get('checkout');
  const hasCheckoutRequest = STAGE_PLANS.some((plan) => plan.id === requestedPlan);
  const initialCheckoutPlan: PlanId = hasCheckoutRequest
    ? requestedPlan as PlanId
    : 'pulse';
  const [tab, setTab] = useState<DashboardTab>('Inicio');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('stage-sidebar-collapsed') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(hasCheckoutRequest);
  const [checkoutPlan] = useState<PlanId>(initialCheckoutPlan);
  const [showChannels, setShowChannels] = useState(false);
  const [createAgentRequest, setCreateAgentRequest] = useState(0);
  const { themePref, updateTheme } = useTheme(profile);

  const activeTab: DashboardTab = showSettings ? 'Configuración' : tab;
  const pageTitle = showSettings
    ? 'Configuración'
    : tab === 'Automatizaciones'
      ? 'Agentes'
      : tab;

  function openAgentBuilder() {
    setShowSettings(false);
    setTab('Automatizaciones');
    setCreateAgentRequest((request) => request + 1);
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('stage-sidebar-collapsed', String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <a href="#dashboard-main" className="sr-only z-[70] rounded-lg bg-panel px-4 py-3 font-bold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Ir al contenido
      </a>
      <DashboardSidebar
        currentTab={activeTab}
        profile={profile}
        onSelectTab={(nextTab) => { setShowSettings(false); setTab(nextTab); }}
        onOpenChannels={() => setShowChannels(true)}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
      />

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <DashboardTopBar profile={profile} onOpenSettings={() => setShowSettings(true)} />

        <header className="hidden h-20 items-center justify-between border-b border-ink/8 bg-panel/70 px-8 lg:flex xl:px-10">
          <div>
            <p className="text-xs font-semibold text-ink/42">Espacio de trabajo</p>
            <h1 className="mt-1 font-display text-xl font-extrabold tracking-[-.02em]">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-ink/5 px-3 text-xs font-semibold text-ink/55">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Configuración pendiente
            </span>
            <button
              type="button"
              onClick={() => setShowChannels(true)}
              className="inline-flex min-h-10 items-center rounded-xl border border-ink/10 bg-panel px-4 text-sm font-bold text-ink/70 transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              Canales
            </button>
          </div>
        </header>

        <main id="dashboard-main" className={`mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10 ${showSettings ? 'max-w-6xl' : 'max-w-[1500px]'}`}>
          {showSettings ? (
            <SettingsScreen
              profile={profile}
              themePref={themePref}
              updateTheme={updateTheme}
              onLogout={onLogout}
              onBack={() => setShowSettings(false)}
              onOpenUpgrade={() => setShowUpgrade(true)}
            />
          ) : (
            <>
              {tab === 'Inicio' && (
                <DashboardOverview
                  profile={profile}
                  onCreateAgent={openAgentBuilder}
                  onOpenChannels={() => setShowChannels(true)}
                  onOpenInbox={() => setTab('Bandeja')}
                />
              )}
              {tab === 'Bandeja' && (
                <AnimatedEmptyState type="inbox" onAction={() => setShowChannels(true)} />
              )}
              {tab === 'Contactos' && (
                <AnimatedEmptyState type="contacts" onAction={() => setShowChannels(true)} />
              )}
              {tab === 'Automatizaciones' && (
                <AgentWorkspace
                  key={`agents-${createAgentRequest}`}
                  userId={profile.id}
                  profileName={profile.display_name}
                  createRequest={createAgentRequest}
                  preview={Boolean(previewMode)}
                />
              )}
            </>
          )}
        </main>

        <BottomNavBar currentTab={tab} onSelectTab={(nextTab) => { setShowSettings(false); setTab(nextTab); }} />
      </div>

      {/* Global Modals */}
      <UpgradeModal key={showUpgrade ? `open-${checkoutPlan}` : 'closed'} isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} initialPlan={checkoutPlan} />
      <ChannelsModal isOpen={showChannels} onClose={() => setShowChannels(false)} />
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────── */

function App() {
  const [lang, setLang] = useState<"ES" | "EN" | "PT">("ES");
  const [screen, setScreen] = useState<Screen>(previewMode === 'dashboard' ? 'dashboard' : previewMode === 'onboarding' ? 'channel' : previewMode === 'questions' ? 'questions' : 'landing');
  const [profile, setProfile] = useState<Profile | null>(previewMode ? previewProfile : null);
  const [channel, setChannel] = useState(previewMode ? 'Instagram' : '');
  const [loading, setLoading] = useState(previewMode ? false : isSupabaseConfigured);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (previewMode || !isSupabaseConfigured) return;
    let mounted = true;
    let bootTimedOut = false;
    let bootFinished = false;
    let hydrationVersion = 0;
    const bootTimer = window.setTimeout(() => {
      if (!mounted || bootFinished) return;
      bootTimedOut = true;
      hydrationVersion += 1;
      setAuthError('La verificación de tu sesión tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.');
      setLoading(false);
    }, 15000);
    const finishLoading = () => {
      bootFinished = true;
      window.clearTimeout(bootTimer);
      setLoading(false);
    };
    const defaultProfile = (id: string): Profile => ({ id, display_name: null, channel: null, account_type: null, goals: [], discovery_source: null, onboarding_complete: false, theme_preference: 'system' });

    const hydrateSession = async (session: Session | null) => {
      if (!mounted || bootTimedOut) return;
      const version = ++hydrationVersion;
      setAuthError('');
      if (!session?.user) {
        setProfile(null);
        setScreen('landing');
        finishLoading();
        return;
      }

      const { data: current, error: profileError } = await supabase
        .from('onboarding_profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!mounted || bootTimedOut || version !== hydrationVersion) return;
      if (profileError) {
        setAuthError('Tu sesión está activa, pero no pudimos cargar tu espacio. Revisa tu conexión y vuelve a intentarlo.');
        finishLoading();
        return;
      }
      if (!current) {
        const profile = defaultProfile(session.user.id);
        const { error: createError } = await supabase.from('onboarding_profiles').upsert({ id: profile.id, goals: [], onboarding_complete: false, theme_preference: 'system' });
        if (!mounted || bootTimedOut || version !== hydrationVersion) return;
        if (createError) {
          setAuthError('Tu cuenta fue creada, pero no pudimos preparar tu espacio. Inténtalo nuevamente.');
          finishLoading();
          return;
        }
        setProfile(profile);
        setChannel('');
        setScreen('channel');
      } else {
        const profile = current as Profile;
        setProfile(profile);
        setChannel(profile.channel ?? '');
        setScreen(profile.onboarding_complete ? 'dashboard' : 'channel');
      }
      finishLoading();
    };

    const startHydration = (session: Session | null) => {
      void hydrateSession(session).catch(() => {
        if (!mounted || bootTimedOut) return;
        setAuthError('No pudimos cargar tu espacio. Comprueba tu conexión y vuelve a intentarlo.');
        finishLoading();
      });
    };
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted || bootTimedOut || bootFinished) return;
      if (sessionError) {
        setAuthError('No pudimos verificar tu sesión. Revisa tu conexión y vuelve a intentarlo.');
        finishLoading();
        return;
      }
      startHydration(data.session);
    }).catch(() => {
      if (!mounted || bootTimedOut || bootFinished) return;
      setAuthError('No pudimos verificar tu sesión. Comprueba tu conexión y vuelve a intentarlo.');
      finishLoading();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      startHydration(session);
    });
    return () => { mounted = false; window.clearTimeout(bootTimer); listener.subscription.unsubscribe(); };
  }, []);

  async function handleAuthSuccess(nextProfile: Profile | null) {
    if (nextProfile?.onboarding_complete) {
      setProfile(nextProfile);
      setChannel(nextProfile.channel ?? '');
      setScreen('dashboard');
    } else if (nextProfile) {
      setProfile(nextProfile);
      setChannel(nextProfile.channel ?? '');
      setScreen('channel');
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newProfile: Profile = {
          id: user.id,
          display_name: null,
          channel: null,
          account_type: null,
          goals: [],
          discovery_source: null,
          onboarding_complete: false,
          theme_preference: 'system',
        };
        await supabase.from('onboarding_profiles').upsert({ id: user.id, goals: [], onboarding_complete: false, theme_preference: 'system' });
        setProfile(newProfile);
        setScreen('channel');
      }
    }
  }

  if (!isSupabaseConfigured && !previewMode) return (
    <main className="grid min-h-screen place-items-center bg-[#07131f] px-5 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[.04] p-7 shadow-2xl">
        <div className="flex items-center gap-3"><Logo /><span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">Configuración requerida</span></div>
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-[-.03em]">El acceso está temporalmente fuera de servicio.</h1>
        <p className="mt-3 leading-7 text-slate-300">Faltan las variables públicas de Supabase en este despliegue. No se creó ninguna sesión ni dato de demostración.</p>
        <a href="https://stagelaboratories.com/contact" className="mt-7 flex min-h-12 items-center justify-center rounded-xl bg-teal-300 px-5 font-bold text-[#07131f]">Contactar a Stage AI Labs</a>
      </section>
    </main>
  );

  if (loading) return <main role="status" aria-live="polite" className="fixed inset-0 grid place-items-center bg-[#172c43] bg-[radial-gradient(ellipse_at_30%_25%,#416077,transparent_65%)] px-5 text-white"><div className="flex flex-col items-center gap-5"><Logo /><div aria-hidden="true" className="h-8 w-8 rounded-full border-2 border-white/20 border-t-teal-300 motion-safe:animate-spin" /><p className="text-sm font-medium text-white/80">Cargando tu espacio...</p></div></main>;

  if (authError) return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 text-ink">
      <section className="w-full max-w-lg rounded-2xl border border-ink/10 bg-white p-7 shadow-xl dark:bg-zinc-900">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-[-.03em]">No pudimos abrir tu espacio.</h1>
        <p role="alert" className="mt-3 leading-7 text-ink/60">{authError}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-7 min-h-12 rounded-xl bg-[#126769] px-5 font-bold text-white transition hover:bg-[#0d5052] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">Reintentar</button>
      </section>
    </main>
  );

  if (screen === 'landing') {
    return (
      <>
        {/* Mobile View (Phone View matching Image 3, 1 & 4) */}
        <div className="lg:hidden">
          <MobileAuthView onSuccess={handleAuthSuccess} />
        </div>

        {/* Desktop View (matching Image 2 Stage AI Labs website & auth) */}
        <div className="hidden lg:block">
          <DesktopLanding onSuccess={handleAuthSuccess} />
        </div>
      </>
    );
  }

  if (screen === 'auth') {
    return (
      <>
        {/* Mobile View */}
        <div className="lg:hidden">
          <MobileAuthView onSuccess={handleAuthSuccess} />
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <DesktopLanding onSuccess={handleAuthSuccess} />
        </div>
      </>
    );
  }

  if (screen === 'channel' && profile) return <Channel selected={channel} setSelected={setChannel} lang={lang} setLang={setLang} onBack={() => setScreen('landing')} onNext={async () => {
    const updated = { ...profile, channel };
    const { error } = await supabase.from('onboarding_profiles').upsert({ id: profile.id, channel });
    if (error) throw error;
    setProfile(updated);
    setScreen('questions');
  }} />;

  if (screen === 'questions' && profile) return <Questions profile={profile} setProfile={setProfile} lang={lang} setLang={setLang} onBack={() => setScreen('channel')} onFinish={() => setScreen('dashboard')} />;

  if (profile) return <Dashboard profile={profile} onLogout={async () => { await supabase.auth.signOut(); setScreen('landing'); }} />;

  return null;
}

export default App;
