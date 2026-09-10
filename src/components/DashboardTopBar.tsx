import { Menu } from 'lucide-react';
import { Profile } from '../types';

interface DashboardTopBarProps {
  profile: Profile;
  onOpenSettings: () => void;
}

export function DashboardTopBar({ profile, onOpenSettings }: DashboardTopBarProps) {
  const displayName = profile.display_name?.trim() || 'Silverio';

  return (
    <header
      id="dashboard-top-bar"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/60 bg-canvas/85 px-4 backdrop-blur-xl sm:px-6 dark:border-zinc-800/80"
    >
      {/* Top Left: User Avatar & Name */}
      <div id="topbar-user-profile" className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-zinc-800 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt={displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-['Playfair_Display',serif] text-xl font-bold italic tracking-wide text-ink">
            {displayName}
          </span>
          <span className="text-lg select-none" role="img" aria-label="eye">
            👁️
          </span>
        </div>
      </div>

      {/* Top Right: 3 lines (Hamburger icon / 3 rallas) for Configuration */}
      <button
        id="topbar-settings-button"
        onClick={onOpenSettings}
        aria-label="Configuración"
        className="grid h-10 w-10 place-items-center rounded-xl text-ink transition hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
      >
        <Menu size={26} strokeWidth={2.2} />
      </button>
    </header>
  );
}
