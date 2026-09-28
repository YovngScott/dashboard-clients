import {
  ArrowRight,
  ContactRound,
  Filter,
  Inbox,
  MessageSquare,
  Search,
  SlidersHorizontal,
  UserRoundCheck,
  Users,
} from 'lucide-react';

interface AnimatedEmptyStateProps {
  type: 'inbox' | 'contacts';
  onAction: () => void;
}

export function AnimatedEmptyState({ type, onAction }: AnimatedEmptyStateProps) {
  if (type === 'inbox') return <InboxWorkspace onAction={onAction} />;
  return <ContactsWorkspace onAction={onAction} />;
}

function InboxWorkspace({ onAction }: { onAction: () => void }) {
  return (
    <section aria-labelledby="inbox-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 id="inbox-title" className="font-display text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">Bandeja de entrada</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">Un solo lugar para revisar conversaciones, asignarlas y tomar el control cuando el agente necesite ayuda.</p>
        </div>
        <button type="button" onClick={onAction} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:self-auto">
          Conectar canal
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl bg-panel shadow-[0_18px_50px_-40px_rgba(15,23,42,.5)] lg:grid lg:min-h-[620px] lg:grid-cols-[260px_340px_minmax(0,1fr)]">
        <aside className="border-b border-ink/10 p-4 lg:border-b-0 lg:border-r" aria-label="Filtros de bandeja">
          <FilterItem icon={Inbox} label="Todos los chats" count={0} active />
          <FilterItem icon={UserRoundCheck} label="Asignados a mí" count={0} />
          <FilterItem icon={Users} label="Sin asignar" count={0} />
          <div className="my-4 h-px bg-ink/10" />
          <p className="px-3 text-xs font-bold uppercase tracking-[.12em] text-ink/38">Canales</p>
          <p className="mt-3 px-3 text-sm leading-6 text-ink/48">No hay canales autorizados todavía.</p>
        </aside>

        <div className="border-b border-ink/10 lg:border-b-0 lg:border-r">
          <div className="border-b border-ink/10 p-4">
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-canvas px-3 text-ink/45">
              <Search size={17} />
              <span className="sr-only">Buscar conversaciones</span>
              <input disabled placeholder="Buscar conversaciones" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35 disabled:cursor-not-allowed" />
            </label>
          </div>
          <div className="grid min-h-56 place-items-center px-6 py-12 text-center lg:min-h-[540px]">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink/5 text-ink/40"><MessageSquare size={22} /></span>
              <h2 className="mt-4 font-display text-lg font-bold">Sin conversaciones</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/50">Los mensajes aparecerán aquí cuando conectes un canal y tus clientes escriban.</p>
            </div>
          </div>
        </div>

        <div className="hidden place-items-center px-8 text-center lg:grid">
          <div className="max-w-md">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Inbox size={25} /></span>
            <h2 className="mt-5 font-display text-xl font-extrabold">Selecciona una conversación</h2>
            <p className="mt-2 text-sm leading-6 text-ink/50">Aquí verás el historial, la asignación y los controles para responder como equipo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactsWorkspace({ onAction }: { onAction: () => void }) {
  return (
    <section aria-labelledby="contacts-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 id="contacts-title" className="font-display text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">Contactos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">Personas que han iniciado una conversación con tu negocio en un canal autorizado.</p>
        </div>
        <button type="button" onClick={onAction} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:self-auto">
          Conectar canal
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl bg-panel shadow-[0_18px_50px_-40px_rgba(15,23,42,.5)]">
        <div className="flex flex-col gap-3 border-b border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-canvas px-3 text-ink/45 sm:max-w-sm">
            <Search size={17} />
            <span className="sr-only">Buscar contactos</span>
            <input disabled placeholder="Buscar por nombre o canal" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35 disabled:cursor-not-allowed" />
          </label>
          <button type="button" disabled className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 text-sm font-bold text-ink/40 disabled:cursor-not-allowed">
            <Filter size={16} />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/10 text-xs font-bold uppercase tracking-[.1em] text-ink/38">
                <th className="px-5 py-4">Contacto</th>
                <th className="px-5 py-4">Canal</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Última interacción</th>
                <th className="px-5 py-4">Asignación</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="grid min-h-[470px] place-items-center px-6 py-14 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300"><ContactRound size={25} /></span>
            <h2 className="mt-5 font-display text-xl font-extrabold">Aún no hay contactos</h2>
            <p className="mt-2 text-sm leading-6 text-ink/50">Cuando una persona escriba por un canal conectado, su perfil y la actividad permitida aparecerán en esta tabla.</p>
            <button type="button" onClick={onAction} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-bold text-ink/70 transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
              <SlidersHorizontal size={16} />
              Revisar canales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterItem({ icon: Icon, label, count, active = false }: { icon: typeof Inbox; label: string; count: number; active?: boolean }) {
  return (
    <button type="button" className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 ${active ? 'bg-ink/6 text-ink' : 'text-ink/50 hover:bg-ink/4 hover:text-ink'}`}>
      <Icon size={17} />
      <span className="flex-1">{label}</span>
      <span className="tabular-nums text-xs text-ink/38">{count}</span>
    </button>
  );
}
