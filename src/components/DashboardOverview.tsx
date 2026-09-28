import {
  ArrowRight,
  Bot,
  Check,
  CircleDashed,
  Inbox,
  Instagram,
  MessageCircleMore,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Workflow,
  UsersRound,
} from 'lucide-react';
import type { Profile } from '../types';

interface DashboardOverviewProps {
  profile: Profile;
  onCreateAgent: () => void;
  onOpenChannels: () => void;
  onOpenInbox: () => void;
}

const starters = [
  {
    icon: MessageCircleMore,
    channels: 'Instagram · TikTok',
    title: 'Dar la bienvenida a nuevos seguidores',
    description: 'Prepara un primer mensaje útil para quienes comienzan a seguir tu marca.',
  },
  {
    icon: MessageSquareText,
    channels: 'Instagram · TikTok',
    title: 'Responder comentarios por palabras clave',
    description: 'Si un comentario incluye palabras que definas, prepara una respuesta pública o un mensaje de seguimiento.',
  },
  {
    icon: Instagram,
    channels: 'Instagram',
    title: 'Atender respuestas a historias',
    description: 'Continúa la conversación con el contexto de tu negocio y reglas de atención.',
  },
  {
    icon: Sparkles,
    channels: 'Todos los canales conectados',
    title: 'Asistente con IA y contexto del negocio',
    description: 'Responde dentro de tus instrucciones; reconoce límites y deriva cuando haga falta.',
  },
  {
    icon: Workflow,
    channels: 'Todos los canales conectados',
    title: 'Pasar la conversación a tu equipo',
    description: 'Define cuándo pausar la automatización para que una persona tome el control.',
  },
  {
    icon: UsersRound,
    channels: 'Instagram · WhatsApp · Messenger · Email · más',
    title: 'Unificar la atención multicanal',
    description: 'Organiza conversaciones y contactos en un espacio compartido por tu equipo.',
  },
];

export function DashboardOverview({
  profile,
  onCreateAgent,
  onOpenChannels,
  onOpenInbox,
}: DashboardOverviewProps) {
  const displayName = profile.display_name?.trim() || 'tu equipo';
  const preferredChannel = profile.channel?.trim() || 'Sin elegir';

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,.65fr)]">
        <div className="relative overflow-hidden rounded-2xl bg-[#151720] px-6 py-8 text-white shadow-[0_24px_70px_-52px_rgba(15,23,42,.9)] sm:px-8 sm:py-10">
          <div aria-hidden="true" className="absolute right-[-6rem] top-[-7rem] h-64 w-64 rounded-full bg-violet-500/18 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
              <ShieldCheck size={17} />
              <span>Centro de operaciones</span>
            </div>
            <h1 className="mt-5 max-w-xl text-balance font-display text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">
              Prepara una atención que represente a {displayName}.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/62 sm:text-base sm:leading-7">
              Crea el agente, enséñale cómo funciona tu negocio y revisa sus límites antes de conectar un canal.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCreateAgent}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#151720] transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
              >
                <Sparkles size={17} />
                Crear mi agente
              </button>
              <button
                type="button"
                onClick={onOpenChannels}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
              >
                Revisar canales
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl bg-panel p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-extrabold tracking-[-.02em]">Estado de preparación</h2>
              <p className="mt-1 text-sm text-ink/55">Lo necesario antes de responder.</p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              En curso
            </span>
          </div>
          <ol className="mt-6 space-y-4">
            <StatusItem complete label="Perfil del negocio guardado" />
            <StatusItem complete={false} label="Crear y revisar un agente" />
            <StatusItem complete={false} label={`Autorizar ${preferredChannel}`} />
          </ol>
          <button
            type="button"
            onClick={onCreateAgent}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            Continuar preparación
            <ArrowRight size={16} />
          </button>
        </aside>
      </section>

      <section aria-labelledby="quick-actions-title">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 id="quick-actions-title" className="font-display text-2xl font-extrabold tracking-[-.025em]">Automatizaciones que puedes preparar</h2>
            <p className="mt-1 text-sm text-ink/55">Diseña reglas para los canales de tu plan. Se activarán después de conectar y revisar cada integración.</p>
          </div>
          <button
            type="button"
            onClick={onOpenInbox}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-3 text-sm font-bold text-violet-700 transition-colors duration-150 hover:bg-violet-500/8 dark:text-violet-300 sm:self-auto"
          >
            <Inbox size={17} />
            Ver bandeja
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {starters.map(({ icon: Icon, title, description, channels }) => (
            <button
              key={title}
              type="button"
              onClick={onCreateAgent}
              className="feature-card group flex min-h-48 flex-col items-start rounded-2xl bg-panel p-5 text-left shadow-[0_14px_32px_-28px_rgba(15,23,42,.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Icon size={19} />
              </span>
              <strong className="mt-6 block text-base font-bold text-ink">{title}</strong>
              <span className="mt-2 block text-sm leading-6 text-ink/52">{description}</span>
              <span className="mt-auto flex w-full items-center justify-between gap-2 pt-5 text-xs font-semibold text-ink/45">
                <span>{channels}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 font-bold text-violet-700 dark:text-violet-300">
                Preparar
                <ArrowRight size={14} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-panel p-5 shadow-[0_16px_42px_-38px_rgba(15,23,42,.5)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
            <Bot size={21} />
          </span>
          <div>
            <h2 className="font-display text-lg font-extrabold">Tu operación aún está en borrador</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
              Stage no responderá mensajes hasta que exista un agente guardado, un canal autorizado y una activación confirmada.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreateAgent}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-bold text-ink/70 transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          Abrir agentes
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}

function StatusItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${complete ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-ink/5 text-ink/35'}`}>
        {complete ? <Check size={15} strokeWidth={2.5} /> : <CircleDashed size={15} />}
      </span>
      <span className={complete ? 'font-semibold text-ink/70' : 'text-ink/52'}>{label}</span>
    </li>
  );
}
