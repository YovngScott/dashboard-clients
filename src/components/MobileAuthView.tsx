import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, X, ArrowRight, CheckCircle2, Eye, EyeOff, Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleIcon, FacebookIcon } from './SocialIcons';
import { getAuthRedirectUrl, supabase } from '@/lib/supabase';
import { authErrorMessage, normalizeEmail, validateDisplayName, validatePassword } from '@/lib/auth-validation';
import { Profile } from '../types';
import { AuthTurnstile } from './AuthTurnstile';

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
      showPassword: 'Mostrar contraseña',
      hidePassword: 'Ocultar contraseña',
      submitSignup: 'Crear mi espacio',
      submitSignin: 'Entrar a mi espacio',
      processing: 'Procesando...',
      captchaLabel: 'Verificación de seguridad de Cloudflare',
      captchaGateTitle: 'Antes de continuar',
      captchaGateDescription: 'Completa la verificación para abrir el acceso con correo.',
      captchaUnavailable: 'La verificación no está disponible. Inténtalo más tarde.',
      captchaChecking: 'Comprobando que la solicitud es legítima…',
      captchaVerified: 'Verificación completada. Ya puedes continuar.',
      captchaError: 'No se pudo cargar la verificación. Recarga la página e inténtalo de nuevo.',
      captchaRequired: 'Completa de nuevo la verificación de seguridad para continuar.',
      errorInvalid: 'El correo o la contraseña no son correctos.',
      noticeEmail: 'Cuenta creada. Te enviamos un enlace de confirmación. Revisa también spam o promociones.'
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
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      submitSignup: 'Create my space',
      submitSignin: 'Enter my space',
      processing: 'Processing...',
      captchaLabel: 'Cloudflare security verification',
      captchaGateTitle: 'Before you continue',
      captchaGateDescription: 'Complete the security check to open email sign-in.',
      captchaUnavailable: 'Security verification is unavailable. Please try again later.',
      captchaChecking: 'Checking that this request is legitimate…',
      captchaVerified: 'Verification complete. You can continue.',
      captchaError: 'Security verification could not load. Reload the page and try again.',
      captchaRequired: 'Complete the security check again to continue.',
      errorInvalid: 'Invalid email or password.',
      noticeEmail: 'Account created. We sent you a confirmation link. Also check spam or promotions.'
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
      showPassword: 'Mostrar senha',
      hidePassword: 'Ocultar senha',
      submitSignup: 'Criar meu espaço',
      submitSignin: 'Entrar no meu espaço',
      processing: 'Processando...',
      captchaLabel: 'Verificação de segurança da Cloudflare',
      captchaGateTitle: 'Antes de continuar',
      captchaGateDescription: 'Conclua a verificação para abrir o acesso por e-mail.',
      captchaUnavailable: 'A verificação não está disponível. Tente novamente mais tarde.',
      captchaChecking: 'Verificando se a solicitação é legítima…',
      captchaVerified: 'Verificação concluída. Você já pode continuar.',
      captchaError: 'Não foi possível carregar a verificação. Atualize a página e tente novamente.',
      captchaRequired: 'Conclua novamente a verificação de segurança para continuar.',
      errorInvalid: 'O e-mail ou a senha estão incorretos.',
      noticeEmail: 'Conta criada. Enviamos um link de confirmação. Verifique também spam ou promoções.'
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
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [emailStage, setEmailStage] = useState<'captcha' | 'form'>('captcha');
  const emailTriggerRef = useRef<HTMLButtonElement>(null);
  const emailCloseRef = useRef<HTMLButtonElement>(null);
  const emailDialogRef = useRef<HTMLDivElement>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const emailFieldRef = useRef<HTMLInputElement>(null);
  const captchaHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousEmailStageRef = useRef(emailStage);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';

  const t = translations[lang];
  useEffect(() => {
    document.documentElement.classList.add('mobile-auth-active');
    return () => document.documentElement.classList.remove('mobile-auth-active');
  }, []);
  const updateCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
    setEmailStage((stage) => token ? 'form' : stage === 'form' ? 'captcha' : stage);
  }, []);

  function openEmailSheet() {
    setError('');
    setNotice('');
    setCaptchaToken('');
    setEmailStage('captcha');
    previousEmailStageRef.current = 'captcha';
    setShowEmailSheet(true);
  }

  function closeEmailSheet() {
    setShowEmailSheet(false);
  }

  useEffect(() => {
    if (!showEmailSheet) return;
    const emailTrigger = emailTriggerRef.current;
    emailCloseRef.current?.focus();

    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeEmailSheet();
        return;
      }
      if (event.key !== 'Tab' || !emailDialogRef.current) return;

      const focusable = Array.from(emailDialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
      )).filter((element) => !element.closest('[inert]') && element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusIsOutside = !emailDialogRef.current.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', keepFocusInside);
    return () => {
      window.removeEventListener('keydown', keepFocusInside);
      emailTrigger?.focus();
    };
  }, [showEmailSheet]);

  useEffect(() => {
    if (showEmailSheet && emailStage !== previousEmailStageRef.current) {
      if (emailStage === 'form') emailFieldRef.current?.focus();
      else captchaHeadingRef.current?.focus();
    }
    previousEmailStageRef.current = emailStage;
  }, [emailStage, showEmailSheet]);

  useEffect(() => {
    captchaContainerRef.current?.toggleAttribute('inert', emailStage === 'form');
  }, [emailStage]);

  const languages = [
    { code: 'ES', label: 'Español' },
    { code: 'EN', label: 'English' },
    { code: 'PT', label: 'Português' },
  ] as const;

  // Social login handler (Google & Facebook only)
  async function handleSocialLogin(provider: 'google' | 'facebook') {
    if (loading) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      });

      if (authError) {
        setError(authErrorMessage(authError.message));
      }
    } catch {
      setError('No pudimos iniciar la conexión. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    const normalizedEmail = normalizeEmail(email);
    const nameError = tab === 'signup' ? validateDisplayName(name) : null;
    const passwordError = tab === 'signup' ? validatePassword(password) : null;
    if (nameError || passwordError) {
      setError(nameError ?? passwordError ?? 'Revisa los datos e inténtalo de nuevo.');
      return;
    }
    if (!turnstileSiteKey || !captchaToken) {
      setError(t.form.captchaRequired);
      setEmailStage('captcha');
      return;
    }
    setLoading(true);

    try {
      const result =
        tab === 'signup'
          ? await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: { display_name: name.trim() },
                emailRedirectTo: getAuthRedirectUrl(),
                captchaToken: turnstileSiteKey ? captchaToken : undefined,
              },
            })
          : await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
              options: { captchaToken: turnstileSiteKey ? captchaToken : undefined },
            });

      if (result.error) {
        setError(authErrorMessage(result.error.message));
        return;
      }

      if (tab === 'signup' && !result.data.session) {
        setNotice(t.form.noticeEmail);
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
      setError('No pudimos completar el acceso. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      if (turnstileSiteKey) {
        setCaptchaToken('');
        setCaptchaAttempt((attempt) => attempt + 1);
      }
      setLoading(false);
    }
  }

  return (
    <div className="mobile-auth-screen relative flex w-full flex-col overflow-hidden bg-[#172c43] font-sans text-white">
      {/* 1. Full-screen background photography */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85"
          alt="Creator holding lemons"
          className="h-full w-full object-cover object-center brightness-[0.7]"
          referrerPolicy="no-referrer"
        />
        {/* Soft atmospheric gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#172c43] via-[#172c43]/35 to-[#172c43]" />
        
        {/* Animated Glowing Orbs for Liquid Glass effect */}
        <div className="absolute left-[-20%] top-[10%] h-[300px] w-[300px] rounded-full bg-[#126769]/40 mix-blend-screen blur-[80px]" />
        <div className="absolute right-[-10%] top-[40%] h-[250px] w-[250px] rounded-full bg-emerald-500/30 mix-blend-screen blur-[60px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[20%] h-[400px] w-[400px] rounded-full bg-teal-600/30 mix-blend-screen blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="mobile-auth-header relative z-50 flex shrink-0 items-center justify-between px-6 pt-6 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white p-1 shadow-sm"><img src="/stage-logo.png" alt="" className="h-full w-full object-contain" /></span>
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
            <div className="absolute right-0 mt-2 w-32 overflow-hidden rounded-xl border border-white/20 bg-[#172c43]/95 p-1.5 shadow-xl backdrop-blur-xl z-50">
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
      <div className="mobile-auth-headline relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-end px-6 pb-6 text-left">
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
        className="mobile-auth-card relative z-20 mx-auto flex w-full max-w-md shrink-0 flex-col rounded-t-[2.4rem] border-x border-t border-white/25 bg-[linear-gradient(to_bottom,rgba(255,255,255,.16),rgba(23,44,67,.8))] px-6 pb-10 pt-4 shadow-[0_-12px_45px_rgba(0,0,0,0.35)] backdrop-blur-3xl ring-1 ring-inset ring-white/20"
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
            ref={emailTriggerRef}
            onClick={openEmailSheet}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#126769] py-4 text-sm font-bold text-white shadow-lg shadow-[#126769]/35 transition hover:bg-[#0d5052] active:scale-[0.98] border border-teal-400/30"
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
            href="https://stagelaboratories.com/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline underline-offset-2 hover:text-teal-200"
          >
            {t.terms}
          </a>
          {t.and}
          <a
            href="https://stagelaboratories.com/security"
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
            onClick={closeEmailSheet}
          >
            <motion.div
              ref={emailDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="email-auth-heading"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative max-h-[92dvh] w-full max-w-md touch-pan-y overflow-y-auto overscroll-contain rounded-t-[2.6rem] border-t border-x border-white/30 bg-[#172c43]/95 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white shadow-[0_-16px_50px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Apple-style pill indicator & Close button */}
              <div className="flex items-center justify-between pb-2">
                <div className="h-1 w-10 rounded-full bg-white/30" />
                <button
                  type="button"
                  id="email-sheet-close-btn"
                  ref={emailCloseRef}
                  onClick={closeEmailSheet}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/25 hover:text-white"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Brand Graphic */}
              <div className="mt-3 flex items-center gap-3.5">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#126769] p-2 shadow-lg shadow-[#126769]/40 border border-teal-400/30">
                  <img src="/stage-logo.png" alt="" className="h-9 w-9 rounded-md bg-white p-1 object-contain" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-200">
                    <CheckCircle2 size={11} /> CEO Copilot
                  </span>
                  <p className="mt-1 text-xs text-white/70">Stage AI Labs LLC</p>
                </div>
              </div>

              {/* The email form stays gated until Turnstile returns a usable token. */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={emailStage === 'captcha' ? 'captcha' : `form-${tab}`}
                  initial={{ opacity: 0, transform: 'translateY(4px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, transform: 'translateY(-4px)' }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="mt-4"
                >
                  <h2 id="email-auth-heading" ref={captchaHeadingRef} tabIndex={-1} className="font-display text-2xl font-black tracking-tight text-white">
                    {emailStage === 'captcha'
                      ? t.form.captchaGateTitle
                      : tab === 'signup' ? t.form.titleSignup : t.form.titleSignin}
                  </h2>
                  {emailStage === 'captcha' && (
                    <p className="mt-2 max-w-sm text-sm leading-5 text-white/75">
                      {t.form.captchaGateDescription}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {turnstileSiteKey ? (
                <div
                  ref={captchaContainerRef}
                  aria-hidden={emailStage === 'form'}
                  className={`relative mt-5 ${emailStage === 'form' ? 'pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0' : ''}`}
                >
                  <AuthTurnstile
                    key={captchaAttempt}
                    layout="mobile"
                    siteKey={turnstileSiteKey}
                    appearance="always"
                    onTokenChange={updateCaptchaToken}
                    label={t.form.captchaLabel}
                    checkingLabel={t.form.captchaChecking}
                    verifiedLabel={t.form.captchaVerified}
                    loadError={t.form.captchaError}
                  />
                </div>
              ) : (
                <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-sm text-red-100">
                  {t.form.captchaUnavailable}
                </p>
              )}

              {error && (
                <div role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 p-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              {notice && (
                <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/20 p-3 text-xs text-emerald-200">
                  {notice}
                </div>
              )}

              {emailStage === 'form' && (
                <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3.5">
                <AnimatePresence>
                  {tab === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label htmlFor="mobile-auth-name" className="mb-1 block text-xs font-semibold text-white/80">
                        {t.form.nameLabel}
                      </label>
                      <input
                        id="mobile-auth-name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.form.namePlaceholder}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/30 outline-none backdrop-blur-md transition focus:border-teal-400 focus:bg-white/15"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="mobile-auth-email" className="mb-1 block text-xs font-semibold text-white/80">
                    {t.form.emailLabel}
                  </label>
                  <input
                    id="mobile-auth-email"
                    type="email"
                    ref={emailFieldRef}
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.form.emailPlaceholder}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/30 outline-none backdrop-blur-md transition focus:border-teal-400 focus:bg-white/15"
                  />
                </div>

                <div>
                  <label htmlFor="mobile-auth-password" className="mb-1 block text-xs font-semibold text-white/80">
                    {t.form.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="mobile-auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                      required
                      minLength={tab === 'signup' ? 12 : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.form.passwordPlaceholder}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-10 text-base text-white placeholder-white/30 outline-none backdrop-blur-md transition focus:border-teal-400 focus:bg-white/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t.form.hidePassword : t.form.showPassword}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !captchaToken}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#126769] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#126769]/35 transition hover:bg-[#0d5052] active:scale-[0.98] disabled:opacity-50 border border-teal-400/30"
                >
                  {loading ? t.form.processing : tab === 'signup' ? t.form.submitSignup : t.form.submitSignin}
                  <ArrowRight size={16} />
                </button>
                </form>
              )}

              {/* Switch tab in sheet */}
              {emailStage === 'form' && <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setTab(tab === 'signup' ? 'signin' : 'signup')}
                  className="text-xs font-semibold text-teal-300 hover:underline"
                >
                  {tab === 'signup'
                    ? '¿Ya tienes una cuenta? Iniciar sesión'
                    : '¿No tienes cuenta? Crear una'}
                </button>
              </div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
