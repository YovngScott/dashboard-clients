import { Home, MessageSquare, Users, Sparkles } from 'lucide-react';
import { DashboardTab } from '../types';

interface BottomNavBarProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
}

export function BottomNavBar({ currentTab, onSelectTab }: BottomNavBarProps) {
  const items: { label: DashboardTab; display: string; icon: React.ReactNode }[] = [
    { label: 'Inicio', display: 'Inicio', icon: <Home size={19} /> },
    { label: 'Bandeja', display: 'Bandeja', icon: <MessageSquare size={19} /> },
    { label: 'Contactos', display: 'Contactos', icon: <Users size={19} /> },
    { label: 'Automatizaciones', display: 'Automatizar', icon: <Sparkles size={19} /> },
  ];

  return (
    <nav
      id="bottom-nav-bar"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200/60 bg-canvas/90 px-6 py-2 backdrop-blur-xl lg:hidden dark:border-zinc-800/80"
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => {
          const isActive = currentTab === item.label;
          return (
            <button
              key={item.label}
              id={`nav-tab-${item.display.toLowerCase()}`}
              onClick={() => onSelectTab(item.label)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 transition ${
                isActive ? 'text-ink font-bold' : 'text-ink/40 hover:text-ink/70'
              }`}
            >
              <div
                className={`flex h-8 items-center justify-center rounded-full px-4 transition ${
                  isActive
                    ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'bg-transparent'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[11px] font-medium tracking-tight">{item.display}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
