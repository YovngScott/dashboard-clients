interface HomeHeroBannerProps {
  onOpenUpgrade: () => void;
}

export function HomeHeroBanner({ onOpenUpgrade }: HomeHeroBannerProps) {
  return (
    <div
      id="home-hero-banner"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2c0847] via-[#24063c] to-[#1a052e] p-6 text-white shadow-xl sm:p-8"
    >
      {/* Grid Pattern Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        {/* Left text column */}
        <div className="max-w-md">
          <h1 className="font-display text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Don't let growth stop you
          </h1>
          <p className="mt-2 text-sm text-purple-200/90 sm:text-base">
            Upgrade to reply to every fan as you grow
          </p>
          <div className="mt-5">
            <button
              id="hero-upgrade-cta"
              onClick={onOpenUpgrade}
              className="inline-flex items-center rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-950/50 transition hover:bg-purple-500 active:scale-95"
            >
              Try 14 days for free
            </button>
          </div>
        </div>

        {/* Right photo */}
        <div className="relative shrink-0 self-center sm:self-auto">
          <div className="h-44 w-36 overflow-hidden rounded-2xl border-2 border-white/10 shadow-2xl sm:h-48 sm:w-40">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80"
              alt="Creator using smartphone"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
