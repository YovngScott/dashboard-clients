import { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  AtSign,
  Bell,
  MessageSquare,
  Shield,
  LifeBuoy,
  ShieldCheck,
  FileText,
  User,
  Trash2,
  ChevronRight,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Profile, ThemePref } from '../types';
import { ChannelsModal } from './ChannelsModal';
import { NotificationsModal } from './NotificationsModal';
import { InboxSettingsModal } from './InboxSettingsModal';
import { PrivacyPreferencesModal } from './PrivacyPreferencesModal';

interface SettingsScreenProps {
  profile: Profile;
  themePref: ThemePref;
  updateTheme: (pref: ThemePref) => void;
  onLogout: () => void;
  onBack: () => void;
  onOpenUpgrade: () => void;
}

export function SettingsScreen({
  profile,
  themePref,
  updateTheme,
  onLogout,
  onBack,
  onOpenUpgrade,
}: SettingsScreenProps) {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showChannelsModal, setShowChannelsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const displayName = profile.display_name?.trim() || 'Mi espacio';
  const username = displayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'mi.espacio';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const themeLabel =
    themePref === 'dark' ? 'Oscuro' : themePref === 'light' ? 'Claro' : 'Sistema';

  return (
    <div className="mx-auto min-h-screen max-w-xl pb-24 text-ink animate-rise">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/95 px-5 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 bg-canvas/90 px-4 py-4 backdrop-blur-md">
        <button
          id="settings-back-button"
          onClick={onBack}
          aria-label="Volver"
          className="grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-panel"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Settings</h1>
      </div>

      <div className="space-y-6 px-4 pt-2">
        {/* ACCOUNT SECTION */}
        <div>
          <h2 className="mb-2 px-1 text-xs font-bold tracking-wider text-ink/40 uppercase">
            Account
          </h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-panel shadow-sm dark:border-zinc-800/80">
            {/* User Profile Item */}
            <div
              onClick={() => triggerToast('Perfil de cuenta: ' + displayName)}
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-zinc-800">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-['Playfair_Display',serif] text-base font-bold italic tracking-wide text-ink">
                    {displayName}
                  </span>
                  <span className="text-base" role="img" aria-label="eye">
                    👁️
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-zinc-300 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  FREE
                </span>
                <ChevronRight size={17} className="text-ink/30" />
              </div>
            </div>

            {/* Upgrade Plan */}
            <div
              id="settings-upgrade-plan-row"
              onClick={onOpenUpgrade}
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <Sparkles size={19} className="text-purple-500" />
                <span className="text-sm font-medium text-ink">Upgrade Plan</span>
              </div>
              <ChevronRight size={17} className="text-ink/30" />
            </div>

            {/* Channels */}
            <div
              id="settings-channels-row"
              onClick={() => setShowChannelsModal(true)}
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <AtSign size={19} className="text-ink/60" />
                <span className="text-sm font-medium text-ink">Channels</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/40">{profile.channel || 'Instagram'}</span>
                <ChevronRight size={17} className="text-ink/30" />
              </div>
            </div>

            {/* Notifications */}
            <div
              id="settings-notifications-row"
              onClick={() => setShowNotificationsModal(true)}
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <Bell size={19} className="text-ink/60" />
                <span className="text-sm font-medium text-ink">Notifications</span>
              </div>
              <ChevronRight size={17} className="text-ink/30" />
            </div>

            {/* Inbox */}
            <div
              id="settings-inbox-row"
              onClick={() => setShowInboxModal(true)}
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <MessageSquare size={19} className="text-ink/60" />
                <span className="text-sm font-medium text-ink">Inbox</span>
              </div>
              <ChevronRight size={17} className="text-ink/30" />
            </div>

            {/* Privacy preferences */}
            <div
              id="settings-privacy-preferences-row"
              onClick={() => setShowPrivacyModal(true)}
              className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <Shield size={19} className="text-ink/60" />
                <span className="text-sm font-medium text-ink">Privacy preferences</span>
              </div>
              <ChevronRight size={17} className="text-ink/30" />
            </div>
          </div>
        </div>

        {/* LEGAL & SUPPORT SECTION (formerly Useful Resources) */}
        <div>
          <h2 className="mb-2 px-1 text-xs font-bold tracking-wider text-ink/40 uppercase">
            Legal & Support
          </h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-panel shadow-sm dark:border-zinc-800/80">
            {/* Help center */}
            <div
              onClick={() => triggerToast('Abriendo Centro de Ayuda')}
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <LifeBuoy size={19} className="text-ink/60" />
                <span className="text-sm font-medium text-ink">Help center</span>
              </div>
              <ChevronRight size={17} className="text-ink/30" />
            </div>

            {/* Security center */}
            <a
              id="settings-privacy-policy-link"
              href="https://stage-labs.ai.studio/security"
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <ShieldCheck size={19} className="text-ink/60" />
                <span className="text-sm font-medium text-ink">Centro de seguridad</span>
              </div>
              <ExternalLink size={16} className="text-ink/30" />
            </a>

            {/* Privacy policy */}
            <a
              id="settings-terms-of-service-link"
              href="https://stage-labs.ai.studio/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <FileText size={19} className="text-ink/60" />
                <span className="text-sm font-medium text-ink">Política de privacidad</span>
              </div>
              <ExternalLink size={16} className="text-ink/30" />
            </a>
          </div>
        </div>

        {/* PROFILE SECTION */}
        <div>
          <h2 className="mb-2 px-1 text-xs font-bold tracking-wider text-ink/40 uppercase">
            Profile
          </h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-panel shadow-sm dark:border-zinc-800/80">
            {/* User row */}
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800/60">
              <div className="flex items-center gap-3.5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <User size={18} />
                </div>
                <span className="text-sm font-semibold text-ink">{username}</span>
              </div>
            </div>

            {/* Delete profile */}
            <div
              onClick={() => triggerToast('Función de eliminación protegida')}
              className="flex cursor-pointer items-center justify-between border-b border-zinc-100 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 text-ink/90">
                <Trash2 size={19} className="text-zinc-500" />
                <span className="text-sm font-medium text-ink">Delete Stage AI Labs profile</span>
              </div>
              <ChevronRight size={17} className="text-ink/30" />
            </div>

            {/* Color mode selector (Menú desplegable) */}
            <div className="relative border-b border-zinc-100 dark:border-zinc-800/60">
              <button
                id="color-mode-setting-row"
                type="button"
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              >
                <div className="flex items-center gap-3.5 text-ink/90">
                  {themePref === 'dark' ? (
                    <Moon size={19} className="text-purple-400" />
                  ) : themePref === 'light' ? (
                    <Sun size={19} className="text-amber-500" />
                  ) : (
                    <Monitor size={19} className="text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-ink">
                    Color mode: <span className="font-normal text-ink/60">{themeLabel}</span>
                  </span>
                </div>
                <ChevronDown
                  size={17}
                  className={`text-ink/40 transition-transform duration-200 ${showThemePicker ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''}`}
                />
              </button>

              {/* Menú Desplegable Dropdown */}
              {showThemePicker && (
                <div className="border-t border-zinc-100 bg-zinc-50/70 p-2 dark:border-zinc-800/60 dark:bg-zinc-900/50 animate-rise">
                  <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-panel shadow-sm dark:border-zinc-800">
                    {(['light', 'dark', 'system'] as const).map((pref, idx) => {
                      const isActive = themePref === pref;
                      const label = pref === 'light' ? 'Claro' : pref === 'dark' ? 'Oscuro' : 'Sistema';
                      return (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => {
                            updateTheme(pref);
                            setShowThemePicker(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-sm transition ${
                            idx !== 0 ? 'border-t border-zinc-100 dark:border-zinc-800/50' : ''
                          } ${
                            isActive
                              ? 'bg-purple-500/10 font-semibold text-purple-600 dark:text-purple-400'
                              : 'text-ink/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {pref === 'light' && <Sun size={17} className="text-amber-500" />}
                            {pref === 'dark' && <Moon size={17} className="text-purple-400" />}
                            {pref === 'system' && <Monitor size={17} className="text-zinc-400" />}
                            <span>{label}</span>
                          </div>
                          {isActive && <Check size={16} className="text-purple-600 dark:text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Log out */}
            <div
              id="settings-logout-row"
              onClick={onLogout}
              className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-red-50/50 dark:hover:bg-red-950/20"
            >
              <div className="flex items-center gap-3.5 text-red-600 dark:text-red-400">
                <LogOut size={19} />
                <span className="text-sm font-medium">Log out</span>
              </div>
              <ChevronRight size={17} className="text-red-400/40" />
            </div>
          </div>
        </div>

        {/* Footer Build info */}
        <div className="pt-4 text-center text-xs font-medium text-ink/40">
          v6.21.0 (396) — USA
        </div>
      </div>

      {/* Embedded Modals */}
      <ChannelsModal
        isOpen={showChannelsModal}
        onClose={() => setShowChannelsModal(false)}
        onConnectChannel={(channel) => triggerToast(`Canal ${channel} seleccionado`)}
      />

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

      <InboxSettingsModal
        isOpen={showInboxModal}
        onClose={() => setShowInboxModal(false)}
      />

      <PrivacyPreferencesModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSave={() => triggerToast('Preferencias de privacidad guardadas')}
      />
    </div>
  );
}

