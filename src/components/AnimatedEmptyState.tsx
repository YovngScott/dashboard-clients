import { ArrowRight, ContactRound, Inbox, SlidersHorizontal } from 'lucide-react';

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
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
            {isInbox
              ? 'Un solo lugar para revisar conversaciones, asignarlas y tomar el control cuando el agente necesite ayuda.'
              : 'Aquí aparecerán las personas que inicien una conversación con tu negocio por un canal conectado.'}
          </p>
        </div>
        <button type="button" onClick={onAction} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:self-auto">
          Conectar canal
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="stage-empty-workspace">
        <div className="stage-empty-toolbar"><Icon size={17} aria-hidden="true" /><span>{isInbox ? 'Conversaciones de tus canales' : 'Personas que conversan con tu negocio'}</span></div>
        <div className="stage-empty-content">
          <div className="stage-empty-lens empty-state-mark">
            <Icon size={31} strokeWidth={1.7} />
          </div>
          <div>
          <h2 className="font-display">{isInbox ? 'Tu bandeja está lista para recibir conversaciones' : 'Tu lista de contactos empezará aquí'}</h2>
          <p className="mt-2 max-w-[540px] text-sm leading-6 text-ink/70">
            {isInbox
              ? 'Cuando autorices un canal y alguien escriba a tu negocio, la conversación aparecerá aquí. No hay mensajes de muestra.'
              : 'Los contactos se crearán a partir de las conversaciones de los canales que autorices. Tus datos seguirán separados de los de otros negocios.'}
          </p>
          <button type="button" onClick={onAction} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-bold text-ink/70 transition-transform duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
            <SlidersHorizontal size={16} />
            Revisar canales
          </button>
          </div>
        </div>
        <div className="stage-empty-footer"><SlidersHorizontal size={16} aria-hidden="true" /><span>{isInbox ? 'La autorización de canales se gestiona desde Canales.' : 'Cada contacto conserva el contexto de sus conversaciones.'}</span></div>
      </div>
    </section>
  );
}
