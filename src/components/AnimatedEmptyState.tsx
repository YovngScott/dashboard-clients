import { useState } from 'react';
import {
  Inbox,
  Users,
  Sparkles,
  ArrowRight,
  Heart,
  UserPlus,
  Radio,
  Instagram,
} from 'lucide-react';

interface AnimatedEmptyStateProps {
  type: 'inbox' | 'contacts';
  onAction?: () => void;
}

export function AnimatedEmptyState({ type, onAction }: AnimatedEmptyStateProps) {
  const [simulatedItem, setSimulatedItem] = useState<boolean>(false);

  if (type === 'inbox') {
    return (
      <div className="relative mx-auto flex min-h-[calc(100vh-210px)] max-w-lg flex-col items-center justify-center px-4 py-8 text-center animate-rise">
        {/* Main Animated Visual Hub */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Sonar Radar Wave 1 */}
          <div className="pointer-events-none absolute h-36 w-36 rounded-[2.5rem] bg-teal-400/15" />
          {/* Sonar Radar Wave 2 (delayed) */}
          <div className="pointer-events-none absolute h-48 w-48 rounded-[3rem] border border-teal-500/15" />

          {/* Floating Central Icon Badge matching user's reference image */}
          <div
            id="inbox-animated-badge"
            className="relative z-10 grid h-28 w-28 place-items-center rounded-[2.2rem] bg-[#e6f7f5] shadow-lg shadow-teal-700/10 transition-transform duration-300 motion-safe:hover:scale-[1.03] dark:bg-teal-950/50 dark:shadow-teal-900/30"
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-tr from-teal-500/10 to-transparent" />
            <Inbox size={46} className="text-[#00897b] dark:text-teal-400 stroke-[2.2]" />

            {/* Micro Live Signal Beacon */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-canvas bg-emerald-500" />
            </span>
          </div>

          {/* Floating Element 1: Typing Bubble (Top Right) */}
          <div className="absolute -top-4 -right-12 z-20 hidden items-center gap-1.5 rounded-full border border-teal-200/60 bg-panel/90 px-3 py-1.5 shadow-md backdrop-blur-md sm:flex dark:border-teal-800/60">
            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">Nuevo mensaje</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500/40" />
            </div>
          </div>

          {/* Floating Element 2: Heart / DM Pill (Bottom Left) */}
          <div className="absolute -bottom-3 -left-10 z-20 hidden items-center gap-1.5 rounded-full border border-pink-200/60 bg-panel/90 px-3 py-1.5 shadow-md backdrop-blur-md sm:flex dark:border-pink-900/60">
            <Heart size={13} className="fill-pink-500 text-pink-500" />
            <span className="text-[11px] font-semibold text-ink/70">Instagram DM</span>
          </div>
        </div>

        {/* Title matching user's image font and layout */}
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#101828] dark:text-white">
          Inbox
        </h1>

        {/* Live Status Pill */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Radio size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>Escaneando canales en tiempo real</span>
        </div>

        {/* Description */}
        <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-ink/55 dark:text-ink/65">
          Todas tus conversaciones de Instagram, Messenger y TikTok aparecerán aquí automáticamente en cuanto un seguidor te escriba.
        </p>

        {/* Simulated Incoming DM Interactive Box */}
        {simulatedItem && (
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-teal-500/30 bg-teal-50/70 p-4 text-left shadow-lg backdrop-blur-sm dark:border-teal-800/60 dark:bg-teal-950/40 animate-rise">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 overflow-hidden rounded-full border border-teal-400/40 bg-teal-200">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
                    alt="User"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">@sofia_creators</p>
                  <p className="text-[10px] text-ink/50">hace un momento • Instagram</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                Nuevo DM
              </span>
            </div>
            <p className="mt-2.5 text-xs text-ink/80">
              "¡Hola! Me encantó tu última publicación 🙌 ¿Cómo puedo conseguir la plantilla?"
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-teal-200/50 pt-2.5 dark:border-teal-800/40">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Respuesta automática enviada ✓
              </span>
              <button
                onClick={() => setSimulatedItem(false)}
                className="text-[11px] font-medium text-ink/40 hover:text-ink underline"
              >
                Limpiar prueba
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onAction}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-600/20 transition hover:bg-purple-500 hover:shadow-lg active:scale-95"
          >
            <span>Conectar otro canal</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => setSimulatedItem(!simulatedItem)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-panel px-4 py-3 text-xs font-semibold text-ink/70 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>{simulatedItem ? 'Ocultar demo' : 'Probar llegada de DM'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Contacts Animated View
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-210px)] max-w-lg flex-col items-center justify-center px-4 py-8 text-center animate-rise">
      {/* Main Animated Visual Hub */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Network Connection Ring (Dashed Orbit) */}
        <div className="pointer-events-none absolute h-44 w-44 rounded-full border-2 border-dashed border-teal-500/25" />

        {/* Orbiting Avatar 1 */}
        <div className="pointer-events-none absolute h-36 w-36 -rotate-12">
          <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-white shadow-md bg-purple-100">
            <span className="grid h-full w-full place-items-center text-[10px] font-bold text-purple-800">AM</span>
          </div>
        </div>

        {/* Orbiting Avatar 2 */}
        <div className="pointer-events-none absolute h-36 w-36 rotate-[108deg]">
          <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-white shadow-md bg-amber-100">
            <span className="grid h-full w-full place-items-center text-[10px] font-bold text-amber-800">JR</span>
          </div>
        </div>

        {/* Orbiting Avatar 3 */}
        <div className="pointer-events-none absolute h-36 w-36 rotate-[228deg]">
          <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-white shadow-md bg-pink-100">
            <span className="grid h-full w-full place-items-center text-[10px] font-bold text-pink-800">LC</span>
          </div>
        </div>

        {/* Floating Central Icon Badge matching user's reference image */}
        <div
          id="contacts-animated-badge"
          className="relative z-10 grid h-28 w-28 place-items-center rounded-[2.2rem] bg-[#e6f7f5] shadow-lg shadow-teal-700/10 transition-transform duration-300 motion-safe:hover:scale-[1.03] dark:bg-teal-950/50 dark:shadow-teal-900/30"
        >
          {/* Ambient inner glow */}
          <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-tr from-teal-500/10 to-transparent" />
          <Users size={46} className="text-[#00897b] dark:text-teal-400 stroke-[2.2]" />

          {/* Micro Live Signal Beacon */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-canvas bg-[#00897b]" />
          </span>
        </div>

        {/* Floating Community Badge (Top Left) */}
        <div className="absolute -top-3 -left-12 z-20 hidden items-center gap-1.5 rounded-full border border-teal-200/60 bg-panel/90 px-3 py-1.5 shadow-md backdrop-blur-md sm:flex dark:border-teal-800/60">
          <UserPlus size={13} className="text-teal-600 dark:text-teal-400" />
          <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">+1 Lead</span>
        </div>

        {/* Floating Audience Pill (Bottom Right) */}
        <div className="absolute -bottom-3 -right-10 z-20 hidden items-center gap-1.5 rounded-full border border-purple-200/60 bg-panel/90 px-3 py-1.5 shadow-md backdrop-blur-md sm:flex dark:border-purple-900/60">
          <Instagram size={13} className="text-pink-500" />
          <span className="text-[11px] font-semibold text-ink/70">Comunidad</span>
        </div>
      </div>

      {/* Title matching user's image font and layout */}
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#101828] dark:text-white">
        Contacts
      </h1>

      {/* Live Status Pill */}
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
        <Radio size={13} className="text-teal-600 dark:text-teal-400" />
        <span>Sincronizando comunidad y leads en vivo</span>
      </div>

      {/* Description */}
      <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-ink/55 dark:text-ink/65">
        Tus contactos y nuevos leads se guardarán aquí automáticamente tan pronto como interactúen con tus historias, comentarios o mensajes directos.
      </p>

      {/* Simulated Incoming Contact Interactive Box */}
      {simulatedItem && (
        <div className="mt-6 w-full max-w-sm rounded-2xl border border-teal-500/30 bg-teal-50/70 p-4 text-left shadow-lg backdrop-blur-sm dark:border-teal-800/60 dark:bg-teal-950/40 animate-rise">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-teal-400/40 bg-teal-200">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
                  alt="Contact"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">@mateo_marketing</p>
                <p className="text-[10px] text-ink/50">Nuevo seguidor • Lead activo</p>
              </div>
            </div>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
              Capturado ✓
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-teal-200/50 pt-2.5 text-xs text-ink/70 dark:border-teal-800/40">
            <span>Interacción: Comentario en Reel</span>
            <button
              onClick={() => setSimulatedItem(false)}
              className="text-[11px] font-medium text-ink/40 hover:text-ink underline"
            >
              Limpiar prueba
            </button>
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onAction}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-600/20 transition hover:bg-purple-500 hover:shadow-lg active:scale-95"
        >
          <span>Importar contactos</span>
          <ArrowRight size={16} />
        </button>

        <button
          onClick={() => setSimulatedItem(!simulatedItem)}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-panel px-4 py-3 text-xs font-semibold text-ink/70 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <Sparkles size={14} className="text-amber-500" />
          <span>{simulatedItem ? 'Ocultar demo' : 'Simular nuevo contacto'}</span>
        </button>
      </div>
    </div>
  );
}
