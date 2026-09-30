import { useState } from 'react';
import {
  ArrowLeft, Bell, FileText, LifeBuoy, LogOut, MessageSquare, Monitor,
  Shield, ShieldCheck, Sparkles, Sun, Users,
} from 'lucide-react';
import { Profile, ThemePref } from '../types';
import type { AccountIdentity } from '@/lib/account-identity';
import { providerLabel } from '@/lib/account-identity';
import type { WorkspaceContext } from '@/lib/workspace';
import { roleLabel } from '@/lib/workspace';
import { STAGE_PLANS } from '@/lib/product-data';
import { AccountAvatar } from './AccountAvatar';
import { TeamSettings } from './TeamSettings';

interface SettingsScreenProps {
  profile: Profile;
  workspace: WorkspaceContext;
  identity: AccountIdentity;
  themePref: ThemePref;
  updateTheme: (pref: ThemePref) => void;
  onLogout: () => void;
  onBack: () => void;
  onOpenUpgrade: () => void;
}

type SettingKey = 'general' | 'plan' | 'notifications' | 'team' | 'display' | 'inbox' | 'assignment' | 'privacy';

const planLabel = (code: string) => STAGE_PLANS.find((plan) => plan.id === code)?.name ?? code;

const navGroups: { label: string; items: { key: SettingKey; label: string; icon: typeof Bell }[] }[] = [
  { label: 'Principal', items: [
    { key: 'general', label: 'General', icon: Monitor },
    { key: 'plan', label: 'Plan', icon: Sparkles },
    { key: 'notifications', label: 'Notificaciones', icon: Bell },
    { key: 'team', label: 'Miembros del equipo', icon: Users },
    { key: 'display', label: 'Mostrar', icon: Sun },
    { key: 'privacy', label: 'Privacidad', icon: Shield },
  ] },
  { label: 'Bandeja de entrada', items: [
    { key: 'inbox', label: 'Comportamiento de Inbox', icon: MessageSquare },
    { key: 'assignment', label: 'Asignación automática', icon: Users },
  ] },
];

function DraftNotice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-900 dark:text-amber-200">
    <p className="font-semibold">Propuesta, todavía no operativa</p>
    <p className="mt-0.5 text-amber-900/80 dark:text-amber-100/80">{children}</p>
  </div>;
}

function DraftRow({ title, description }: { title: string; description: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-ink/10 py-4 last:border-0">
    <div><p className="text-sm font-semibold text-ink">{title}</p><p className="mt-1 text-sm leading-5 text-ink/60">{description}</p></div>
    <span className="shrink-0 rounded-md border border-amber-600/25 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200">Pendiente</span>
  </div>;
}

export function SettingsScreen({
  profile, workspace, identity, themePref, updateTheme, onLogout, onBack, onOpenUpgrade,
}: SettingsScreenProps) {
  const [active, setActive] = useState<SettingKey>('general');
  const themeLabel = themePref === 'dark' ? 'Oscuro' : themePref === 'light' ? 'Claro' : 'Sistema';
  const activeItem = navGroups.flatMap((group) => group.items).find((item) => item.key === active);
  const plan = STAGE_PLANS.find((item) => item.id === workspace.planCode);
  const currentPlan = planLabel(workspace.planCode);

  return <div className="mx-auto w-full max-w-6xl pb-24 text-ink lg:pb-8">
    <div className="sticky top-0 z-20 flex items-center gap-3 bg-canvas/95 px-1 py-3 lg:hidden">
      <button id="settings-back-button" onClick={onBack} aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"><ArrowLeft size={21} /></button>
      <h1 className="font-display text-2xl font-bold tracking-tight">Configuración</h1>
    </div>

    <div className="grid gap-5 px-1 pt-2 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
      <nav aria-label="Secciones de configuración" className="self-start rounded-2xl border border-ink/10 bg-panel p-2 lg:sticky lg:top-4">
        {navGroups.map((group) => <div key={group.label} className="mb-3 grid grid-cols-2 gap-1 last:mb-0 lg:block">
          <h2 className="col-span-2 px-3 pb-1 pt-3 text-xs font-bold text-ink/55 lg:col-span-1">{group.label}</h2>
          {group.items.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-current={active === key ? 'page' : undefined} onClick={() => setActive(key)} className={`flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl px-2.5 text-left text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 sm:gap-3 sm:px-3 sm:text-sm lg:mb-1 ${active === key ? 'bg-teal-500/10 text-teal-800 dark:text-teal-200' : 'text-ink/75 hover:bg-ink/5'}`}>
            <Icon aria-hidden="true" size={17} className="shrink-0" /><span className="min-w-0">{label}</span>
          </button>)}
        </div>)}
      </nav>

      <section id="settings-content" aria-labelledby="settings-section-title" className="min-w-0">
        <header className="mb-5 border-b border-ink/10 pb-4">
          <p className="text-sm text-ink/55">{workspace.name}</p>
          <h2 id="settings-section-title" className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{activeItem?.label}</h2>
        </header>

        {active === 'general' && <div className="space-y-5">
          <section aria-labelledby="workspace-identity-title" className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 id="workspace-identity-title" className="text-base font-bold">Espacio de trabajo</h3><p className="mt-1 text-sm text-ink/60">Identidad de la empresa y acceso.</p></div>
              <span className="rounded-lg border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/70">{roleLabel(workspace.role)}</span>
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-ink/10 pt-5">
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl border border-ink/10 bg-white p-1"><img src="/stage-logo.png" alt="" className="h-full w-full object-contain" /></span>
              <div className="min-w-0"><p className="text-xs text-ink/55">Nombre guardado</p><p className="truncate text-base font-semibold">{workspace.name}</p></div>
            </div>
            {workspace.role === 'owner' && <div className="mt-5 rounded-xl border border-ink/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Nombre de la organización</p><span className="rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200">Borrador</span></div>
              <p className="mt-1 text-sm text-ink/60">Propuesta de nombre: <strong className="font-semibold text-ink">Stage AI Labs</strong></p>
              <p className="mt-2 text-xs text-ink/55">El cambio de nombre aún no guarda en la organización. El nombre actual sigue siendo “{workspace.name}”.</p>
            </div>}
          </section>

          <section aria-labelledby="personal-identity-title" className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
            <h3 id="personal-identity-title" className="text-base font-bold">Perfil personal</h3>
            <div className="mt-4 flex items-center gap-3">
              <AccountAvatar identity={identity} className="h-11 w-11" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{identity.name}</p>{identity.email && <p className="truncate text-sm text-ink/60">{identity.email}</p>}<p className="text-xs text-ink/55">Inicio de sesión con {providerLabel(identity.provider)}</p></div>
            </div>
            <button id="settings-logout-row" type="button" onClick={onLogout} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 px-4 text-sm font-semibold text-ink/80 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"><LogOut size={16} />Cerrar sesión</button>
          </section>
        </div>}

        {active === 'plan' && <div className="space-y-5">
          <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-sm text-ink/60">Plan asignado al espacio</p><h3 className="mt-1 text-2xl font-bold">{currentPlan}</h3></div>
              <button id="settings-upgrade-plan-row" type="button" onClick={onOpenUpgrade} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"><Sparkles size={16} />Ver planes</button>
            </div>
            <div className="mt-5 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-2">
              <div><p className="text-xs text-ink/55">Canales permitidos</p><p className="mt-1 text-sm font-semibold">Hasta {workspace.maxConnectedChannels}</p></div>
              <div><p className="text-xs text-ink/55">Miembros incluidos</p><p className="mt-1 text-sm font-semibold">{plan?.seats ?? 'Según el plan'}</p></div>
            </div>
          </section>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-900 dark:text-amber-200">
            <p className="font-semibold">Facturación pendiente de conexión</p>
            <p className="mt-0.5 text-amber-900/80 dark:text-amber-100/80">Infinity está asignado como permiso del espacio. No hay una suscripción de pago confirmada ni gestión de facturación conectada.</p>
          </div>
        </div>}

        {active === 'notifications' && <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
          <h3 className="text-base font-bold">Notificaciones de actividad</h3><p className="mt-1 text-sm text-ink/60">Preferencias que se planea ofrecer por espacio y usuario.</p>
          <div className="mt-4"><DraftRow title="Conversaciones asignadas" description="Aviso cuando una conversación nueva se asigne a una persona del equipo." /><DraftRow title="Conversaciones sin asignar" description="Aviso cuando llegue una conversación pendiente de atención." /><DraftRow title="Actividad del agente" description="Avisos sobre fallos, pausas o cambios de estado." /></div>
          <DraftNotice>Las preferencias no se guardan todavía. No hay interruptores activos en esta vista.</DraftNotice>
        </section>}

        {active === 'team' && <TeamSettings workspace={workspace} userId={profile.id} />}

        {active === 'display' && <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
          <h3 className="text-base font-bold">Apariencia</h3><p className="mt-1 text-sm text-ink/60">Esta preferencia sí se aplica a tu sesión.</p>
          <label htmlFor="settings-theme" className="mt-5 block text-sm font-semibold">Tema</label>
          <select id="settings-theme" value={themePref} onChange={(event) => updateTheme(event.target.value as ThemePref)} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:max-w-sm">
            <option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option>
          </select>
          <p className="mt-2 text-xs text-ink/55">Tema actual: {themeLabel}</p>
        </section>}

        {active === 'inbox' && <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
          <h3 className="text-base font-bold">Comportamiento de Inbox</h3><p className="mt-1 text-sm text-ink/60">Definirá cómo se abren y cierran las conversaciones entrantes.</p>
          <div className="mt-4"><DraftRow title="Apertura de conversaciones" description="Elegir si cada mensaje nuevo abre una conversación o solo los que requieren atención." /><DraftRow title="Visibilidad del equipo" description="Definir si los operadores ven todas las conversaciones o solo las asignadas." /><DraftRow title="Pausar automatizaciones" description="Configurar si la atención humana pausa temporalmente las respuestas automáticas." /></div>
          <DraftNotice>Estas opciones son una propuesta. Los controles de Inbox no guardan cambios.</DraftNotice>
        </section>}

        {active === 'assignment' && <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
          <h3 className="text-base font-bold">Asignación automática</h3><p className="mt-1 text-sm text-ink/60">La bandeja todavía no distribuye conversaciones automáticamente.</p>
          <div className="mt-4"><DraftRow title="Asignación manual" description="El equipo toma conversaciones pendientes manualmente." /><DraftRow title="Distribución equilibrada" description="Reparto automático entre miembros disponibles." /><DraftRow title="Reglas de asignación" description="Asignar por canal, horario o disponibilidad del equipo." /></div>
          <DraftNotice>Se muestra para planificar el producto; todavía no hay reglas configurables ni guardado.</DraftNotice>
        </section>}

        {active === 'privacy' && <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
          <h3 className="text-base font-bold">Privacidad y datos</h3><p className="mt-1 text-sm text-ink/60">Controles de privacidad por organización y derechos sobre los datos.</p>
          <div className="mt-4"><DraftRow title="Preferencias de analítica" description="Elegir qué datos opcionales de uso compartir." /><DraftRow title="Exportar datos del espacio" description="Solicitar una copia de los datos de la organización." /><DraftRow title="Eliminar espacio" description="Flujo protegido para cerrar la organización y borrar sus datos." /></div>
          <DraftNotice>La pantalla anterior solo cambiaba valores temporales y no persistía las preferencias. Por eso se presenta aquí como pendiente, sin controles que simulen un guardado.</DraftNotice>
        </section>}

        <section className="mt-6 border-t border-ink/10 pt-4">
          <h3 className="text-xs font-bold text-ink/55">Ayuda y legal</h3>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="https://stagelaboratories.com/security" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-ink/70 underline-offset-4 hover:text-ink hover:underline"><ShieldCheck size={16} />Centro de seguridad</a>
            <a href="https://stagelaboratories.com/privacidad" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-ink/70 underline-offset-4 hover:text-ink hover:underline"><FileText size={16} />Política de privacidad</a>
            <span className="inline-flex min-h-11 items-center gap-2 text-ink/55"><LifeBuoy size={16} />Centro de ayuda en preparación</span>
          </div>
        </section>
        <p className="mt-6 text-center text-xs text-ink/45">Stage AI Labs</p>
      </section>
    </div>
  </div>;
}
