import { supabase } from '@/lib/supabase';

export type StagePlanId = 'launch' | 'pulse' | 'infinity';

type PaddleEvent = { name?: string; data?: unknown };
type PaddleInstance = {
  Environment: { set: (environment: 'sandbox') => void };
  Initialize: (options: { token: string; eventCallback?: (event: PaddleEvent) => void }) => void;
  Checkout: {
    open: (options: {
      transactionId: string;
      customer?: { email: string };
      settings?: { displayMode: 'overlay'; theme: 'light' | 'dark' };
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
    __stagePaddleToken?: string;
  }
}

const PADDLE_SCRIPT_ID = 'stage-paddle-js';
const paddleToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.trim();
const paddleEnvironment = import.meta.env.VITE_PADDLE_ENVIRONMENT?.trim();

export const isPaddleConfigured = Boolean(paddleToken);

function loadPaddleScript(): Promise<PaddleInstance> {
  if (window.Paddle) return Promise.resolve(window.Paddle);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(PADDLE_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const onLoad = () => window.Paddle
      ? resolve(window.Paddle)
      : reject(new Error('Paddle no se cargó correctamente.'));
    const onError = () => reject(new Error('No se pudo cargar el checkout seguro de Paddle.'));

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (!existing) {
      script.id = PADDLE_SCRIPT_ID;
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

async function initializePaddle(): Promise<PaddleInstance> {
  if (!paddleToken) throw new Error('Falta el token público de Paddle en esta aplicación.');

  const paddle = await loadPaddleScript();
  if (window.__stagePaddleToken === paddleToken) return paddle;

  if (paddleEnvironment === 'sandbox') paddle.Environment.set('sandbox');
  paddle.Initialize({
    token: paddleToken,
    eventCallback: (event) => {
      if (event.name === 'checkout.completed') {
        window.dispatchEvent(new CustomEvent('stage:paddle-checkout-completed', { detail: event.data }));
      }
    },
  });
  window.__stagePaddleToken = paddleToken;
  return paddle;
}

/**
 * Paddle's client-side token and price IDs are safe for the browser. The webhook,
 * not this client callback, is the authority that grants a subscription.
 */
export async function openStageCheckout(planId: StagePlanId): Promise<void> {
  if (!isPaddleConfigured) {
    throw new Error('El checkout aún no está configurado. Intenta de nuevo en unos minutos.');
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || !data.user.email) {
    throw new Error('Inicia sesión antes de continuar al pago.');
  }

  const { data: checkout, error: checkoutError } = await supabase.functions.invoke('paddle-checkout', {
    body: { planId },
  });
  if (checkoutError || !checkout?.transactionId || typeof checkout.transactionId !== 'string') {
    throw new Error('No pudimos preparar el pago. Intenta de nuevo o contacta a Stage AI Labs.');
  }

  const paddle = await initializePaddle();
  paddle.Checkout.open({
    transactionId: checkout.transactionId,
    customer: { email: data.user.email },
    settings: { displayMode: 'overlay', theme: 'light' },
  });
}
