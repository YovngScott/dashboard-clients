import { Menu } from 'lucide-react';
import { Profile } from '../types';

interface DashboardTopBarProps {
  profile: Profile;
  onOpenSettings: () => void;
}

export function DashboardTopBar({ profile, onOpenSettings }: DashboardTopBarProps) {
  const displayName = profile.display_name?.trim() || 'Mi espacio';
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <header
      id="dashboard-top-bar"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/60 bg-canvas/85 px-4 backdrop-blur-xl sm:px-6 dark:border-zinc-800/80"
    >
      {/* Top Left: User Avatar & Name */}
      <div id="topbar-user-profile" className="flex items-center gap-3">
        <div aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-sm font-extrabold text-brand-ink shadow-sm">
          {initials}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="max-w-[13rem] truncate font-display text-base font-extrabold tracking-[-.02em] text-ink sm:text-lg">
            {displayName}
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
