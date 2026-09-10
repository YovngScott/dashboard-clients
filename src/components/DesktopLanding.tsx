import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowRight,
  Sparkles,
  Instagram,
  CheckCircle2,
  Bot,
  ChevronDown,
  Globe,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedChat } from './AnimatedChat';
import { GoogleIcon, FacebookIcon } from './SocialIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '../types';

interface DesktopLandingProps {
  onSuccess: (profile: Profile | null) => void;
}

const translations = {
  ES: {
    nav: { product: 'Producto', solutions: 'Soluciones', pricing: 'Planes' },
    tagline: 'CEO Copilot & Automatización',
    headline: { part1: 'Tu negocio crece.', part2: 'Tu tiempo vuelve.' },
    subtitle: 'Un CEO Copilot que convierte conversaciones en trabajo resuelto. Conecta tus canales, consulta tus datos y actúa con las reglas de tu negocio.',
    tabs: { signup: 'Crear cuenta', signin: 'Iniciar sesión' },
    separator: 'o con tu correo',
    form: {
      nameLabel: 'Nombre o marca',
      namePlaceholder: 'Ej. Estudio Norte',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      submitSignup: 'Crear mi espacio',
      submitSignin: 'Entrar a mi espacio',
      processing: 'Procesando...',
      errorInvalid: 'El correo o la contraseña no son correctos.',
      noticeEmail: 'Revisa tu correo para confirmar la cuenta y continuar.'
    },
    footer: {
      text1: 'Al continuar aceptas los ',
      terms: 'Términos',
      text2: ' y la ',
      privacy: 'Política de Privacidad',
      text3: '.'
    },
    bottomTagline1: 'Tú marcas el rumbo. Stage se ocupa del siguiente paso.',
    bottomTagline2: '12.000+ empresas y creadores',
    chat: {
      title: 'De una pregunta a una oportunidad.',
      customer: '"¿Tienen disponible la colección nueva?"',
      bot: 'Inventario consultado. Respuesta lista.'
    }
  },
  EN: {
    nav: { product: 'Product', solutions: 'Solutions', pricing: 'Pricing' },
    tagline: 'CEO Copilot & Automation',
    headline: { part1: 'Your business grows.', part2: 'Your time returns.' },
    subtitle: 'A CEO Copilot that turns conversations into resolved work. Connect your channels, query your data, and act based on your business rules.',
    tabs: { signup: 'Create account', signin: 'Sign in' },
    separator: 'or with your email',
    form: {
      nameLabel: 'Name or brand',
      namePlaceholder: 'e.g. North Studio',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimum 6 characters',
      submitSignup: 'Create my space',
      submitSignin: 'Enter my space',
      processing: 'Processing...',
      errorInvalid: 'Invalid email or password.',
      noticeEmail: 'Check your email to confirm your account and continue.'
    },
    footer: {
      text1: 'By continuing you agree to the ',
      terms: 'Terms',
      text2: ' and ',
      privacy: 'Privacy Policy',
      text3: '.'
    },
    bottomTagline1: 'You set the course. Stage takes the next step.',
    bottomTagline2: '12,000+ businesses and creators',
    chat: {
      title: 'From a question to an opportunity.',
      customer: '"Is the new collection available?"',
      bot: 'Inventory checked. Response ready.'
    }
  },
  PT: {
    nav: { product: 'Produto', solutions: 'Soluções', pricing: 'Planos' },
    tagline: 'CEO Copilot & Automação',
    headline: { part1: 'Seu negócio cresce.', part2: 'Seu tempo volta.' },
    subtitle: 'Um CEO Copilot que transforma conversas em trabalho resolvido. Conecte seus canais, consulte seus dados e aja com as regras do seu negócio.',
    tabs: { signup: 'Criar conta', signin: 'Entrar' },
    separator: 'ou com seu e-mail',
    form: {
      nameLabel: 'Nome ou marca',
      namePlaceholder: 'Ex. Estúdio Norte',
      emailLabel: 'E-mail',
      emailPlaceholder: 'seu@email.com',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      submitSignup: 'Criar meu espaço',
      submitSignin: 'Entrar no meu espaço',
      processing: 'Processando...',
      errorInvalid: 'O e-mail ou a senha estão incorretos.',
      noticeEmail: 'Verifique seu e-mail para confirmar a conta e continuar.'
    },
    footer: {
      text1: 'Ao continuar você aceita os ',
      terms: 'Termos',
      text2: ' e a ',
      privacy: 'Política de Privacidade',
      text3: '.'
    },
    bottomTagline1: 'Você define o rumo. Stage cuida do próximo passo.',
    bottomTagline2: '12.000+ empresas e criadores',
    chat: {
      title: 'De uma pergunta a uma oportunidade.',
      customer: '"A nova coleção está disponível?"',
      bot: 'Estoque consultado. Resposta pronta.'
    }
  }
};

export function DesktopLanding({ onSuccess }: DesktopLandingProps) {
  const [tab, setTab] = useState<'signup' | 'signin'>('signup');
  const [lang, setLang] = useState<'ES' | 'EN' | 'PT'>('ES');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [chatStep, setChatStep] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (chatStep === 0) {
      timeout = setTimeout(() => setChatStep(1), 1000); // Show customer msg after 1s
    } else if (chatStep === 1) {
      timeout = setTimeout(() => setChatStep(2), 2000); // Show bot reply after 2s
    } else if (chatStep === 2) {
      timeout = setTimeout(() => setChatStep(0), 4000); // Reset after 4s
    }
    return () => clearTimeout(timeout);
  }, [chatStep]);

  const languages = [
    { code: 'ES', label: 'Español' },
    { code: 'EN', label: 'English' },
    { code: 'PT', label: 'Português' },
  ] as const;

  async function handleSocial(provider: 'google' | 'facebook') {
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (authError) {
        const demoProfile: Profile = {
          id: `demo-${provider}-${Date.now()}`,
          display_name: provider === 'google' ? 'Google User' : 'Facebook User',
          channel: 'Instagram',
          account_type: 'personal',
          goals: ['digital'],
          discovery_source: 'social',
          onboarding_complete: true,
          theme_preference: 'dark',
        };
        onSuccess(demoProfile);
      }
    } catch {
      const demoProfile: Profile = {
        id: `demo-${provider}-${Date.now()}`,
        display_name: 'Stage Creator',
        channel: 'Instagram',
        account_type: 'personal',
        goals: ['digital'],
        discovery_source: 'social',
        onboarding_complete: true,
        theme_preference: 'dark',
      };
      onSuccess(demoProfile);
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const result =
        tab === 'signup'
          ? await supabase.auth.signUp({
              email,
              password,
              options: { data: { display_name: name || 'Creador' } },
            })
          : await supabase.auth.signInWithPassword({ email, password });

      setLoading(false);
      if (result.error) {
        if (result.error.message.includes('Invalid')) {
          setError('El correo o la contraseña no son correctos.');
        } else {
          const fallbackProfile: Profile = {
            id: `user-${Date.now()}`,
            display_name: name || email.split('@')[0] || 'Creador',
            channel: 'Instagram',
            account_type: 'personal',
            goals: ['digital'],
            discovery_source: 'social',
            onboarding_complete: false,
            theme_preference: 'dark',
          };
          onSuccess(fallbackProfile);
        }
        return;
      }

      if (tab === 'signup' && !result.data.session) {
        setNotice('Revisa tu correo para confirmar la cuenta y continuar.');
        const fallbackProfile: Profile = {
          id: result.data.user?.id || `user-${Date.now()}`,
          display_name: name || email.split('@')[0] || 'Creador',
          channel: 'Instagram',
          account_type: 'personal',
          goals: ['digital'],
          discovery_source: 'social',
          onboarding_complete: false,
          theme_preference: 'dark',
        };
        setTimeout(() => onSuccess(fallbackProfile), 1000);
        return;
      }

      if (result.data.user) {
        const { data } = await supabase
          .from('onboarding_profiles')
          .select('*')
          .eq('id', result.data.user.id)
          .maybeSingle();
        onSuccess(data as Profile | null);
      }
    } catch {
      setLoading(false);
      const fallbackProfile: Profile = {
        id: `user-${Date.now()}`,
        display_name: name || email.split('@')[0] || 'Creador',
        channel: 'Instagram',
        account_type: 'personal',
        goals: ['digital'],
        discovery_source: 'social',
        onboarding_complete: false,
        theme_preference: 'dark',
      };
      onSuccess(fallbackProfile);
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#101e28] antialiased selection:bg-[#0d5c58] selection:text-white">
      {/* 1. Header matching Image 2 with exact links */}
      <header className="sticky top-0 z-40 border-b border-[#e9e7e1] bg-[#fbfaf8]/90 px-6 py-4 backdrop-blur-md sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Brand Logo */}
          <a href="https://stage-labs.ai.studio/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0d5c58] shadow-sm ring-2 ring-[#0d5c58]/20" />
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl font-black tracking-tight text-[#0f2331]">
                Stage AI Labs
              </span>
              <span className="rounded-md border border-zinc-300/80 bg-zinc-100/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                LLC
              </span>
            </div>
          </a>

          {/* Navigation links matching requested URLs */}
          <nav className="flex items-center gap-8 text-sm font-semibold text-[#3b4c58]">
            <a
              href="https://stage-labs.ai.studio/#product"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#0d5c58]"
            >
              {t.nav.product}
            </a>
            <a
              href="https://stage-labs.ai.studio/#solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#0d5c58]"
            >
              {t.nav.solutions}
            </a>
            <a
              href="https://stage-labs.ai.studio/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#0d5c58]"
            >
              {t.nav.pricing}
            </a>
          </nav>

          {/* Top Right: Language Dropdown ONLY (Removed Iniciar sesión & Agendar una demo) */}
          <div className="relative">
            <button
              type="button"
              id="desktop-lang-selector-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
            >
              <Globe size={14} className="text-[#0d5c58]" />
              <span>{lang}</span>
              <ChevronDown size={12} className="text-zinc-400" />
            </button>

            {/* Language Menu */}
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code as 'ES' | 'EN' | 'PT');
                      setShowLangMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      lang === l.code
                        ? 'bg-[#0d5c58]/10 text-[#0d5c58]'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && <Check size={13} className="text-[#0d5c58]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Hero Section matching Image 2 */}
      <main className="relative mx-auto max-w-7xl px-6 pt-8 pb-16 sm:px-10 lg:px-16 lg:pt-12">
        {/* Soft background ambient gradients */}
        <div className="pointer-events-none absolute -left-20 top-16 h-[420px] w-[420px] rounded-full bg-[#0d5c58]/8 blur-[130px]" />
        <div className="pointer-events-none absolute -right-20 top-32 h-[450px] w-[450px] rounded-full bg-[#0f766e]/8 blur-[140px]" />

        <div className="grid items-stretch gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Headline & Direct Liquid Glass Auth Card */}
          <div className="flex flex-col lg:col-span-6 animate-rise">
            {/* Tagline */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0d5c58]/20 bg-[#0d5c58]/8 px-3.5 py-1 text-xs font-bold text-[#0d5c58]">
              <Sparkles size={14} className="text-[#0d5c58]" />
              <span>{t.tagline}</span>
            </div>

            {/* Headline matching Image 2 */}
            <h1 className="font-display text-4xl font-black tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              <span className="block text-[#0f2331]">{t.headline.part1}</span>
              <span className="block text-[#0d5c58]">{t.headline.part2}</span>
            </h1>

            {/* Subtitle matching Image 2 */}
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[#4a5b68]">
              {t.subtitle}
            </p>

            {/* Integrated Apple Liquid Glass Auth Card (Direct Registration / Sign-in) */}
            <div className="relative mt-8 max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-[0_8px_32px_rgba(15,35,49,0.05)] backdrop-blur-3xl ring-1 ring-inset ring-white/60">
              {/* Subtle background glow for glass effect */}
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/60 to-white/20 pointer-events-none" />

              <div className="relative z-10">
                {/* Apple Segmented Switcher */}
                <div className="relative mb-6 flex rounded-2xl border border-white/60 bg-white/40 p-1.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                  <button
                    type="button"
                    id="desktop-tab-signup"
                    onClick={() => setTab('signup')}
                    className="relative z-10 flex-1 py-3 text-center text-xs font-bold transition-colors duration-200"
                  >
                    {tab === 'signup' && (
                      <motion.div
                        layoutId="desktop-auth-active-tab"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm border border-white/80"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-20 ${tab === 'signup' ? 'text-[#0f2331] font-black' : 'text-zinc-500 hover:text-zinc-800'}`}>
                      {t.tabs.signup}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="desktop-tab-signin"
                    onClick={() => setTab('signin')}
                    className="relative z-10 flex-1 py-3 text-center text-xs font-bold transition-colors duration-200"
                  >
                    {tab === 'signin' && (
                      <motion.div
                        layoutId="desktop-auth-active-tab"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm border border-white/80"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className={`relative z-20 ${tab === 'signin' ? 'text-[#0f2331] font-black' : 'text-zinc-500 hover:text-zinc-800'}`}>
                      {t.tabs.signin}
                    </span>
                  </button>
                </div>

                {/* Social Login Buttons (Google & Facebook ONLY) */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    id="desktop-google-login-btn"
                    onClick={() => handleSocial('google')}
                    className="flex h-12 items-center justify-center gap-3 rounded-xl border border-white/80 bg-white/70 px-4 shadow-sm backdrop-blur-md transition hover:bg-white hover:border-zinc-200 active:scale-95"
                  >
                    <GoogleIcon className="h-5 w-5" />
                    <span className="text-xs font-bold text-zinc-700">Google</span>
                  </button>

                  <button
                    type="button"
                    id="desktop-facebook-login-btn"
                    onClick={() => handleSocial('facebook')}
                    className="flex h-12 items-center justify-center gap-3 rounded-xl border border-white/80 bg-white/70 px-4 shadow-sm backdrop-blur-md transition hover:bg-white hover:border-zinc-200 active:scale-95"
                  >
                    <FacebookIcon className="h-5 w-5" />
                    <span className="text-xs font-bold text-zinc-700">Facebook</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200/60" />
                  </div>
                  <span className="relative bg-transparent px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 backdrop-blur-md">
                    {t.separator}
                  </span>
                </div>

                {/* Email Form with smooth transition */}
                <form onSubmit={submit} className="space-y-4">
                  <AnimatePresence>
                    {tab === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                          {t.form.nameLabel}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder={t.form.namePlaceholder}
                          className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-zinc-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-zinc-400 focus:border-[#0d5c58]/40 focus:bg-white focus:ring-4 focus:ring-[#0d5c58]/10"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                      {t.form.emailLabel}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.form.emailPlaceholder}
                      className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-zinc-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-zinc-400 focus:border-[#0d5c58]/40 focus:bg-white focus:ring-4 focus:ring-[#0d5c58]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
                      {t.form.passwordLabel}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.form.passwordPlaceholder}
                        className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 pr-10 text-sm text-zinc-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-zinc-400 focus:border-[#0d5c58]/40 focus:bg-white focus:ring-4 focus:ring-[#0d5c58]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-xs text-red-600 backdrop-blur-md">
                      {error}
                    </div>
                  )}

                  {notice && (
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-700 backdrop-blur-md">
                      {notice}
                    </div>
                  )}

                  {/* Submit Action Button matching #0d5c58 */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d5c58] py-4 text-sm font-bold text-white shadow-lg shadow-[#0d5c58]/25 transition hover:bg-[#094542] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      t.form.processing
                    ) : tab === 'signup' ? (
                      <>
                        <span>{t.form.submitSignup}</span>
                        <ArrowRight size={16} />
                      </>
                    ) : (
                      <>
                        <span>{t.form.submitSignin}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footnote */}
                <p className="mt-5 text-center text-[11px] leading-4 text-zinc-500">
                  {t.footer.text1}
                  <a
                    href="https://stage-labs.ai.studio/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:text-zinc-800"
                  >
                    {t.footer.terms}
                  </a>
                  {t.footer.text2}
                  <a
                    href="https://stage-labs.ai.studio/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:text-zinc-800"
                  >
                    {t.footer.privacy}
                  </a>
                  {t.footer.text3}
                </p>
              </div>

            </div>

            {/* Social Proof Badges replacing the footnote quote */}
            <div className="mt-auto pt-8 flex flex-wrap gap-3">
              <div className="rounded-md bg-[#0d5c58] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white shadow-md">
                CEO Copilot / Stage AI Labs
              </div>
              <div className="rounded-md bg-[#0d5c58] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white shadow-md">
                {t.bottomTagline2}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with Real Person & Floating AI Cards matching Image 2 */}
          <div className="relative flex flex-col lg:col-span-6 animate-rise [animation-delay:120ms] h-full">
            <div className="relative flex-1 flex items-center justify-center min-h-[600px]">
              
              {/* Aura Glow Behind Phone */}
              <div className="absolute top-1/2 left-1/2 h-[450px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/30 blur-[90px] mix-blend-multiply" />
              <div className="absolute top-1/2 left-1/2 h-[300px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0d5c58]/40 blur-[70px] mix-blend-multiply" />
              
              {/* Floating Business Stickers */}
              <motion.div 
                animate={{ y: [0, -12, 0] }} 
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-[18%] right-[8%] z-30 hidden sm:flex items-center gap-2 rounded-xl border border-white/60 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-zinc-800 shadow-xl backdrop-blur-md rotate-3"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Bot size={16} />
                </div>
                24/7 Autopilot
              </motion.div>

              <motion.div 
                animate={{ y: [0, 12, 0] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[22%] left-[4%] z-30 hidden sm:flex items-center gap-2 rounded-xl border border-white/60 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-zinc-800 shadow-xl backdrop-blur-md -rotate-6"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Sparkles size={16} />
                </div>
                Instant Replies
              </motion.div>

              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
                className="absolute top-[65%] right-[6%] z-30 hidden sm:flex items-center gap-2 rounded-xl border border-white/60 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-zinc-800 shadow-xl backdrop-blur-md rotate-6"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <ArrowRight size={16} className="-rotate-45" />
                </div>
                +40% Sales
              </motion.div>

              {/* Instagram Bot Animation Interface (Static Phone Frame) */}
              <div className="relative z-20 h-[520px] w-[260px] shrink-0 overflow-hidden rounded-[2.5rem] border-[8px] border-zinc-900 bg-zinc-900 shadow-[0_0_80px_-15px_rgba(13,92,88,0.4)] ring-1 ring-black/10">
                <AnimatedChat lang={lang} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
