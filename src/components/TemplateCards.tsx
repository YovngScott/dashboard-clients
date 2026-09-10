import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Gift, Instagram, MessageSquare, Sparkles, X, Zap } from 'lucide-react';

interface TemplateCardsProps {
  onSelectFlow?: (title: string) => void;
}

export function TemplateCards({ onSelectFlow }: TemplateCardsProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const createScrollRef = useRef<HTMLDivElement>(null);
  const templateScrollRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (title: string) => {
    setActiveModal(title);
    if (onSelectFlow) onSelectFlow(title);
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-7">
      {/* Section: Create your own (Horizontal Scroll) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">Create your own</h2>
            <p className="text-xs text-ink/50">Desliza para ver más opciones</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollContainer(createScrollRef, 'left')}
              aria-label="Deslizar a la izquierda"
              className="grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-panel text-ink/60 transition hover:bg-zinc-100 hover:text-ink dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => scrollContainer(createScrollRef, 'right')}
              aria-label="Deslizar a la derecha"
              className="grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-panel text-ink/60 transition hover:bg-zinc-100 hover:text-ink dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setActiveModal('Todas las automatizaciones')}
              className="ml-2 flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400"
            >
              View all
            </button>
          </div>
        </div>

        {/* Horizontal Sliding Carousel */}
        <div
          ref={createScrollRef}
          className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {/* Card 1: Comments */}
          <div
            id="card-create-comments"
            onClick={() => handleCardClick('Comments automation')}
            className="group flex w-[260px] sm:w-[280px] shrink-0 snap-start cursor-pointer flex-col justify-between rounded-2xl border border-zinc-200/70 bg-panel p-5 transition hover:border-purple-300 hover:shadow-md dark:border-zinc-800/80 dark:hover:border-purple-800/60"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  POPULAR
                </span>
                <MessageSquare size={16} className="text-ink/30 transition group-hover:text-ink/70" />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">Comments</h3>
              <p className="mt-1 text-xs leading-5 text-ink/60">
                DM a link, ask for follow or emails, reply under post
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink/40">
                <Instagram size={14} className="text-pink-500" />
                <span>Instagram</span>
              </div>
              <ChevronRight size={15} className="text-ink/30 transition group-hover:translate-x-1 group-hover:text-purple-500" />
            </div>
          </div>

          {/* Card 2: New followers */}
          <div
            id="card-create-followers"
            onClick={() => handleCardClick('New followers automation')}
            className="group flex w-[260px] sm:w-[280px] shrink-0 snap-start cursor-pointer flex-col justify-between rounded-2xl border border-zinc-200/70 bg-panel p-5 transition hover:border-purple-300 hover:shadow-md dark:border-zinc-800/80 dark:hover:border-purple-800/60"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  NEW
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">New followers</h3>
              <p className="mt-1 text-xs leading-5 text-ink/60">
                Say hi to new community members and start building your audience
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink/40">
                <Instagram size={14} className="text-pink-500" />
                <span>Instagram</span>
              </div>
              <ChevronRight size={15} className="text-ink/30 transition group-hover:translate-x-1 group-hover:text-purple-500" />
            </div>
          </div>

          {/* Card 3: Story replies */}
          <div
            id="card-create-story"
            onClick={() => handleCardClick('Story replies automation')}
            className="group flex w-[260px] sm:w-[280px] shrink-0 snap-start cursor-pointer flex-col justify-between rounded-2xl border border-zinc-200/70 bg-panel p-5 transition hover:border-purple-300 hover:shadow-md dark:border-zinc-800/80 dark:hover:border-purple-800/60"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  ENGAGE
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">Story replies</h3>
              <p className="mt-1 text-xs leading-5 text-ink/60">
                Auto-DM a resource whenever someone replies to or tags your stories
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink/40">
                <Instagram size={14} className="text-pink-500" />
                <span>Instagram</span>
              </div>
              <ChevronRight size={15} className="text-ink/30 transition group-hover:translate-x-1 group-hover:text-purple-500" />
            </div>
          </div>

          {/* Card 4: Direct messages */}
          <div
            id="card-create-dms"
            onClick={() => handleCardClick('Direct Messages flow')}
            className="group flex w-[260px] sm:w-[280px] shrink-0 snap-start cursor-pointer flex-col justify-between rounded-2xl border border-zinc-200/70 bg-panel p-5 transition hover:border-purple-300 hover:shadow-md dark:border-zinc-800/80 dark:hover:border-purple-800/60"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  INSTANT
                </span>
                <Zap size={16} className="text-ink/30 transition group-hover:text-ink/70" />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">Direct Messages</h3>
              <p className="mt-1 text-xs leading-5 text-ink/60">
                Trigger intelligent automated conversation flows right from DM inbox
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink/40">
                <Instagram size={14} className="text-pink-500" />
                <span>Instagram</span>
              </div>
              <ChevronRight size={15} className="text-ink/30 transition group-hover:translate-x-1 group-hover:text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Use a template (Horizontal Scroll) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">Use a template</h2>
            <p className="text-xs text-ink/50">Desliza para explorar plantillas listas para usar</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollContainer(templateScrollRef, 'left')}
              aria-label="Deslizar a la izquierda"
              className="grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-panel text-ink/60 transition hover:bg-zinc-100 hover:text-ink dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => scrollContainer(templateScrollRef, 'right')}
              aria-label="Deslizar a la derecha"
              className="grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-panel text-ink/60 transition hover:bg-zinc-100 hover:text-ink dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setActiveModal('Todas las plantillas')}
              className="ml-2 flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400"
            >
              View all
            </button>
          </div>
        </div>

        {/* Horizontal Sliding Templates Carousel */}
        <div
          ref={templateScrollRef}
          className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {/* Template Card 1: Auto-reply to all comments */}
          <div
            id="template-card-auto-reply"
            onClick={() => handleCardClick('Auto-reply to all comments')}
            className="group w-[295px] sm:w-[340px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-3xl border border-zinc-200/70 bg-panel transition hover:border-purple-300 hover:shadow-lg dark:border-zinc-800/80 dark:hover:border-purple-800/60"
          >
            {/* Visual Chat Mockup Preview */}
            <div
              className="relative flex h-48 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#26063b] via-[#1a052b] to-[#120420] p-5 text-white"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                    alt="Creator"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-block rounded-2xl rounded-bl-sm bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    Link please! 🙋‍♀️
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-[#381154] border border-purple-400/30 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                    <p>Hey! Happy you're interested! 👇</p>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      <span>🔗 See courses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Card Content */}
            <div className="p-4 sm:p-5">
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                Auto-reply to all comments
              </h3>
              <p className="mt-1 text-xs text-ink/60 line-clamp-2">
                Send a link to everyone who comments on your posts
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs font-medium text-ink/40 dark:border-zinc-800/60">
                <span className="flex items-center gap-1.5">
                  <Instagram size={13} className="text-pink-500" /> Instagram
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Preview template <ChevronRight size={13} />
                </span>
              </div>
            </div>
          </div>

          {/* Template Card 2: Auto-DM Keyword Trigger */}
          <div
            id="template-card-keyword-trigger"
            onClick={() => handleCardClick('Auto-DM keyword trigger')}
            className="group w-[295px] sm:w-[340px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-3xl border border-zinc-200/70 bg-panel transition hover:border-purple-300 hover:shadow-lg dark:border-zinc-800/80 dark:hover:border-purple-800/60"
          >
            {/* Visual Chat Mockup Preview */}
            <div
              className="relative flex h-48 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#1e0836] via-[#140526] to-[#0c0317] p-5 text-white"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-end">
                  <span className="rounded-2xl rounded-br-sm bg-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                    Keyword: GUIDE
                  </span>
                </div>
                <div className="max-w-[240px] rounded-2xl rounded-bl-sm border border-white/10 bg-white/15 p-2.5 text-xs text-white backdrop-blur-md">
                  <p className="font-medium">Here is your free Creator Kit guide! 🚀</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                    <span>📥 Download PDF (3.2 MB)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Card Content */}
            <div className="p-4 sm:p-5">
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                Auto-DM keyword trigger
              </h3>
              <p className="mt-1 text-xs text-ink/60 line-clamp-2">
                Send links & resources instantly whenever a follower sends a keyword
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs font-medium text-ink/40 dark:border-zinc-800/60">
                <span className="flex items-center gap-1.5">
                  <Instagram size={13} className="text-pink-500" /> Instagram
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Preview template <ChevronRight size={13} />
                </span>
              </div>
            </div>
          </div>

          {/* Template Card 3: Story Mention Reward */}
          <div
            id="template-card-story-reward"
            onClick={() => handleCardClick('Story mention reward')}
            className="group w-[295px] sm:w-[340px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-3xl border border-zinc-200/70 bg-panel transition hover:border-purple-300 hover:shadow-lg dark:border-zinc-800/80 dark:hover:border-purple-800/60"
          >
            {/* Visual Chat Mockup Preview */}
            <div
              className="relative flex h-48 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#16062b] via-[#21093b] to-[#120420] p-5 text-white"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-pink-500/20 text-pink-400">
                    <Gift size={14} />
                  </div>
                  <span className="text-xs font-semibold text-purple-200">Story mention detected</span>
                </div>
                <div className="max-w-[240px] rounded-2xl rounded-tl-sm border border-purple-400/30 bg-[#351052] p-2.5 text-xs text-white shadow-lg">
                  <p>Thanks for the shoutout! Here's your 20% OFF gift code 🎉</p>
                  <div className="mt-1.5 inline-block rounded-md bg-white/20 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                    CODE: VIP20
                  </div>
                </div>
              </div>
            </div>

            {/* Template Card Content */}
            <div className="p-4 sm:p-5">
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                Story mention reward
              </h3>
              <p className="mt-1 text-xs text-ink/60 line-clamp-2">
                Reward anyone who tags you in their stories with discounts or gifts
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs font-medium text-ink/40 dark:border-zinc-800/60">
                <span className="flex items-center gap-1.5">
                  <Instagram size={13} className="text-pink-500" /> Instagram
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Preview template <ChevronRight size={13} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Card Click */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-zinc-200 bg-panel p-6 shadow-2xl dark:border-zinc-800 animate-rise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <Sparkles size={20} />
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-zinc-100 hover:text-ink dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="mt-4 font-display text-2xl font-black text-ink">{activeModal}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Esta plantilla está lista para conectar con tu cuenta de Instagram. Configura las respuestas automáticas para multiplicar tu alcance sin esfuerzo.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="w-full rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition hover:bg-purple-500 active:scale-95"
              >
                Activar flujo ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
