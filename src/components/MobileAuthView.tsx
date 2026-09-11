import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, X, ArrowRight, Sparkles, CheckCircle2, Eye, EyeOff, Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleIcon, FacebookIcon } from './SocialIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '../types';

interface MobileAuthViewProps {
  onSuccess: (profile: Profile | null) => void;
  onExploreDesktop?: () => void;
}

const translations = {
  ES: {
    headline: 'Make the most out of every conversation',
    subtitlePart1: 'Tu negocio crece.',
    subtitlePart2: 'Tu tiempo vuelve.',
    tabs: { signup: 'Crear cuenta', signin: 'Iniciar sesión' },
    continueEmail: 'Continuar con correo',
    separator: 'Consulta la ',
    terms: 'Política de Privacidad',
    and: ' y el centro de ',
    privacy: 'Seguridad',
    of: ' de Stage AI Labs.',
    form: {
      titleSignup: 'Crear tu espacio',
      titleSignin: 'Inicia sesión',
      nameLabel: 'Nombre o marca',
      namePlaceholder: 'Ej. Estudio Norte',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: '••••••••',
      submitSignup: 'Crear mi espacio',
      submitSignin: 'Entrar a mi espacio',
      processing: 'Procesando...',
      errorInvalid: 'El correo o la contraseña no son correctos.',
      noticeEmail: '¡Cuenta creada! Revisa tu correo o entra directamente.'
    }
  },
  EN: {
    headline: 'Make the most out of every conversation',
    subtitlePart1: 'Your business grows.',
    subtitlePart2: 'Your time returns.',
    tabs: { signup: 'Create account', signin: 'Sign in' },
    continueEmail: 'Continue with email',
    separator: 'See the Stage AI Labs ',
    terms: 'Privacy Policy',
    and: ' and ',
    privacy: 'Security Center',
    of: '.',
    form: {
      titleSignup: 'Create your space',
      titleSignin: 'Sign in',
      nameLabel: 'Name or brand',
      namePlaceholder: 'e.g. North Studio',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      submitSignup: 'Create my space',
      submitSignin: 'Enter my space',
      processing: 'Processing...',
      errorInvalid: 'Invalid email or password.',
      noticeEmail: 'Account created! Check your email or sign in.'
    }
  },
  PT: {
    headline: 'Make the most out of every conversation',
    subtitlePart1: 'Seu negócio cresce.',
    subtitlePart2: 'Seu tempo volta.',
    tabs: { signup: 'Criar conta', signin: 'Entrar' },
    continueEmail: 'Continuar com e-mail',
    separator: 'Consulte a ',
    terms: 'Política de Privacidade',
    and: ' e o centro de ',
    privacy: 'Segurança',
    of: ' da Stage AI Labs.',
    form: {
      titleSignup: 'Criar seu espaço',
      titleSignin: 'Entrar',
      nameLabel: 'Nome ou marca',
      namePlaceholder: 'Ex. Estúdio Norte',
      emailLabel: 'E-mail',
      emailPlaceholder: 'seu@email.com',
      passwordLabel: 'Senha',
      passwordPlaceholder: '••••••••',
      submitSignup: 'Criar meu espaço',
      submitSignin: 'Entrar no meu espaço',
      processing: 'Processando...',
      errorInvalid: 'O e-mail ou a senha estão incorretos.',
      noticeEmail: 'Conta criada! Verifique seu e-mail ou entre.'
    }
  }
};

export function MobileAuthView({ onSuccess }: MobileAuthViewProps) {
  const [tab, setTab] = useState<'signup' | 'signin'>('signup');
  const [showEmailSheet, setShowEmailSheet] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<'ES' | 'EN' | 'PT'>('ES');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = translations[lang];

  const languages = [
    { code: 'ES', label: 'Español' },
    { code: 'EN', label: 'English' },
    { code: 'PT', label: 'Português' },
  ] as const;

  // Social login handler (Google & Facebook only)
  async function handleSocialLogin(provider: 'google' | 'facebook') {
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (authError) {
        setError('No pudimos iniciar la conexión. Inténtalo de nuevo.');
      }
    } catch {
      setError('No pudimos iniciar la conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const result =
        tab === 'signup'
          ? await supabase.auth.signUp({
              email,
              password,
              options: { data: { display_name: name || 'Creador Stage' } },
            })
          : await supabase.auth.signInWithPassword({
              email,
              password,
            });

      setLoading(false);

      if (result.error) {
        if (result.error.message.includes('Invalid')) {
          setError('El correo o la contraseña no son correctos.');
        } else {
          setError('No pudimos completar el acceso. Inténtalo de nuevo.');
        }
        return;
      }

      if (tab === 'signup' && !result.data.session) {
        setNotice('Cuenta creada. Revisa tu correo para confirmarla y continuar.');
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
      setError('No pudimos completar el acceso. Revisa tu conexión e inténtalo de nuevo.');
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#0f2331] font-sans text-white select-none">
      {/* 1. Full-screen background photography */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85"
          alt="Creator holding lemons"
          className="h-full w-full object-cover object-center brightness-[0.7]"
          referrerPolicy="no-referrer"
        />
        {/* Soft atmospheric gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2331]/80 via-[#0f2331]/40 to-[#0f2331]/95" />
        
        {/* Animated Glowing Orbs for Liquid Glass effect */}
        <div className="absolute left-[-20%] top-[10%] h-[300px] w-[300px] rounded-full bg-[#168a84]/40 mix-blend-screen blur-[80px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute right-[-10%] top-[40%] h-[250px] w-[250px] rounded-full bg-emerald-500/30 mix-blend-screen blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[20%] h-[400px] w-[400px] rounded-full bg-teal-600/30 mix-blend-screen blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="relative z-50 flex items-center justify-between px-6 pt-6 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#0d5c58] shadow-sm shadow-[#0d5c58]/80 ring-2 ring-white/30 animate-pulse" />
          <div className="flex items-center gap-1.5">
            <span className="font-display text-2xl font-black tracking-tight text-white drop-shadow-md">
              Stage AI Labs
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-md">
              LLC
            </span>
          </div>
        </div>

        {/* Language selector in place of avatar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex h-8 items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 text-xs font-bold text-white shadow-md backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <Globe size={14} className="text-white" />
            <span>{lang}</span>
            <ChevronDown size={12} className="text-white/70" />
          </button>
          
          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-32 overflow-hidden rounded-xl border border-white/20 bg-[#0f2331]/95 p-1.5 shadow-xl backdrop-blur-xl z-50">
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
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{l.label}</span>
                  {lang === l.code && <Check size={13} className="text-teal-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 3. Center Display Typography */}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-end px-6 pb-6 text-left">
        <h1 className="font-display text-[2.5rem] font-black leading-[1.06] tracking-[-0.035em] text-white drop-shadow-xl sm:text-5xl">
          {t.headline}
        </h1>
        <p className="mt-2.5 text-sm font-medium text-white/85 drop-shadow-md">
          <span className="text-white">{t.subtitlePart1}</span>{' '}
          <span className="font-bold text-teal-300">{t.subtitlePart2}</span>
        </p>
      </div>

      {/* 4. Apple Liquid Glass Bottom Card */}
      <div
        id="mobile-auth-liquid-card"
        className="relative z-20 mx-auto flex w-full max-w-md flex-col rounded-t-[2.4rem] border-x border-t border-white/25 bg-white/[0.14] px-6 pb-10 pt-4 shadow-[0_-12px_45px_rgba(0,0,0,0.45)] backdrop-blur-3xl ring-1 ring-inset ring-white/20"
      >
        {/* Apple-style Drag indicator */}
        <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/30 backdrop-blur-md" />

        {/* Apple-style Segmented Tab Switcher with fluid slider animation */}
        <div className="relative mb-6 flex rounded-2xl border border-white/20 bg-black/20 p-1.5 backdrop-blur-xl shadow-inner">
          <button
            type="button"
            id="mobile-tab-create-account"
            onClick={() => setTab('signup')}
            className="relative z-10 flex-1 py-3 text-center text-xs font-bold transition-colors duration-200"
          >
            {tab === 'signup' && (
              <motion.div
                layoutId="mobile-auth-active-pill"
                className="absolute inset-0 rounded-xl border border-white/30 bg-white/25 shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-2xl ring-1 ring-white/20"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className={`relative z-20 ${tab === 'signup' ? 'text-white font-extrabold' : 'text-white/60 hover:text-white'}`}>
              {t.tabs.signup}
            </span>
          </button>

          <button
            type="button"
            id="mobile-tab-sign-in"
            onClick={() => setTab('signin')}
            className="relative z-10 flex-1 py-3 text-center text-xs font-bold transition-colors duration-200"
          >
            {tab === 'signin' && (
              <motion.div
                layoutId="mobile-auth-active-pill"
                className="absolute inset-0 rounded-xl border border-white/30 bg-white/25 shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-2xl ring-1 ring-white/20"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className={`relative z-20 ${tab === 'signin' ? 'text-white font-extrabold' : 'text-white/60 hover:text-white'}`}>
              {t.tabs.signin}
            </span>
          </button>
        </div>

        {/* Action Buttons Column with Liquid Glass aesthetics */}
        <div className="space-y-4">
          {/* Primary Action Button: Email */}
          <button
            type="button"
            id="mobile-auth-email-button"
            onClick={() => setShowEmailSheet(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0d5c58] py-4 text-sm font-bold text-white shadow-lg shadow-[#0d5c58]/35 transition hover:bg-[#094542] active:scale-[0.98] border border-teal-400/30"
          >
            <Mail size={18} strokeWidth={2.4} />
            <AnimatePresence mode="wait">
              <motion.span
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {t.continueEmail}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Social Auth Option: Google & Facebook ONLY (Apple removed) */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Google Glass Button */}
            <button
              type="button"
              id="mobile-auth-google-box"
              onClick={() => handleSocialLogin('google')}
              className="flex h-14 items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/[0.18] px-4 shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-white/[0.28] active:scale-95"
              aria-label="Google"
            >
              <div className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm">
                <GoogleIcon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-white">Google</span>
            </button>

            {/* Facebook Glass Button */}
            <button
              type="button"
              id="mobile-auth-facebook-box"
              onClick={() => handleSocialLogin('facebook')}
              className="flex h-14 items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/[0.18] px-4 shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-white/[0.28] active:scale-95"
              aria-label="Facebook"
            >
              <div className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm">
                <FacebookIcon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-white">Facebook</span>
            </button>
          </div>
        </div>

        {/* Footer Terms */}
        <p className="mt-6 mb-2 text-center text-[11px] leading-4 text-white/60 drop-shadow-sm">
          {t.separator}
          <a
            href="https://stage-labs.ai.studio/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline underline-offset-2 hover:text-teal-200"
          >
            {t.terms}
          </a>
          {t.and}
          <a
            href="https://stage-labs.ai.studio/security"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline underline-offset-2 hover:text-teal-200"
          >
            {t.privacy}
          </a>
          {t.of}
        </p>
      </div>

      {/* 5. Slide-up Email Liquid Glass Drawer Sheet */}
      <AnimatePresence>
        {showEmailSheet && (
          <motion.div
            id="email-auth-sheet-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setShowEmailSheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2.6rem] border-t border-x border-white/30 bg-[#0f2331]/80 p-6 text-white shadow-[0_-16px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl ring-1 ring-inset ring-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Apple-style pill indicator & Close button */}
              <div className="flex items-center justify-between pb-2">
                <div className="h-1 w-10 rounded-full bg-white/30" />
                <button
                  type="button"
                  id="email-sheet-close-btn"
                  onClick={() => setShowEmailSheet(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/25 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Brand Graphic */}
              <div className="mt-3 flex items-center gap-3.5">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d5c58] p-2 shadow-lg shadow-[#0d5c58]/40 border border-teal-400/30">
                  <Sparkles size={24} className="text-teal-200" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-200">
                    <CheckCircle2 size={11} /> CEO Copilot
                  </span>
                  <p className="mt-1 text-xs text-white/70">Stage AI Labs LLC</p>
                </div>
              </div>

              {/* Title & Subtitle with Animated text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: tab === 'signup' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tab === 'signup' ? 10 : -10 }}
                  transition={{ duration: 0.15 }}
                  className="mt-4"
                >
                  <h2 className="font-display text-2xl font-black tracking-tight text-white">
                    {tab === 'signup' ? t.form.titleSignup : t.form.titleSignin}
                  </h2>
                </motion.div>
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3.5">
                <AnimatePresence>
                  {tab === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="mb-1 block text-xs font-semibold text-white/80">
                        {t.form.nameLabel}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.form.namePlaceholder}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none backdrop-blur-md transition focus:border-teal-400 focus:bg-white/15"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/80">
                    {t.form.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.form.emailPlaceholder}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none backdrop-blur-md transition focus:border-teal-400 focus:bg-white/15"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/80">
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
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-10 text-sm text-white placeholder-white/30 outline-none backdrop-blur-md transition focus:border-teal-400 focus:bg-white/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/20 p-3 text-xs text-red-200">
                    {error}
                  </div>
                )}

                {notice && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 p-3 text-xs text-emerald-200">
                    {notice}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d5c58] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0d5c58]/35 transition hover:bg-[#094542] active:scale-[0.98] disabled:opacity-50 border border-teal-400/30"
                >
                  {loading ? t.form.processing : tab === 'signup' ? t.form.submitSignup : t.form.submitSignin}
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Switch tab in sheet */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setTab(tab === 'signup' ? 'signin' : 'signup')}
                  className="text-xs font-semibold text-teal-300 hover:underline"
                >
                  {tab === 'signup'
                    ? '¿Ya tienes una cuenta? Iniciar sesión'
                    : '¿No tienes cuenta? Crear una'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
