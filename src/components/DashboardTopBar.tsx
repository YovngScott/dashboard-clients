import { Menu } from 'lucide-react';
import type { AccountIdentity } from '@/lib/account-identity';
import type { WorkspaceContext } from '@/lib/workspace';
import { AccountAvatar } from './AccountAvatar';

interface DashboardTopBarProps {
  workspace: WorkspaceContext;
  identity: AccountIdentity;
  onOpenSettings: () => void;
}

export function DashboardTopBar({ workspace, identity, onOpenSettings }: DashboardTopBarProps) {
  return (
    <header
      id="dashboard-top-bar"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/60 bg-canvas/95 px-4 sm:px-6 dark:border-zinc-800/80 lg:hidden"
    >
      <div id="topbar-user-profile" className="flex items-center gap-3">
        <AccountAvatar identity={identity} className="h-10 w-10" />
        <div className="min-w-0">
          <span className="block max-w-[13rem] truncate font-display text-sm font-extrabold tracking-[-.02em] text-ink sm:text-base">{identity.name}</span>
          <span className="block max-w-[13rem] truncate text-xs text-ink/70">{workspace.name}</span>
        </div>
      </div>

      {/* Top Right: 3 lines (Hamburger icon / 3 rallas) for Configuration */}
      <button
        id="topbar-settings-button"
        type="button"
        onClick={onOpenSettings}
        aria-label="Configuración"
        className="grid h-11 w-11 place-items-center rounded-xl text-ink transition-transform duration-150 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:bg-zinc-800/60"
      >
        <Menu size={26} strokeWidth={2.2} />
      </button>
    </header>
  );
}
