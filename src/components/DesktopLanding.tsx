import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, ChevronDown, Eye, EyeOff, Globe, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { GoogleIcon, FacebookIcon } from './SocialIcons';
import { AuthTurnstile } from './AuthTurnstile';
import { getAuthRedirectUrl, supabase } from '@/lib/supabase';
import { authErrorMessage, normalizeEmail, validateDisplayName, validatePassword } from '@/lib/auth-validation';
import { clearRememberedAuthProvider, rememberAuthProvider } from '@/lib/account-identity';
import { clearPendingTeamInvite, pendingTeamInvite } from '@/lib/team-invite-link';
import type { Profile } from '../types';

interface DesktopLandingProps {
  onSuccess: (profile: Profile | null) => void;
}

const copy = {
  ES: {
    title: 'Tu espacio para operar con claridad.',
    description: 'Configura tus agentes, canales y reglas desde un solo lugar.',
    signup: 'Crear cuenta', signin: 'Iniciar sesión',
    invitationContext: 'Te invitaron a colaborar en un espacio de Stage. Crea tu cuenta o inicia sesión y entrarás al panel compartido.',
    invitationSubmit: 'Crear cuenta y entrar',
    dismissInvitation: 'Descartar invitación y continuar por separado',
    name: 'Nombre o marca', namePlaceholder: 'Ej. Estudio Norte',
    email: 'Correo electrónico', emailPlaceholder: 'tu@correo.com',
    password: 'Contraseña', passwordPlaceholder: 'Mínimo 12 caracteres',
    show: 'Mostrar contraseña', hide: 'Ocultar contraseña',
    submitSignup: 'Crear mi espacio', submitSignin: 'Entrar a mi espacio',
    processing: 'Procesando...', other: 'O continúa con',
    captcha: 'Verificación de seguridad de Cloudflare',
    checking: 'La comprobación se ejecuta en segundo plano; solo verás un reto si hace falta.',
    verified: 'Verificación completada. Ya puedes continuar.',
    captchaError: 'No se pudo cargar la verificación. Recarga la página e inténtalo de nuevo.',
    captchaRequired: 'Completa la verificación de seguridad para continuar.',
    notice: 'Cuenta creada. Te enviamos un enlace de confirmación. Revisa también spam o promociones.',
    privacy: 'Política de Privacidad', security: 'Seguridad',
    legalStart: 'Consulta la ', legalMiddle: ' y el centro de ', legalEnd: '.',
  },
  EN: {
    title: 'Your space to operate with clarity.',
    description: 'Set up your agents, channels, and rules in one place.',
    signup: 'Create account', signin: 'Sign in',
    invitationContext: 'You were invited to a Stage workspace. Create an account or sign in to open the shared dashboard.',
    invitationSubmit: 'Create account and join',
    dismissInvitation: 'Dismiss invitation and continue separately',
    name: 'Name or brand', namePlaceholder: 'e.g. North Studio',
    email: 'Email address', emailPlaceholder: 'you@email.com',
    password: 'Password', passwordPlaceholder: 'At least 12 characters',
    show: 'Show password', hide: 'Hide password',
    submitSignup: 'Create my space', submitSignin: 'Enter my space',
    processing: 'Processing...', other: 'Or continue with',
    captcha: 'Cloudflare security verification',
    checking: 'Verification runs in the background; you will only see a challenge if needed.',
    verified: 'Verification complete. You can continue.',
    captchaError: 'Security verification could not load. Reload the page and try again.',
    captchaRequired: 'Complete the security verification to continue.',
    notice: 'Account created. We sent you a confirmation link. Also check spam or promotions.',
    privacy: 'Privacy Policy', security: 'Security Center',
    legalStart: 'See the Stage AI Labs ', legalMiddle: ' and ', legalEnd: '.',
  },
  PT: {
    title: 'Seu espaço para operar com clareza.',
    description: 'Configure agentes, canais e regras em um só lugar.',
    signup: 'Criar conta', signin: 'Entrar',
    invitationContext: 'Você foi convidado para um espaço Stage. Crie uma conta ou entre para acessar o painel compartilhado.',
    invitationSubmit: 'Criar conta e entrar',
    dismissInvitation: 'Dispensar convite e continuar separadamente',
    name: 'Nome ou marca', namePlaceholder: 'Ex. Estúdio Norte',
    email: 'E-mail', emailPlaceholder: 'seu@email.com',
    password: 'Senha', passwordPlaceholder: 'Mínimo 12 caracteres',
    show: 'Mostrar senha', hide: 'Ocultar senha',
    submitSignup: 'Criar meu espaço', submitSignin: 'Entrar no meu espaço',
    processing: 'Processando...', other: 'Ou continue com',
    captcha: 'Verificação de segurança da Cloudflare',
    checking: 'A verificação acontece em segundo plano; um desafio só aparecerá se necessário.',
    verified: 'Verificação concluída. Você já pode continuar.',
    captchaError: 'Não foi possível carregar a verificação. Atualize a página e tente novamente.',
    captchaRequired: 'Conclua a verificação de segurança para continuar.',
    notice: 'Conta criada. Enviamos um link de confirmação. Verifique também spam ou promoções.',
    privacy: 'Política de Privacidade', security: 'Segurança',
    legalStart: 'Consulte a ', legalMiddle: ' e o centro de ', legalEnd: '.',
  },
} as const;

export function DesktopLanding({ onSuccess }: DesktopLandingProps) {
  const [invitationPending, setInvitationPending] = useState(() => Boolean(pendingTeamInvite()));
  const [tab, setTab] = useState<'signup' | 'signin'>('signup');
  const [lang, setLang] = useState<'ES' | 'EN' | 'PT'>('ES');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
  const reduceMotion = useReducedMotion();
  const t = copy[lang];
  const updateCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);

  async function handleSocial(provider: 'google' | 'facebook') {
    if (loading) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      rememberAuthProvider(provider);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getAuthRedirectUrl() },
      });
      if (authError) { clearRememberedAuthProvider(); setError(authErrorMessage(authError.message)); }
    } catch {
      clearRememberedAuthProvider();
      setError('No pudimos iniciar la conexión. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const normalizedEmail = normalizeEmail(email);
    const nameError = tab === 'signup' && !invitationPending ? validateDisplayName(name) : null;
    const passwordError = tab === 'signup' ? validatePassword(password) : null;
    if (nameError || passwordError) {
      setError(nameError ?? passwordError ?? 'Revisa los datos e inténtalo de nuevo.');
      return;
    }
    if (turnstileSiteKey && !captchaToken) {
      setError(t.captchaRequired);
      return;
    }
    setLoading(true);
    try {
      rememberAuthProvider('email');
      const result = tab === 'signup'
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: { display_name: name.trim() || null },
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
        clearRememberedAuthProvider();
        setError(authErrorMessage(result.error.message));
        return;
      }
      if (tab === 'signup' && !result.data.session) {
        setNotice(t.notice);
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
      clearRememberedAuthProvider();
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
    <div className="stage-auth min-h-[100dvh] text-[#e8f1ee]">
      <div className="stage-auth__ambient" aria-hidden="true">
        <span className="stage-auth__orbit stage-auth__orbit--one" />
        <span className="stage-auth__orbit stage-auth__orbit--two" />
        <span className="stage-auth__bar stage-auth__bar--one" />
        <span className="stage-auth__bar stage-auth__bar--two" />
      </div>
      <header className="stage-auth__header">
        <a href="https://stagelaboratories.com/" className="stage-auth__brand" aria-label="Stage AI Labs, ir al sitio principal">
          <span className="stage-auth__logo"><img src="/stage-logo.png" alt="" /></span>
          <span>Stage AI Labs</span>
        </a>
        <div className="relative">
          <button type="button" onClick={() => setShowLangMenu((open) => !open)} aria-expanded={showLangMenu} aria-haspopup="true" className="stage-auth__language">
            <Globe size={16} aria-hidden="true" /><span>{lang}</span><ChevronDown size={14} aria-hidden="true" />
          </button>
          {showLangMenu && (
            <div className="stage-auth__languages">
              {(['ES', 'EN', 'PT'] as const).map((language) => (
                <button key={language} type="button" onClick={() => { setLang(language); setShowLangMenu(false); }}>
                  {language === 'ES' ? 'Español' : language === 'EN' ? 'English' : 'Português'}
                  {language === lang && <Check size={14} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <main className="stage-auth__main">
        <section className="stage-auth__story" aria-labelledby="stage-auth-title">
          <div className="stage-auth__emblem" aria-hidden="true"><img src="/stage-logo.png" alt="" /></div>
          <h1 id="stage-auth-title">{t.title}</h1>
          <p>{t.description}</p>
          <span className="stage-auth__signature">Stage AI Labs LLC</span>
        </section>
        <section className="stage-auth__panel" aria-label={tab === 'signup' ? t.signup : t.signin}>
          <div className="stage-auth__tabs" role="group" aria-label="Acceso">
            {(['signup', 'signin'] as const).map((value) => (
              <button key={value} type="button" id={value === 'signup' ? 'desktop-tab-signup' : 'desktop-tab-signin'} onClick={() => { setTab(value); setError(''); setNotice(''); }} aria-pressed={tab === value} className={tab === value ? 'is-active' : ''}>
                {tab === value && <motion.span layoutId="stage-auth-tab" className="stage-auth__tab-indicator" transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.25, bounce: 0.1 }} />}
                <span>{value === 'signup' ? t.signup : t.signin}</span>
              </button>
            ))}
          </div>
          {invitationPending && <div role="status" className="stage-auth__notice stage-auth__notice--invitation"><span>{t.invitationContext}</span><button type="button" aria-label={t.dismissInvitation} title={t.dismissInvitation} onClick={() => { clearPendingTeamInvite(); setInvitationPending(false); setTab('signup'); setError(''); setNotice(''); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-current/75 hover:bg-white/10 hover:text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"><X size={16} /></button></div>}
          <form onSubmit={submit} className="stage-auth__form">
            {tab === 'signup' && !invitationPending && (
              <div className="stage-auth__field">
                <label htmlFor="desktop-auth-name">{t.name}</label>
                <input id="desktop-auth-name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} required placeholder={t.namePlaceholder} />
              </div>
            )}
            <div className="stage-auth__field">
              <label htmlFor="desktop-auth-email">{t.email}</label>
              <input id="desktop-auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder={t.emailPlaceholder} />
            </div>
            <div className="stage-auth__field">
              <label htmlFor="desktop-auth-password">{t.password}</label>
              <div className="stage-auth__password">
                <input id="desktop-auth-password" type={showPassword ? 'text' : 'password'} autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} minLength={tab === 'signup' ? 12 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required placeholder={t.passwordPlaceholder} />
                <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? t.hide : t.show} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {turnstileSiteKey && (
              <AuthTurnstile key={captchaAttempt} layout="desktop" siteKey={turnstileSiteKey} onTokenChange={updateCaptchaToken} label={t.captcha} checkingLabel={t.checking} verifiedLabel={t.verified} loadError={t.captchaError} />
            )}
            {error && <p role="alert" className="stage-auth__error">{error}</p>}
            {notice && <p role="status" className="stage-auth__notice">{notice}</p>}
            <button type="submit" disabled={loading || (Boolean(turnstileSiteKey) && !captchaToken)} className="stage-auth__submit">
              <span>{loading ? t.processing : tab === 'signup' ? invitationPending ? t.invitationSubmit : t.submitSignup : t.submitSignin}</span><ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <div className="stage-auth__divider"><span>{t.other}</span></div>
          <div className="stage-auth__social">
            <button type="button" id="desktop-google-login-btn" onClick={() => handleSocial('google')} disabled={loading}><GoogleIcon className="h-5 w-5" /><span>Google</span></button>
            <button type="button" id="desktop-facebook-login-btn" onClick={() => handleSocial('facebook')} disabled={loading}><FacebookIcon className="h-5 w-5" /><span>Facebook</span></button>
          </div>
          <p className="stage-auth__legal">
            {t.legalStart}<a href="https://stagelaboratories.com/privacidad" target="_blank" rel="noopener noreferrer">{t.privacy}</a>
            {t.legalMiddle}<a href="https://stagelaboratories.com/security" target="_blank" rel="noopener noreferrer">{t.security}</a>{t.legalEnd}
          </p>
        </section>
      </main>
    </div>
  );
}
