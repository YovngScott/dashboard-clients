import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, Bell, Bot, Check, ChevronRight, CircleHelp,
  Clock3, Command, Facebook, Home, Inbox, Instagram, LayoutGrid,
  Link2, LogOut, MessageCircle, Monitor, Moon, Play, Plus, Search,
  Settings, Sparkles, Store, Sun, Target, Users, X, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Screen = 'landing' | 'auth' | 'channel' | 'questions' | 'dashboard';
type AuthMode = 'signup' | 'signin';
type DashboardTab = 'Inicio' | 'Bandeja' | 'Contactos' | 'Automatizaciones' | 'Configuración';
type ThemePref = 'light' | 'dark' | 'system';
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
  { name: 'Instagram', detail: 'Automatiza comentarios, DMs y respuestas a historias', icon: <Instagram size={22} />, tone: 'from-pink-500 to-orange-400' },
  { name: 'Facebook', detail: 'Construye conversaciones que convierten en Messenger', icon: <Facebook size={22} />, tone: 'from-blue-500 to-cyan-400' },
  { name: 'TikTok', detail: 'Convierte tus visualizaciones en una comunidad activa', icon: <span className="text-lg font-bold">♪</span>, tone: 'from-slate-500 to-slate-900' },
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

const themeOptions: { label: string; value: ThemePref; icon: ReactNode }[] = [
  { label: 'Claro', value: 'light', icon: <Sun size={18} /> },
  { label: 'Oscuro', value: 'dark', icon: <Moon size={18} /> },
  { label: 'Sistema', value: 'system', icon: <Monitor size={18} /> },
];

/* ── Theme hook ────────────────────────────────────────────── */

function useTheme(profile: Profile | null) {
  const [themePref, setThemePref] = useState<ThemePref>(profile?.theme_preference ?? 'system');

  useEffect(() => {
    if (profile?.theme_preference) setThemePref(profile.theme_preference);
  }, [profile?.theme_preference]);

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
    if (profile) {
      await supabase.from('onboarding_profiles').upsert({ id: profile.id, theme_preference: pref });
    }
  }

  return { themePref, updateTheme };
}

/* ── Shared UI ──────────────────────────────────────────────── */

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-extrabold text-white shadow-lg shadow-teal-600/20">F</div>
      {!compact && <span className="font-display text-xl font-extrabold tracking-tight text-ink">flujo<span className="text-teal-500">.</span></span>}
    </div>
  );
}

function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button', className = '' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  const styles = variant === 'primary'
    ? 'bg-brand text-brand-ink hover:opacity-90'
    : variant === 'secondary'
    ? 'border border-ink/15 bg-ink/5 text-ink hover:bg-ink/10'
    : 'text-ink/60 hover:bg-ink/5 hover:text-ink';
  return <button type={type} disabled={disabled} onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}>{children}</button>;
}

/* ── Landing ────────────────────────────────────────────────── */

function Landing({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="min-h-screen overflow-hidden bg-canvas">
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-ink/60 md:flex"><span>Producto</span><span>Recursos</span><span>Precios</span></div>
        <Button variant="secondary" onClick={onSignIn} className="px-4 py-2 text-sm">Iniciar sesión</Button>
      </header>
      <main className="relative mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-6 pb-16 pt-8 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute -right-32 top-8 h-[520px] w-[520px] rounded-full bg-teal-500/15 blur-[130px]" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[360px] w-[360px] rounded-full bg-teal-600/10 blur-[110px]" />
        <div className="relative grid w-full items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
          <div className="animate-rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300"><Sparkles size={14} /> Tu comunidad, en piloto automático</div>
            <h1 className="font-display max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-.045em] text-ink sm:text-7xl">Haz que cada conversación <span className="bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent dark:from-teal-300 dark:to-teal-500">cuente.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-ink/55">Flujo te ayuda a convertir comentarios, mensajes y seguidores en relaciones que crecen contigo.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={onStart} className="px-6 py-3.5">Crear mi espacio <ArrowRight size={18} /></Button>
              <Button variant="ghost" onClick={onSignIn}>Ya tengo una cuenta <ChevronRight size={16} /></Button>
            </div>
            <div className="mt-10 flex items-center gap-4 text-xs text-ink/40">
              <div className="flex -space-x-2">
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-canvas bg-teal-400 text-xs font-bold text-white">M</span>
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-canvas bg-teal-600 text-xs font-bold text-white">A</span>
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-canvas bg-teal-800 text-xs font-bold text-white">L</span>
              </div>
              <span>Más de 12.000 creadores ya están creciendo</span>
            </div>
          </div>
          <div className="relative animate-rise [animation-delay:120ms]">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-teal-500/20 to-teal-700/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-panel p-3 shadow-2xl shadow-black/10">
              <div className="grid-lines relative overflow-hidden rounded-[1.4rem] bg-panel-2 p-5 sm:p-7">
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-teal-500/20 blur-3xl" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink/60">Vista previa de tu espacio</span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo</span>
                </div>
                <div className="mt-14 max-w-sm">
                  <p className="text-sm text-teal-700 dark:text-teal-300">Hola, comunidad</p>
                  <h2 className="mt-2 font-display text-4xl font-extrabold leading-tight text-ink">Responde menos.<br /><span className="text-teal-600 dark:text-teal-400">Conecta más.</span></h2>
                  <p className="mt-4 text-sm leading-6 text-ink/50">Automatizaciones que suenan a ti, no a un robot.</p>
                </div>
                <div className="mt-16 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-ink/10 bg-canvas/50 p-4">
                    <div className="mb-5 flex items-center justify-between"><span className="text-xs text-ink/50">Conversaciones</span><MessageCircle size={16} className="text-teal-600 dark:text-teal-400" /></div>
                    <p className="font-display text-3xl font-bold text-ink">2,486</p>
                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">+18.4% esta semana</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 bg-canvas/50 p-4">
                    <div className="mb-5 flex items-center justify-between"><span className="text-xs text-ink/50">Automatizaciones</span><Bot size={16} className="text-teal-700 dark:text-teal-300" /></div>
                    <p className="font-display text-3xl font-bold text-ink">14</p>
                    <p className="mt-1 text-xs text-ink/40">Funcionando ahora</p>
                  </div>
                </div>
                <div className="absolute bottom-6 right-6 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-teal-700 shadow-xl shadow-teal-600/30"><Zap size={27} className="text-white" /></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Auth ───────────────────────────────────────────────────── */

function Auth({ mode, setMode, onSuccess, onBack }: { mode: AuthMode; setMode: (mode: AuthMode) => void; onSuccess: (profile: Profile | null) => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message.includes('Invalid') ? 'El correo o la contraseña no son correctos.' : result.error.message);
      return;
    }
    if (mode === 'signup' && !result.data.session) {
      setNotice('Revisa tu correo para confirmar la cuenta y continuar.');
      return;
    }
    if (result.data.user) {
      const { data } = await supabase.from('onboarding_profiles').select('*').eq('id', result.data.user.id).maybeSingle();
      onSuccess(data as Profile | null);
    }
  }

  return (
    <div className="min-h-screen bg-canvas px-6 py-6 sm:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <button onClick={onBack} aria-label="Volver"><ArrowLeft size={22} className="text-ink/60 transition hover:text-ink" /></button>
        <Logo />
        <span className="w-7" />
      </div>
      <div className="mx-auto flex max-w-md flex-col justify-center py-16 sm:py-24">
        <div className="mb-8">
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 text-white"><Command size={28} /></div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">{mode === 'signup' ? 'Crea tu espacio.' : 'Qué bueno verte.'}</h1>
          <p className="mt-3 text-ink/50">{mode === 'signup' ? 'Unos minutos para poner tu comunidad a trabajar.' : 'Entra para continuar donde lo dejaste.'}</p>
        </div>
        <div className="mb-7 flex rounded-xl border border-ink/10 bg-ink/5 p-1">
          <button onClick={() => setMode('signup')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'signup' ? 'bg-brand text-brand-ink' : 'text-ink/50'}`}>Crear cuenta</button>
          <button onClick={() => setMode('signin')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'signin' ? 'bg-brand text-brand-ink' : 'text-ink/50'}`}>Iniciar sesión</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-2 block text-sm text-ink/60">Tu nombre o marca</span>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-3.5 text-ink outline-none transition placeholder:text-ink/25 focus:border-teal-500" placeholder="Ej. Estudio Norte" />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm text-ink/60">Correo electrónico</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-3.5 text-ink outline-none transition placeholder:text-ink/25 focus:border-teal-500" placeholder="tu@correo.com" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-ink/60">Contraseña</span>
            <input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-3.5 text-ink outline-none transition placeholder:text-ink/25 focus:border-teal-500" placeholder="Mínimo 6 caracteres" />
          </label>
          {error && <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</p>}
          {notice && <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
          <Button type="submit" disabled={loading} className="mt-2 w-full py-3.5">{loading ? 'Preparando...' : mode === 'signup' ? 'Comenzar ahora' : 'Entrar a mi espacio'} <ArrowRight size={17} /></Button>
        </form>
        <p className="mt-7 text-center text-xs leading-5 text-ink/35">Al continuar aceptas nuestros términos y política de privacidad.</p>
      </div>
    </div>
  );
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

function SetupShell({ children, onBack, eyebrow }: { children: ReactNode; onBack: () => void; eyebrow: string }) {
  return (
    <div className="min-h-screen bg-canvas px-6 py-6 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex items-center justify-between">
          <button onClick={onBack} aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 text-ink/60 transition hover:border-ink/25 hover:text-ink"><ArrowLeft size={19} /></button>
          <Logo />
          <span className="text-xs font-semibold uppercase tracking-[.16em] text-ink/35">{eyebrow}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Channel({ onNext, onBack, selected, setSelected }: { onNext: () => void; onBack: () => void; selected: string; setSelected: (channel: string) => void }) {
  return (
    <SetupShell onBack={onBack} eyebrow="Paso 1 de 3">
      <Progress step={1} />
      <div className="mb-10 max-w-xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Conecta tu primer canal.</h1>
        <p className="mt-4 text-lg leading-7 text-ink/50">Puedes sumar los demás cuando quieras. Empecemos por donde vive tu comunidad.</p>
      </div>
      <div className="space-y-3">
        {channels.map(channel => (
          <button key={channel.name} onClick={() => setSelected(channel.name)} className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all ${selected === channel.name ? 'border-teal-500 bg-teal-500/5' : 'border-ink/10 bg-ink/[.03] hover:border-ink/25'}`}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${channel.tone}`}>{channel.icon}</span>
            <span className="flex-1">
              <span className="block font-display text-lg font-bold text-ink">{channel.name}</span>
              <span className="mt-1 block text-sm text-ink/45">{channel.detail}</span>
            </span>
            <span className={`text-sm font-semibold ${selected === channel.name ? 'text-teal-600 dark:text-teal-400' : 'text-ink/50'}`}>{selected === channel.name ? 'Conectado' : 'Conectar'}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-end"><Button disabled={!selected} onClick={onNext}>Continuar <ArrowRight size={17} /></Button></div>
    </SetupShell>
  );
}

function Questions({ profile, setProfile, onFinish, onBack }: { profile: Profile; setProfile: (profile: Profile) => void; onFinish: () => void; onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(profile.display_name ?? '');
  const [account, setAccount] = useState(profile.account_type ?? '');
  const [goals, setGoals] = useState<string[]>(profile.goals ?? []);
  const [source, setSource] = useState(profile.discovery_source ?? '');
  const options = step === 1 ? accountOptions : step === 2 ? goalOptions : sourceOptions;
  const title = step === 1 ? '¿Para quién es este espacio?' : step === 2 ? '¿Cómo generas ingresos normalmente?' : '¿Cómo nos encontraste?';
  const subtitle = step === 1 ? 'Así podremos recomendarte automatizaciones más útiles.' : step === 2 ? 'Te mostraremos ideas que encajen con tu forma de crecer.' : 'Nos ayuda a aparecer en los lugares correctos.';
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
    if (saveError) { setError('No pudimos guardar tus respuestas. Inténtalo de nuevo.'); return; }
    setProfile({ ...profile, ...payload });
    onFinish();
  }

  return (
    <SetupShell onBack={step === 1 ? onBack : () => setStep(step - 1)} eyebrow={`Paso ${step + 1} de 3`}>
      <Progress step={step + 1} />
      <div className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Hagamos que sea tuyo.</h1>
        <p className="mt-4 max-w-lg text-lg leading-7 text-ink/50">{subtitle}</p>
      </div>
      {step === 1 && (
        <label className="mb-7 block">
          <span className="mb-2 block text-sm text-ink/60">¿Cómo te llamamos?</span>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-ink/5 px-4 py-3.5 text-ink outline-none transition placeholder:text-ink/25 focus:border-teal-500" placeholder="Tu nombre o marca" />
        </label>
      )}
      <h2 className="mb-4 font-display text-xl font-bold text-ink">{title}</h2>
      <div className="space-y-3">
        {options.map(option => <ChoiceCard key={option.value} option={option} selected={Array.isArray(selected) ? selected.includes(option.value) : selected === option.value} onClick={() => toggle(option.value)} multi={step === 2} />)}
      </div>
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
      <div className="mt-8 flex justify-end">
        <Button disabled={!selected || (step === 2 && goals.length === 0) || saving} onClick={next}>{saving ? 'Guardando...' : step === 3 ? 'Entrar a mi dashboard' : 'Siguiente'} <ArrowRight size={17} /></Button>
      </div>
    </SetupShell>
  );
}

/* ── Dashboard ─────────────────────────────────────────────── */

function Dashboard({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [tab, setTab] = useState<DashboardTab>('Inicio');
  const [showMenu, setShowMenu] = useState(false);
  const { themePref, updateTheme } = useTheme(profile);
  const firstName = (profile.display_name ?? 'Creador').split(' ')[0];
  const nav: { label: DashboardTab; icon: ReactNode }[] = [
    { label: 'Inicio', icon: <Home size={18} /> },
    { label: 'Bandeja', icon: <Inbox size={18} /> },
    { label: 'Contactos', icon: <Users size={18} /> },
    { label: 'Automatizaciones', icon: <Bot size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink/10 bg-panel p-5 lg:flex">
        <Logo />
        <div className="mt-12 space-y-1">
          {nav.map(item => (
            <button key={item.label} onClick={() => setTab(item.label)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${tab === item.label ? 'bg-brand text-brand-ink' : 'text-ink/50 hover:bg-ink/5 hover:text-ink'}`}>{item.icon}{item.label}</button>
          ))}
        </div>
        <div className="mt-auto space-y-1">
          <button onClick={() => setTab('Configuración')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${tab === 'Configuración' ? 'bg-brand text-brand-ink' : 'text-ink/50 hover:bg-ink/5 hover:text-ink'}`}><Settings size={18} /> Configuración</button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-ink/50 hover:bg-ink/5 hover:text-ink"><LogOut size={18} /> Cerrar sesión</button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-ink/10 bg-canvas/85 px-6 backdrop-blur-xl sm:px-10">
          <div className="lg:hidden"><Logo compact /></div>
          <div className="hidden items-center gap-3 text-sm text-ink/50 lg:flex"><span>Espacio</span><ChevronRight size={15} /><span className="text-ink">{profile.display_name ?? 'Mi marca'}</span></div>
          <div className="flex items-center gap-3">
            <button className="hidden h-10 w-10 place-items-center rounded-xl border border-ink/10 text-ink/50 hover:text-ink sm:grid"><Bell size={18} /></button>
            <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-2 py-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 text-xs font-bold text-white">{firstName[0]?.toUpperCase()}</span>
              <span className="hidden text-sm font-semibold text-ink sm:block">{firstName}</span>
              <ChevronRight size={14} className="rotate-90 text-ink/40" />
            </button>
            {showMenu && (
              <div className="absolute right-6 top-16 w-48 rounded-xl border border-ink/10 bg-panel p-2 shadow-2xl">
                <button onClick={() => { setTab('Configuración'); setShowMenu(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink/70 hover:bg-ink/5"><Settings size={15} /> Configuración</button>
                <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink/70 hover:bg-ink/5"><LogOut size={15} /> Cerrar sesión</button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
          {tab === 'Inicio' && <HomeView profile={profile} firstName={firstName} setTab={setTab} />}
          {tab === 'Bandeja' && <EmptyView title="Bandeja" description="Todas tus conversaciones en un solo lugar." icon={<Inbox size={30} />} action="Crear respuesta automática" />}
          {tab === 'Contactos' && <EmptyView title="Contactos" description="Tu comunidad aparecerá aquí cuando conectes tu canal." icon={<Users size={30} />} action="Conectar otro canal" />}
          {tab === 'Automatizaciones' && <AutomationView />}
          {tab === 'Configuración' && <SettingsView profile={profile} themePref={themePref} updateTheme={updateTheme} onLogout={onLogout} />}
        </main>

        {/* Mobile bottom nav — includes Configuración */}
        <nav className="fixed bottom-5 left-1/2 z-20 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center justify-around rounded-2xl border border-ink/15 bg-panel/90 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden">
          {nav.map(item => (
            <button key={item.label} onClick={() => setTab(item.label)} className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition ${tab === item.label ? 'bg-brand text-brand-ink' : 'text-ink/45'}`}>{item.icon}{item.label}</button>
          ))}
          <button onClick={() => setTab('Configuración')} className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition ${tab === 'Configuración' ? 'bg-brand text-brand-ink' : 'text-ink/45'}`}><Settings size={18} />Ajustes</button>
        </nav>
      </div>
    </div>
  );
}

function HomeView({ profile, firstName, setTab }: { profile: Profile; firstName: string; setTab: (tab: DashboardTab) => void }) {
  const channel = profile.channel ?? 'Instagram';
  return (
    <div className="animate-rise">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-teal-600 dark:text-teal-400">Buenos días, {firstName}</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Tu comunidad está lista.</h1>
          <p className="mt-3 text-ink/45">Un vistazo a lo que está pasando en tu espacio.</p>
        </div>
        <Button variant="secondary" onClick={() => setTab('Automatizaciones')}><Plus size={17} /> Nueva automatización</Button>
      </div>
      <div className="grid-lines relative overflow-hidden rounded-3xl border border-teal-500/20 bg-panel p-6 sm:p-8">
        <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="relative max-w-xl">
          <div className="mb-7 flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {channel} conectado</div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">No dejes que el crecimiento<br />te quite tu voz.</h2>
          <p className="mt-4 max-w-md text-ink/55">Empieza con una automatización y deja que Flujo haga el trabajo pesado por ti.</p>
          <button onClick={() => setTab('Automatizaciones')} className="mt-7 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-ink transition hover:opacity-90">Explorar ideas <ArrowRight className="ml-2 inline" size={17} /></button>
        </div>
      </div>
      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        {[['Conversaciones', '2,486', '+18.4%', <MessageCircle size={18} key="a" />], ['Contactos nuevos', '348', '+12.8%', <Users size={18} key="b" />], ['Automatizaciones', '14', '3 activas', <Bot size={18} key="c" />]].map(([label, value, change, icon]) => (
          <div key={String(label)} className="rounded-2xl border border-ink/10 bg-ink/[.035] p-5">
            <div className="flex items-center justify-between text-ink/45"><span className="text-sm">{label as string}</span>{icon}</div>
            <p className="mt-5 font-display text-3xl font-bold text-ink">{value as string}</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{change as string}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Ideas para empezar</h2>
          <button onClick={() => setTab('Automatizaciones')} className="text-sm font-semibold text-teal-600 dark:text-teal-400">Ver todas <ChevronRight className="inline" size={15} /></button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[['Responder comentarios', 'Envía un DM a quien comenta en tus posts', <MessageCircle size={20} key="d" />, 'teal'], ['Nuevos seguidores', 'Da la bienvenida a tu comunidad desde el primer día', <Users size={20} key="e" />, 'teal'], ['Respuesta a historias', 'Automatiza tus respuestas más frecuentes', <Zap size={20} key="f" />, 'teal']].map(([title, description, icon]) => (
            <button key={String(title)} onClick={() => setTab('Automatizaciones')} className="group rounded-2xl border border-ink/10 bg-ink/[.035] p-5 text-left transition hover:-translate-y-1 hover:border-ink/25">
              <span className="mb-8 grid h-10 w-10 place-items-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">{icon}</span>
              <h3 className="font-semibold text-ink">{title as string}</h3>
              <p className="mt-2 text-sm leading-5 text-ink/45">{description as string}</p>
              <ChevronRight className="mt-5 text-ink/30 transition group-hover:translate-x-1 group-hover:text-ink" size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyView({ title, description, icon, action }: { title: string; description: string; icon: ReactNode; action: string }) {
  return (
    <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400">{icon}</div>
      <h1 className="mt-7 font-display text-4xl font-extrabold text-ink">{title}</h1>
      <p className="mt-3 max-w-sm text-ink/45">{description}</p>
      <Button className="mt-7">{action} <ArrowRight size={17} /></Button>
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
            <div className="grid-lines h-44 p-5 bg-panel">
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

/* ── Settings ──────────────────────────────────────────────── */

function SettingsView({ profile, themePref, updateTheme, onLogout }: { profile: Profile; themePref: ThemePref; updateTheme: (pref: ThemePref) => void; onLogout: () => void }) {
  return (
    <div className="animate-rise max-w-2xl">
      <div className="mb-10">
        <p className="mb-2 text-sm font-semibold text-teal-600 dark:text-teal-400">Configuración</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Ajustes</h1>
        <p className="mt-3 text-ink/45">Personaliza tu experiencia en Flujo.</p>
      </div>

      {/* Appearance */}
      <section className="mb-8 rounded-2xl border border-ink/10 bg-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400"><Monitor size={20} /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Apariencia</h2>
            <p className="text-sm text-ink/45">Elige cómo se ve Flujo para ti.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(opt => (
            <button key={opt.value} onClick={() => updateTheme(opt.value)} className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${themePref === opt.value ? 'border-teal-500 bg-teal-500/10' : 'border-ink/10 bg-ink/[.03] hover:border-ink/25'}`}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl transition ${themePref === opt.value ? 'bg-teal-500 text-white' : 'bg-ink/5 text-ink/60'}`}>{opt.icon}</span>
              <span className={`text-sm font-semibold ${themePref === opt.value ? 'text-ink' : 'text-ink/60'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Account */}
      <section className="mb-8 rounded-2xl border border-ink/10 bg-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400"><Users size={20} /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Cuenta</h2>
            <p className="text-sm text-ink/45">Tu información de usuario.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-ink/[.03] px-4 py-3">
            <span className="text-sm text-ink/50">Nombre</span>
            <span className="text-sm font-semibold text-ink">{profile.display_name ?? 'Sin definir'}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink/[.03] px-4 py-3">
            <span className="text-sm text-ink/50">Canal conectado</span>
            <span className="text-sm font-semibold text-ink">{profile.channel ?? 'Ninguno'}</span>
          </div>
        </div>
      </section>

      {/* Session */}
      <section className="rounded-2xl border border-ink/10 bg-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"><LogOut size={20} /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Sesión</h2>
            <p className="text-sm text-ink/45">Cierra sesión en este dispositivo.</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"><LogOut size={16} /> Cerrar sesión</button>
      </section>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────── */

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [channel, setChannel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
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

  if (loading) return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/10 border-t-teal-500" /></div>;

  if (screen === 'landing') return <Landing onStart={() => { setAuthMode('signup'); setScreen('auth'); }} onSignIn={() => { setAuthMode('signin'); setScreen('auth'); }} />;

  if (screen === 'auth') return <Auth mode={authMode} setMode={setAuthMode} onBack={() => setScreen('landing')} onSuccess={async nextProfile => {
    if (nextProfile?.onboarding_complete) { setProfile(nextProfile); setScreen('dashboard'); }
    else if (nextProfile) { setProfile(nextProfile); setScreen('channel'); }
    else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newProfile: Profile = { id: user.id, display_name: null, channel: null, account_type: null, goals: [], discovery_source: null, onboarding_complete: false, theme_preference: 'system' };
        await supabase.from('onboarding_profiles').upsert({ id: user.id, goals: [], onboarding_complete: false, theme_preference: 'system' });
        setProfile(newProfile);
        setScreen('channel');
      }
    }
  }} />;

  if (screen === 'channel' && profile) return <Channel selected={channel} setSelected={setChannel} onBack={() => setScreen('landing')} onNext={async () => {
    const updated = { ...profile, channel };
    const { error } = await supabase.from('onboarding_profiles').upsert({ id: profile.id, channel });
    if (!error) { setProfile(updated); setScreen('questions'); }
  }} />;

  if (screen === 'questions' && profile) return <Questions profile={profile} setProfile={setProfile} onBack={() => setScreen('channel')} onFinish={() => setScreen('dashboard')} />;

  if (profile) return <Dashboard profile={profile} onLogout={async () => { await supabase.auth.signOut(); setScreen('landing'); }} />;

  return null;
}

export default App;
