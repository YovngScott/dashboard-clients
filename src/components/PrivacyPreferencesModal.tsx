import { useState } from 'react';
import { X, Lock, ChevronDown, ChevronRight } from 'lucide-react';

interface PrivacyPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function PrivacyPreferencesModal({ isOpen, onClose, onSave }: PrivacyPreferencesModalProps) {
  const [advertising, setAdvertising] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  const [expandedEssential, setExpandedEssential] = useState(true);
  const [expandedAdvertising, setExpandedAdvertising] = useState(false);
  const [expandedAnalytics, setExpandedAnalytics] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave) onSave();
    onClose();
  };

  const essentialServices = [
    'Facebook Connect',
    'Firebase Cloud Messaging (FCM)',
    'Firebase Remote Config',
    'Google Sign-In',
    'Usercentrics Consent Management Platform',
  ];

  const advertisingServices = ['AppsFlyer'];

  const analyticsServices = [
    'Braze',
    'Firebase Crashlytics',
    'Firebase Performance Monitoring',
    'Google Firebase Analytics',
    'Intercom',
    'Stage AI Labs Analytics',
    'Microsoft Clarity',
    'Sentry',
  ];

  return (
    <div
      id="privacy-preferences-backdrop"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        id="privacy-preferences-modal"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-[#171717] text-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with circular white close button */}
        <div className="relative flex items-center px-5 pt-5 pb-3">
          <button
            id="privacy-close-btn"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-zinc-900 transition hover:bg-zinc-200"
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="flex-1 text-center font-bold text-lg text-white pr-8">
            Privacy preferences
          </h2>
        </div>

        {/* Description */}
        <div className="px-5 pt-1 pb-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Decide cómo Stage AI Labs procesa los datos de uso. Puedes cambiar estas preferencias en cualquier momento.
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-5">
          {/* Essential Section */}
          <div className="border-b border-zinc-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">Essential</span>
                <Lock size={13} className="text-zinc-400" />
              </div>
              {/* Locked Active Toggle */}
              <div className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full bg-emerald-600/70 p-0.5 opacity-90">
                <span className="h-5 w-5 rounded-full bg-white shadow-md translate-x-5" />
              </div>
            </div>
            <p className="mt-1 text-xs text-zinc-400">Required for the app to function.</p>

            <button
              onClick={() => setExpandedEssential(!expandedEssential)}
              className="mt-3 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200"
            >
              <span>Services ({essentialServices.length})</span>
              {expandedEssential ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {expandedEssential && (
              <div className="mt-2.5 space-y-2 pl-2">
                {essentialServices.map((service) => (
                  <div key={service} className="flex items-center justify-between text-xs text-zinc-300 py-0.5">
                    <span>{service}</span>
                    <ChevronRight size={13} className="text-zinc-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advertising Section */}
          <div className="border-b border-zinc-800/80 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Advertising</span>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setAdvertising(!advertising)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors p-0.5 ${
                  advertising ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    advertising ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Show you relevant offers and measure campaign performance.
            </p>

            <button
              onClick={() => setExpandedAdvertising(!expandedAdvertising)}
              className="mt-3 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200"
            >
              <span>Services ({advertisingServices.length})</span>
              {expandedAdvertising ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {expandedAdvertising && (
              <div className="mt-2.5 space-y-2 pl-2">
                {advertisingServices.map((service) => (
                  <div key={service} className="flex items-center justify-between text-xs text-zinc-300 py-0.5">
                    <span>{service}</span>
                    <ChevronRight size={13} className="text-zinc-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analytics Section */}
          <div className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Analytics</span>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setAnalytics(!analytics)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors p-0.5 ${
                  analytics ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    analytics ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Help us understand how the app is used so we can improve.
            </p>

            <button
              onClick={() => setExpandedAnalytics(!expandedAnalytics)}
              className="mt-3 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200"
            >
              <span>Services ({analyticsServices.length})</span>
              {expandedAnalytics ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {expandedAnalytics && (
              <div className="mt-2.5 space-y-2 pl-2">
                {analyticsServices.map((service) => (
                  <div key={service} className="flex items-center justify-between text-xs text-zinc-300 py-0.5">
                    <span>{service}</span>
                    <ChevronRight size={13} className="text-zinc-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save button footer */}
        <div className="p-4 pt-2 border-t border-zinc-800/80 bg-[#171717] rounded-b-3xl">
          <button
            id="save-privacy-preferences-btn"
            onClick={handleSave}
            className="w-full rounded-xl bg-[#2c2c2e] py-3 text-sm font-semibold text-white transition hover:bg-[#3a3a3c] active:scale-[0.99]"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
