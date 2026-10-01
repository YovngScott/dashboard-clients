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
import type { WorkspaceContext } from '@/lib/workspace';

interface DashboardOverviewProps {
  profile: Profile;
  workspace: WorkspaceContext;
  canCreateAgent: boolean;
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
  workspace,
  canCreateAgent,
  onCreateAgent,
  onOpenChannels,
  onOpenInbox,
}: DashboardOverviewProps) {
  const displayName = workspace.name;
  const preferredChannel = profile.channel?.trim() || 'Sin elegir';

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,.65fr)]">
        <div className="stage-overview-hero relative overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#adc5ff]">
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
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#d7e2ff] px-5 text-sm font-bold text-[#10213e] transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#adc5ff]"
              >
                <Sparkles size={17} />
                {canCreateAgent ? 'Crear mi agente' : 'Ver agentes'}
              </button>
              <button
                type="button"
                onClick={onOpenChannels}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/[.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#adc5ff]"
              >
                Revisar canales
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>

        <aside className="stage-overview-status rounded-2xl p-6">
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
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#a9c3ff] px-4 text-sm font-bold text-[#10213e] transition-transform duration-150 active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#adc5ff]"
          >
            {canCreateAgent ? 'Continuar preparación' : 'Ver preparación'}
            <ArrowRight size={16} />
          </button>
        </aside>
      </section>

      {canCreateAgent && <section aria-labelledby="quick-actions-title">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 id="quick-actions-title" className="font-display text-2xl font-extrabold tracking-[-.025em]">Automatizaciones que puedes preparar</h2>
            <p className="mt-1 text-sm text-ink/55">Diseña reglas para los canales de tu plan. Se activarán después de conectar y revisar cada integración.</p>
          </div>
          <button
            type="button"
            onClick={onOpenInbox}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-3 text-sm font-bold text-[#adc5ff] transition-colors duration-150 hover:bg-white/5 sm:self-auto"
          >
            <Inbox size={17} />
            Ver bandeja
          </button>
        </div>

        <div className="stage-overview-actions mt-5 overflow-hidden rounded-2xl">
          {starters.map(({ icon: Icon, title, description, channels }, index) => (
            <button
              key={title}
              type="button"
              onClick={onCreateAgent}
              className="stage-overview-action group grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-2 px-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#adc5ff] sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:px-6"
            >
              <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-[#adc5ff]/10 text-[#adc5ff]">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="block min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#adc5ff]/75">{String(index + 1).padStart(2, '0')} / {channels}</span>
                <strong className="mt-1 block text-base font-bold text-ink">{title}</strong>
                <span className="mt-1 block text-sm leading-6 text-ink/60">{description}</span>
              </span>
              <span className="col-start-2 inline-flex items-center gap-1.5 self-center text-xs font-bold text-[#adc5ff] sm:col-start-3 sm:row-start-1">
                Preparar <ArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>}

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
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-bold text-ink/70 transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
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
