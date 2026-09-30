import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

type TurnstileWidgetOptions = {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
  theme: 'light' | 'dark';
  size: 'flexible' | 'compact';
  appearance: 'always' | 'interaction-only';
  language: 'auto';
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileWidgetOptions) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error('Turnstile did not initialize.'));
      };
      script.onerror = () => {
        script.remove();
        turnstileScriptPromise = undefined;
        reject(new Error('Turnstile could not load.'));
      };
      document.head.appendChild(script);
    });
  }
  return turnstileScriptPromise;
}

interface AuthTurnstileProps {
  layout: 'mobile' | 'desktop';
  siteKey: string;
  onTokenChange: (token: string) => void;
  label: string;
  checkingLabel: string;
  verifiedLabel: string;
  loadError: string;
  appearance?: TurnstileWidgetOptions['appearance'];
}

export function AuthTurnstile({ layout, siteKey, onTokenChange, label, checkingLabel, verifiedLabel, loadError, appearance = 'interaction-only' }: AuthTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>();
  const [hasError, setHasError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => setIsDesktopLayout(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const isActive = layout === 'desktop' ? isDesktopLayout : !isDesktopLayout;

  useEffect(() => {
    if (!isActive) return;
    let active = true;
    let api: TurnstileApi | undefined;

    loadTurnstileScript()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;
        api = turnstile;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: layout === 'mobile' ? 'compact' : 'flexible',
          appearance,
          callback: (token) => {
            if (active) {
              setHasError(false);
              setIsVerified(true);
              onTokenChange(token);
            }
          },
          'expired-callback': () => {
            if (active) {
              setIsVerified(false);
              onTokenChange('');
            }
          },
          'error-callback': () => {
            if (active) {
              setIsVerified(false);
              onTokenChange('');
              setHasError(true);
            }
          },
          theme: 'dark',
          language: 'auto',
        });
      })
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
      onTokenChange('');
      if (api && widgetIdRef.current) api.remove(widgetIdRef.current);
      widgetIdRef.current = undefined;
    };
  }, [appearance, isActive, layout, siteKey, onTokenChange]);

  return (
    <div
      className="px-1 py-1 text-white"
      role="group"
      aria-label={label}
    >
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck aria-hidden="true" size={15} className="text-teal-300" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="flex min-h-10 w-full justify-center overflow-hidden">
        <div ref={containerRef} className="w-full max-w-full" />
      </div>
      <p
        role="status"
        aria-live="polite"
        className={`mt-1 flex items-start gap-1.5 text-xs leading-4 ${hasError
          ? 'text-red-200'
          : isVerified
            ? 'text-teal-200'
            : 'text-white/70'
        }`}
      >
        {isVerified && !hasError && <CheckCircle2 aria-hidden="true" size={13} className="mt-0.5 shrink-0" />}
        <span>{hasError ? loadError : isVerified ? verifiedLabel : checkingLabel}</span>
      </p>
    </div>
  );
}
