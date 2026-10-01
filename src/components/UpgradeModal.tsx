import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { LANDING_URL, STAGE_PLANS, type BillingCycle } from '@/lib/product-data';
import { openStageCheckout } from '@/lib/paddle';

interface UpgradeModalProps { isOpen: boolean; onClose: () => void; initialPlan?: PlanId; initialBilling?: BillingCycle }
type PlanId = (typeof STAGE_PLANS)[number]['id'];

export function UpgradeModal({ isOpen, onClose, initialPlan = 'pulse', initialBilling = 'annual' }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBilling);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const selected = STAGE_PLANS.find((plan) => plan.id === selectedPlan) ?? STAGE_PLANS[1];
  const annual = billingCycle === 'annual';
  const equivalent = (selected.annualPrice / 12).toFixed(2);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCheckout() {
    setCheckoutError(null);
    setIsOpeningCheckout(true);
    try {
      await openStageCheckout(selected.id, billingCycle);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'No se pudo abrir el checkout. Intenta de nuevo.');
    } finally {
      setIsOpeningCheckout(false);
    }
  }

  return (
    <div className="stage-upgrade-overlay fixed inset-0 z-50 flex items-end justify-center bg-[#020711]/85 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="upgrade-title" className="stage-upgrade-dialog relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] border border-white/15 bg-[#0c1728] text-[#f4f6fb] shadow-[0_28px_90px_rgba(2,8,20,.7)] sm:rounded-[1.75rem]">
        <div className="border-b border-white/10 px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
          <button ref={closeRef} type="button" onClick={onClose} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl text-white/70 transition-transform duration-150 hover:bg-white/10 hover:text-white" aria-label="Cerrar planes"><X size={20} /></button>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#a8c7ff]"><ShieldCheck size={17} /> Capacidad clara. Sin cargos sorpresa.</div>
          <h2 id="upgrade-title" className="mt-3 max-w-xl font-display text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">Elige cuánto quieres delegar.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Los mismos planes y límites publicados por Stage AI Labs. Si alcanzas un límite, la operación entra en pausa controlada y tú decides cómo continuar.</p>
        </div>

        <div className="px-5 py-5 sm:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white/75">Frecuencia de pago</p>
            <div role="group" className="inline-flex rounded-full border border-white/15 bg-white/[.06] p-1" aria-label="Frecuencia de pago">
              <button type="button" aria-pressed={!annual} onClick={() => setBillingCycle('monthly')} className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-transform duration-150 ${!annual ? 'bg-white text-[#0c1728]' : 'text-white/70 hover:text-white'}`}>Mensual</button>
              <button type="button" aria-pressed={annual} onClick={() => setBillingCycle('annual')} className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-transform duration-150 ${annual ? 'bg-white text-[#0c1728]' : 'text-white/70 hover:text-white'}`}>Anual <span className="ml-1 text-xs">2 meses gratis</span></button>
            </div>
          </div>
          <div role="group" aria-label="Planes de Stage AI Labs" className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-1.5">
            {STAGE_PLANS.map((plan) => (
              <button key={plan.id} type="button" aria-pressed={selectedPlan === plan.id} onClick={() => setSelectedPlan(plan.id)} className={`min-h-12 rounded-xl px-2 text-sm font-bold transition-transform duration-150 ${selectedPlan === plan.id ? 'bg-[#a8c7ff] text-[#071019]' : 'text-white/70 hover:text-white'}`}>{plan.name}</button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/12 bg-white/[.055] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#a8c7ff]">{selected.audience}</p><h3 className="mt-1 font-display text-3xl font-extrabold">{selected.name}</h3></div>
              <div className="text-right"><p className="font-display text-4xl font-extrabold tabular-nums">${annual ? equivalent : selected.price}<span className="ml-1 text-sm font-medium text-white/70">/ mes</span></p><p className="mt-1 text-xs text-white/70">{annual ? `$${selected.annualPrice} facturados al año` : 'Facturado mes a mes'}</p></div>
            </div>
            <p className="mt-4 max-w-lg leading-6 text-white/70">{selected.summary}</p>
            <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              {[['Canales', selected.channels], ['Contactos', selected.capacity], ['Alcance', selected.emailLimit], ['Equipo', selected.seats], ['Usuario extra', annual ? 'Se cotiza según la facturación anual' : selected.extraSeat]].map(([label, value]) => (
                <div key={label} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-[#a8c7ff]" /><div><dt className="text-white/70">{label}</dt><dd className="font-semibold text-white/90">{value}</dd></div></div>
              ))}
            </dl>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button type="button" disabled={isOpeningCheckout} onClick={handleCheckout} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a8c7ff] px-5 font-bold text-[#071019] transition-transform duration-150 hover:bg-[#d4e2ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#adc5ff] disabled:cursor-wait disabled:opacity-65">
              {isOpeningCheckout ? <><LoaderCircle className="animate-spin" size={17} /> Preparando pago seguro</> : <>Continuar al pago <ArrowUpRight size={17} /></>}
            </button>
            <a href={`${LANDING_URL}/contact?plan=${selected.id}`} className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 font-semibold text-white hover:bg-white/10">Hablar con Stage</a>
          </div>
          <p aria-live="polite" className={`mt-4 text-center text-xs leading-5 ${checkoutError ? 'font-semibold text-red-300' : 'text-white/70'}`}>{checkoutError ?? 'El cobro se procesa de forma segura en Paddle. Tu acceso se activa al confirmar el pago.'}</p>
        </div>
      </section>
    </div>
  );
}
