import {
  Bot,
  ContactRound,
  Home,
  Inbox,
  LogOut,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import type { DashboardTab, Profile } from '../types';

interface DashboardSidebarProps {
  currentTab: DashboardTab;
  profile: Profile;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenChannels: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const navigation: Array<{
  tab: DashboardTab;
  label: string;
  icon: typeof Home;
}> = [
  { tab: 'Inicio', label: 'Inicio', icon: Home },
  { tab: 'Bandeja', label: 'Bandeja', icon: Inbox },
  { tab: 'Contactos', label: 'Contactos', icon: ContactRound },
  { tab: 'Automatizaciones', label: 'Agentes', icon: Bot },
];

export function DashboardSidebar({
  currentTab,
  profile,
  onSelectTab,
  onOpenChannels,
  onOpenSettings,
  onLogout,
}: DashboardSidebarProps) {
  const displayName = profile.display_name?.trim() || 'Mi espacio';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-ink/10 bg-[#101116] text-white lg:flex">
      <div className="flex h-20 items-center gap-3 px-6">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-teal-400" />
        <span className="font-display text-lg font-extrabold tracking-[-.02em]">Stage AI Labs</span>
      </div>

      <nav className="flex-1 px-3" aria-label="Navegación principal">
        <div className="space-y-1">
          {navigation.map(({ tab, label, icon: Icon }) => {
            const active = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelectTab(tab)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                  active
                    ? 'bg-white text-[#101116]'
                    : 'text-white/58 hover:bg-white/[.07] hover:text-white'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.25 : 1.9} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="my-5 h-px bg-white/10" />

        <button
          type="button"
          onClick={onOpenChannels}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-white/58 transition-colors duration-150 hover:bg-white/[.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          <SlidersHorizontal size={19} />
          <span>Canales</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-white/58 transition-colors duration-150 hover:bg-white/[.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          <Settings size={19} />
          <span>Configuración</span>
        </button>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-xs font-extrabold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{displayName}</p>
            <p className="mt-0.5 text-xs text-white/42">Espacio de trabajo</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/45 transition-colors duration-150 hover:bg-white/[.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
