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
  collapsed: boolean;
  onToggleCollapsed: () => void;
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
  collapsed,
  onToggleCollapsed,
}: DashboardSidebarProps) {
  const displayName = profile.display_name?.trim() || 'Mi espacio';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-ink/10 bg-[#101116] text-white lg:flex ${collapsed ? 'w-[76px]' : 'w-[248px]'}`}>
      <div className={`flex h-20 items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-6'}`}>
        <button type="button" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} aria-expanded={!collapsed} title={collapsed ? 'Expandir menú' : 'Contraer menú'} className="group flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400" />
          {!collapsed && <span className="font-display text-lg font-extrabold tracking-[-.02em] transition-opacity duration-150 group-hover:text-white/80">Stage AI Labs</span>}
        </button>
      </div>

      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'}`} aria-label="Navegación principal">
        <div className="space-y-1">
          {navigation.map(({ tab, label, icon: Icon }) => {
            const active = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelectTab(tab)}
                title={collapsed ? label : undefined}
                className={`flex min-h-11 w-full items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} rounded-xl text-left text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                  active
                    ? 'bg-white text-[#101116]'
                    : 'text-white/58 hover:bg-white/[.07] hover:text-white'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.25 : 1.9} />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </div>

        <div className="my-5 h-px bg-white/10" />

        <button
          type="button"
          onClick={onOpenChannels}
          title={collapsed ? 'Canales' : undefined}
          className={`flex min-h-11 w-full items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} rounded-xl text-left text-sm font-semibold text-white/58 transition-colors duration-150 hover:bg-white/[.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400`}
        >
          <SlidersHorizontal size={19} />
          {!collapsed && <span>Canales</span>}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          title={collapsed ? 'Configuración' : undefined}
          className={`flex min-h-11 w-full items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} rounded-xl text-left text-sm font-semibold text-white/58 transition-colors duration-150 hover:bg-white/[.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400`}
        >
          <Settings size={19} />
          {!collapsed && <span>Configuración</span>}
        </button>
      </nav>

      <div className={`border-t border-white/10 ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center rounded-xl py-3 ${collapsed ? 'flex-col gap-2 px-0' : 'gap-3 px-2'}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-xs font-extrabold text-white">
            {initials}
          </span>
          {!collapsed && <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{displayName}</p>
            <p className="mt-0.5 text-xs text-white/42">Espacio de trabajo</p>
          </div>}
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
