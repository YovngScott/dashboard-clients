import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { LANDING_URL, STAGE_PLANS } from '@/lib/product-data';
import { openStageCheckout } from '@/lib/paddle';

interface UpgradeModalProps { isOpen: boolean; onClose: () => void; initialPlan?: PlanId }
type PlanId = (typeof STAGE_PLANS)[number]['id'];

export function UpgradeModal({ isOpen, onClose, initialPlan = 'pulse' }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const selected = STAGE_PLANS.find((plan) => plan.id === selectedPlan) ?? STAGE_PLANS[1];

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
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
      await openStageCheckout(selected.id);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'No se pudo abrir el checkout. Intenta de nuevo.');
    } finally {
      setIsOpeningCheckout(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#07131f]/80 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="upgrade-title" className="relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-[#f7f6f1] text-[#172c43] shadow-[0_28px_90px_rgba(2,15,23,.38)] sm:rounded-2xl">
        <div className="border-b border-[#172c43]/10 px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
          <button ref={closeRef} type="button" onClick={onClose} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl text-[#172c43]/60 transition-colors hover:bg-[#172c43]/5 hover:text-[#172c43]" aria-label="Cerrar planes"><X size={20} /></button>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#126769]"><ShieldCheck size={17} /> Capacidad clara. Sin cargos sorpresa.</div>
          <h2 id="upgrade-title" className="mt-3 max-w-xl font-display text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">Elige cuánto quieres delegar.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#172c43]/65 sm:text-base">Los mismos planes y límites publicados por Stage AI Labs. Si alcanzas un límite, la operación entra en pausa controlada y tú decides cómo continuar.</p>
        </div>

        <div className="px-5 py-5 sm:px-8">
          <div role="tablist" aria-label="Planes de Stage AI Labs" className="grid grid-cols-3 gap-2 rounded-2xl bg-[#e8f1ee] p-1.5">
            {STAGE_PLANS.map((plan) => (
              <button key={plan.id} type="button" role="tab" aria-selected={selectedPlan === plan.id} onClick={() => setSelectedPlan(plan.id)} className={`min-h-12 rounded-xl px-2 text-sm font-bold transition-[background-color,color,box-shadow,transform] duration-200 ${selectedPlan === plan.id ? 'bg-[#172c43] text-white shadow-lg' : 'text-[#172c43]/60 hover:text-[#172c43]'}`}>{plan.name}</button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-[#172c43] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#9fd6cb]">{selected.audience}</p><h3 className="mt-1 font-display text-3xl font-extrabold">{selected.name}</h3></div>
              <p className="font-display text-4xl font-extrabold tabular-nums">${selected.price}<span className="ml-1 text-sm font-medium text-white/55">/ mes</span></p>
            </div>
            <p className="mt-4 max-w-lg leading-6 text-white/70">{selected.summary}</p>
            <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              {[['Canales', selected.channels], ['Contactos', selected.capacity], ['Alcance', selected.emailLimit], ['Equipo', selected.seats], ['Usuario extra', selected.extraSeat]].map(([label, value]) => (
                <div key={label} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-[#8bd8c8]" /><div><dt className="text-white/45">{label}</dt><dd className="font-semibold text-white/90">{value}</dd></div></div>
              ))}
            </dl>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button type="button" disabled={isOpeningCheckout} onClick={handleCheckout} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#126769] px-5 font-bold text-white transition-[background-color,transform] hover:bg-[#0d5557] disabled:cursor-wait disabled:opacity-65">
              {isOpeningCheckout ? <><LoaderCircle className="animate-spin" size={17} /> Preparando pago seguro</> : <>Continuar al pago <ArrowUpRight size={17} /></>}
            </button>
            <a href={`${LANDING_URL}/contact?plan=${selected.id}`} className="flex min-h-12 items-center justify-center rounded-xl border border-[#172c43]/15 px-5 font-semibold text-[#172c43] hover:bg-[#172c43]/5">Hablar con Stage</a>
          </div>
          <p aria-live="polite" className={`mt-4 text-center text-xs leading-5 ${checkoutError ? 'font-semibold text-red-700' : 'text-[#172c43]/50'}`}>{checkoutError ?? 'El cobro se procesa de forma segura en Paddle. Tu acceso se activa al confirmar el pago.'}</p>
        </div>
      </section>
    </div>
  );
}
