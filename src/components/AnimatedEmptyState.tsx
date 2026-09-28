import { ArrowRight, ContactRound, Inbox, MessageSquareText, SlidersHorizontal } from 'lucide-react';

interface AnimatedEmptyStateProps {
  type: 'inbox' | 'contacts';
  onAction: () => void;
}

export function AnimatedEmptyState({ type, onAction }: AnimatedEmptyStateProps) {
  const isInbox = type === 'inbox';
  const Icon = isInbox ? Inbox : ContactRound;

  return (
    <section aria-labelledby={`${type}-title`} className="animate-rise">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 id={`${type}-title`} className="font-display text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">{isInbox ? 'Bandeja de entrada' : 'Contactos'}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">
            {isInbox
              ? 'Un solo lugar para revisar conversaciones, asignarlas y tomar el control cuando el agente necesite ayuda.'
              : 'Aquí aparecerán las personas que inicien una conversación con tu negocio por un canal conectado.'}
          </p>
        </div>
        <button type="button" onClick={onAction} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:self-auto">
          Conectar canal
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-7 grid min-h-[min(62vh,560px)] place-items-center rounded-2xl border border-ink/8 bg-panel px-6 py-14 text-center shadow-[0_18px_50px_-40px_rgba(15,23,42,.4)]">
        <div className="max-w-md">
          <div className="empty-state-mark relative mx-auto grid h-20 w-20 place-items-center rounded-[22px] bg-violet-500/8 text-violet-600 dark:text-violet-300">
            <span aria-hidden="true" className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-teal-400 ring-4 ring-panel" />
            <Icon size={31} strokeWidth={1.7} />
            <span aria-hidden="true" className="absolute -bottom-1 -left-1 grid h-8 w-8 place-items-center rounded-xl bg-panel text-teal-600 shadow-sm dark:text-teal-300">
              {isInbox ? <MessageSquareText size={16} /> : <SlidersHorizontal size={15} />}
            </span>
          </div>
          <h2 className="mt-6 font-display text-xl font-extrabold">{isInbox ? 'Tu bandeja está lista para recibir conversaciones' : 'Tu lista de contactos empezará aquí'}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/52">
            {isInbox
              ? 'Cuando autorices un canal y alguien escriba a tu negocio, la conversación aparecerá aquí. No hay mensajes de muestra.'
              : 'Los contactos se crearán a partir de las conversaciones de los canales que autorices. Tus datos seguirán separados de los de otros negocios.'}
          </p>
          <button type="button" onClick={onAction} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-bold text-ink/70 transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
            <SlidersHorizontal size={16} />
            Revisar canales
          </button>
        </div>
      </div>
    </section>
  );
}
