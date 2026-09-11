import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, Bot, Check, ChevronRight, CircleHelp,
  Clock3, Instagram, LayoutGrid, Link2, MessageCircle, Play, Search,
  Sparkles, Store, Target, Users, X, Zap,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { DashboardTopBar } from './components/DashboardTopBar';
import { SettingsScreen } from './components/SettingsScreen';
import { UpgradeModal } from './components/UpgradeModal';
import { ChannelsModal } from './components/ChannelsModal';
import { HomeHeroBanner } from './components/HomeHeroBanner';
import { TemplateCards } from './components/TemplateCards';
import { BottomNavBar } from './components/BottomNavBar';
import { AnimatedEmptyState } from './components/AnimatedEmptyState';
import { MobileAuthView } from './components/MobileAuthView';
import { DesktopLanding } from './components/DesktopLanding';
import { InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon, TelegramIcon, GmailIcon } from './components/BrandIcons';
import { STAGE_PLANS, type StagePlan } from './lib/product-data';

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
      <span className="h-2.5 w-2.5 rounded-full bg-[#0d5c58] shadow-sm dark:bg-teal-400" />
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
    ? 'bg-[#0d5c58] text-white hover:bg-[#094542] dark:bg-teal-600 dark:hover:bg-teal-500 shadow-md shadow-[#0d5c58]/20'
    : variant === 'secondary'
    ? 'border border-ink/15 bg-ink/5 text-ink hover:bg-ink/10'
    : 'text-ink/60 hover:bg-ink/5 hover:text-ink';
  return <button type={type} disabled={disabled} onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}>{children}</button>;
}

/* ── Onboarding ─────────────────────────────────────────────── */

function Progress({ step }: { step: number }) {
  return <div className="mb-10 flex items-center gap-2">{[1, 2, 3].map(item => <div key={item} className={`h-1.5 flex-1 rounded-full transition-all ${item <= step ? 'bg-teal-500' : 'bg-ink/10'}`} />)}</div>;
}

function ChoiceCard({ option, selected, onClick, multi = false }: { option: Option; selected: boolean; onClick: () => void; multi?: boolean }) {
  return (
    <button onClick={onClick} className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${selected ? 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/5' : 'border-ink/10 bg-ink/[.03] hover:border-ink/25 hover:bg-ink/[.06]'}`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${selected ? 'bg-teal-500 text-white' : 'bg-ink/5 text-ink/60 group-hover:text-ink'}`}>{option.icon}</span>
      <span className={`flex-1 text-sm font-semibold ${selected ? 'text-ink' : 'text-ink/70'}`}>{option.label}</span>
      <span className={`grid h-5 w-5 place-items-center rounded-md border transition ${selected ? 'border-teal-500 bg-teal-500 text-white' : 'border-ink/20'} ${!multi && selected ? 'rounded-full' : ''}`}>{selected && <Check size={13} strokeWidth={3} />}</span>
    </button>
  );
}

import { Globe } from 'lucide-react';

function SetupShell({ children, onBack, eyebrow, lang, setLang }: { children: ReactNode; onBack: () => void; eyebrow: string; lang: 'ES' | 'EN' | 'PT'; setLang: (l: 'ES' | 'EN' | 'PT') => void }) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  return (
    <div className="min-h-screen bg-canvas px-6 py-6 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex items-center justify-between">
          <button onClick={onBack} aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 text-ink/60 transition hover:border-ink/25 hover:text-ink"><ArrowLeft size={19} /></button>
          <Logo />
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-[.16em] text-ink/35">{eyebrow}</span>
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-ink/5"
              >
                <Globe size={14} className="text-teal-600" />
                {lang}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 w-32 rounded-xl border border-ink/10 bg-white p-1.5 shadow-xl">
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
        {children}
      </div>
    </div>
  );
}

const setupTranslations = {
  ES: {
    channelTitle: 'Conecta tu primer canal.',
    channelDesc: 'Puedes sumar los demás cuando quieras. Empecemos por donde vive tu comunidad.',
    connect: 'Conectar',
    connected: 'Conectado',
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
    channelTitle: 'Connect your first channel.',
    channelDesc: 'You can add the others later. Let’s start where your community lives.',
    connect: 'Connect',
    connected: 'Connected',
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
    channelTitle: 'Conecte seu primeiro canal.',
    channelDesc: 'Você pode adicionar os outros depois. Vamos começar por onde sua comunidade vive.',
    connect: 'Conectar',
    connected: 'Conectado',
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

function Channel({ onNext, onBack, selected, setSelected, lang, setLang }: { onNext: () => void; onBack: () => void; selected: string; setSelected: (channel: string) => void; lang: 'ES' | 'EN' | 'PT'; setLang: (l: 'ES' | 'EN' | 'PT') => void }) {
  const t = setupTranslations[lang];
  return (
    <SetupShell onBack={onBack} eyebrow={`${t.step} 1 ${t.of} 3`} lang={lang} setLang={setLang}>
      <Progress step={1} />
      <div className="mb-10 max-w-xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t.channelTitle}</h1>
        <p className="mt-4 text-lg leading-7 text-ink/50">{t.channelDesc}</p>
      </div>
      <div className="space-y-3">
        {channels.map(channel => (
          <button key={channel.name} onClick={() => setSelected(channel.name)} className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all ${selected === channel.name ? 'border-teal-500 bg-teal-500/5' : 'border-ink/10 bg-ink/[.03] hover:border-ink/25'}`}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${channel.tone}`}>{channel.icon}</span>
            <span className="flex-1">
              <span className="block font-display text-lg font-bold text-ink">{channel.name}</span>
              <span className="mt-1 block text-sm text-ink/45">{channel.detail}</span>
            </span>
            <span className={`text-sm font-semibold ${selected === channel.name ? 'text-teal-600 dark:text-teal-400' : 'text-ink/50'}`}>{selected === channel.name ? t.connected : t.connect}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-end"><Button disabled={!selected} onClick={onNext}>{t.continue} <ArrowRight size={17} /></Button></div>
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

  function toggle(value: string) {
    if (step === 1) setAccount(value);
    else if (step === 3) setSource(value);
    else setGoals(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }

  async function next() {
    if (!selected || (step === 2 && goals.length === 0)) return;
    if (step < 3) { setStep(step + 1); return; }
    setSaving(true);
    setError('');
    const payload = { id: profile.id, display_name: name || 'Creador', account_type: account, goals, discovery_source: source, channel: profile.channel, onboarding_complete: true, updated_at: new Date().toISOString() };
    
    const { error: saveError } = await supabase.from('onboarding_profiles').upsert(payload);
    setSaving(false);
    if (saveError) {
      setError('No pudimos guardar tu configuración. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    setProfile({ ...profile, ...payload });
    onFinish();
  }

  return (
    <SetupShell onBack={step === 1 ? onBack : () => setStep(step - 1)} eyebrow={`${t.step} ${step + 1} ${t.of} 3`} lang={lang} setLang={setLang}>
      <Progress step={step + 1} />
      <div className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-lg text-lg leading-7 text-ink/50">{subtitle}</p>
      </div>
      {step === 1 && (
        <label className="mb-7 block">
          <span className="mb-2 block text-sm text-ink/60">{t.qName}</span>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-3.5 text-ink outline-none transition placeholder:text-ink/25 focus:border-teal-500" placeholder={t.qNamePlaceholder} />
        </label>
      )}
      <h2 className="mb-4 font-display text-xl font-bold text-ink">{title}</h2>
      <div className="space-y-3">
        {options.map(option => <ChoiceCard key={option.value} option={option} selected={Array.isArray(selected) ? selected.includes(option.value) : selected === option.value} onClick={() => toggle(option.value)} multi={step === 2} />)}
      </div>
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
      <div className="mt-8 flex justify-end">
        <Button disabled={!selected || (step === 2 && goals.length === 0) || saving} onClick={next}>{saving ? t.save : step === 3 ? t.dashboard : t.next} <ArrowRight size={17} /></Button>
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
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(hasCheckoutRequest);
  const [checkoutPlan] = useState<PlanId>(initialCheckoutPlan);
  const [showChannels, setShowChannels] = useState(false);
  const { themePref, updateTheme } = useTheme(profile);

  if (showSettings) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <SettingsScreen
          profile={profile}
          themePref={themePref}
          updateTheme={updateTheme}
          onLogout={onLogout}
          onBack={() => setShowSettings(false)}
          onOpenUpgrade={() => setShowUpgrade(true)}
        />
        <UpgradeModal key={showUpgrade ? `open-${checkoutPlan}` : 'closed'} isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} initialPlan={checkoutPlan} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pb-24 lg:pb-12">
      {/* Header: user name and icon on the top-left, 3 lines menu on the top-right */}
      <DashboardTopBar
        profile={profile}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {tab === 'Inicio' && (
          <div className="space-y-8 animate-rise">
            <HomeHeroBanner onOpenUpgrade={() => setShowUpgrade(true)} />
            <TemplateCards />
          </div>
        )}
        {tab === 'Bandeja' && (
          <AnimatedEmptyState
            type="inbox"
            onAction={() => setShowChannels(true)}
          />
        )}
        {tab === 'Contactos' && (
          <AnimatedEmptyState
            type="contacts"
            onAction={() => setShowUpgrade(true)}
          />
        )}
        {tab === 'Automatizaciones' && <AutomationView />}
      </main>

      {/* Bottom navigation bar: Home, Inbox, Contacts, Automation */}
      <BottomNavBar currentTab={tab} onSelectTab={setTab} />

      {/* Global Modals */}
      <UpgradeModal key={showUpgrade ? `open-${checkoutPlan}` : 'closed'} isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} initialPlan={checkoutPlan} />
      <ChannelsModal isOpen={showChannels} onClose={() => setShowChannels(false)} />
    </div>
  );
}

function AutomationView() {
  const [active, setActive] = useState<string | null>(null);
  const cards = [
    { title: 'Responder comentarios', text: 'Envía un enlace a todas las personas que comenten en tus publicaciones', icon: <MessageCircle size={20} /> },
    { title: 'Nuevos seguidores', text: 'Saluda a tus nuevos seguidores y construye comunidad desde el primer día', icon: <Users size={20} /> },
    { title: 'Respuestas a historias', text: 'Automatiza respuestas cuando alguien reacciona a tus historias', icon: <Zap size={20} /> },
    { title: 'Preguntas frecuentes', text: 'Responde automáticamente a las preguntas que más recibes', icon: <CircleHelp size={20} /> },
  ];
  return (
    <div className="animate-rise">
      <div className="mb-9 flex items-end justify-between">
        <div><p className="mb-2 text-sm text-teal-600 dark:text-teal-400">Biblioteca de ideas</p><h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Automatizaciones</h1></div>
        <button className="grid h-11 w-11 place-items-center rounded-xl border border-ink/10 text-ink/50 hover:text-ink"><Search size={19} /></button>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto">
        <button className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink">Para empezar</button>
        <button className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/50">Mis automatizaciones</button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map(card => (
          <button key={card.title} onClick={() => setActive(card.title)} className="group overflow-hidden rounded-3xl border border-ink/10 bg-ink/[.035] text-left transition hover:-translate-y-1 hover:border-ink/25">
            <div className="h-44 bg-panel p-5">
              <div className="flex items-start justify-between">
                <span className="rounded-lg bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/70">IDEA</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink/10 text-ink/70"><Play size={15} fill="currentColor" /></span>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <div className="rounded-xl bg-ink/10 px-4 py-2 text-sm text-ink/70">¿Precio?</div>
                <ArrowRight className="text-ink/40" size={20} />
                <div className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink">Ver detalles</div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink/60">{card.icon}</span>
                <h2 className="font-display text-lg font-bold text-ink">{card.title}</h2>
              </div>
              <p className="mt-3 leading-6 text-ink/45">{card.text}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-ink/35">
                <span className="flex items-center gap-2"><Instagram size={15} /> Instagram</span>
                <ChevronRight className="transition group-hover:translate-x-1 group-hover:text-ink" size={17} />
              </div>
            </div>
          </button>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-5 backdrop-blur-sm" onClick={() => setActive(null)}>
          <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-panel p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400"><Bot size={22} /></div>
              <button onClick={() => setActive(null)} className="text-ink/40 hover:text-ink"><X size={20} /></button>
            </div>
            <h2 className="mt-7 font-display text-2xl font-extrabold text-ink">{active}</h2>
            <p className="mt-3 leading-6 text-ink/50">Esta idea está lista para convertirse en tu próxima automatización. Personaliza el mensaje y activa el flujo cuando quieras.</p>
            <Button onClick={() => setActive(null)} className="mt-7 w-full">Empezar configuración <ArrowRight size={17} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────── */

function App() {
  const [lang, setLang] = useState<"ES" | "EN" | "PT">("ES");
  const [screen, setScreen] = useState<Screen>('landing');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [channel, setChannel] = useState('');
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setLoading(false);
        return;
      }
      if (data.session?.user) {
        const { data: current } = await supabase.from('onboarding_profiles').select('*').eq('id', data.session.user.id).maybeSingle();
        if (!current) {
          await supabase.from('onboarding_profiles').upsert({ id: data.session.user.id, goals: [], onboarding_complete: false, theme_preference: 'system' });
          setProfile({ id: data.session.user.id, display_name: null, channel: null, account_type: null, goals: [], discovery_source: null, onboarding_complete: false, theme_preference: 'system' });
          setScreen('channel');
        } else {
          setProfile(current as Profile);
          setScreen(current.onboarding_complete ? 'dashboard' : 'channel');
        }
      }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setProfile(null); setScreen('landing'); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function handleAuthSuccess(nextProfile: Profile | null) {
    if (nextProfile?.onboarding_complete) {
      setProfile(nextProfile);
      setScreen('dashboard');
    } else if (nextProfile) {
      setProfile(nextProfile);
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

  if (!isSupabaseConfigured) return (
    <main className="grid min-h-screen place-items-center bg-[#07131f] px-5 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[.04] p-7 shadow-2xl">
        <div className="flex items-center gap-3"><Logo /><span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">Configuración requerida</span></div>
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-[-.03em]">El acceso está temporalmente fuera de servicio.</h1>
        <p className="mt-3 leading-7 text-slate-300">Faltan las variables públicas de Supabase en este despliegue. No se creó ninguna sesión ni dato de demostración.</p>
        <a href="https://stage-labs.ai.studio/contact" className="mt-7 flex min-h-12 items-center justify-center rounded-xl bg-teal-300 px-5 font-bold text-[#07131f]">Contactar a Stage AI Labs</a>
      </section>
    </main>
  );

  if (loading) return <div role="status" aria-label="Cargando tu espacio" className="grid min-h-screen place-items-center bg-canvas"><div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/10 border-t-teal-500" /></div>;

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
    if (!error) {
      setProfile(updated);
      setScreen('questions');
    }
  }} />;

  if (screen === 'questions' && profile) return <Questions profile={profile} setProfile={setProfile} lang={lang} setLang={setLang} onBack={() => setScreen('channel')} onFinish={() => setScreen('dashboard')} />;

  if (profile) return <Dashboard profile={profile} onLogout={async () => { await supabase.auth.signOut(); setScreen('landing'); }} />;

  return null;
}

export default App;
