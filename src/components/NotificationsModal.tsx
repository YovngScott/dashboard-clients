import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [assignedToMe, setAssignedToMe] = useState(true);
  const [unassigned, setUnassigned] = useState(true);
  const [automationsResults, setAutomationsResults] = useState(true);
  const [recommendations, setRecommendations] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      id="notifications-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        id="notifications-modal"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-[#171717] text-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center px-5 pt-5 pb-3">
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-zinc-900 transition hover:bg-zinc-200"
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="flex-1 text-center font-bold text-lg text-white pr-8">
            Notifications
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5 pb-8">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 rounded-2xl bg-[#362006] border border-[#6b410c] p-4 text-[#fbbf24]">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-[#f59e0b]" />
            <div>
              <h4 className="text-sm font-bold text-[#fef3c7] leading-snug">
                Notifying admins is not available on your current plan
              </h4>
              <p className="mt-1 text-xs text-[#fcd34d]/80 leading-relaxed">
                Upgrading isn't available just yet, but its coming soon
              </p>
            </div>
          </div>

          {/* NEW MESSAGE */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              New Message
            </h3>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#212124]">
              <div className="flex items-center justify-between border-b border-zinc-800/80 p-4">
                <span className="text-sm font-medium text-white">Assigned to me</span>
                <button
                  type="button"
                  onClick={() => setAssignedToMe(!assignedToMe)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors p-0.5 ${
                    assignedToMe ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                      assignedToMe ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-white">Unassigned</span>
                <button
                  type="button"
                  onClick={() => setUnassigned(!unassigned)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors p-0.5 ${
                    unassigned ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                      unassigned ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Actions
            </h3>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#212124]">
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-zinc-400">Notify admins</span>
                {/* Disabled toggle */}
                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full bg-zinc-600/60 p-0.5 opacity-60">
                  <span className="h-5 w-5 rounded-full bg-white/80 shadow-md translate-x-5" />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Set Notify Admins Action in Flow Builder to instantly get notified about an event.
            </p>
          </div>

          {/* INSIGHTS */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Insights
            </h3>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#212124]">
              <div className="flex items-center justify-between border-b border-zinc-800/80 p-4">
                <span className="text-sm font-medium text-white">Automations results</span>
                <button
                  type="button"
                  onClick={() => setAutomationsResults(!automationsResults)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors p-0.5 ${
                    automationsResults ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                      automationsResults ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-white">Recommendations</span>
                <button
                  type="button"
                  onClick={() => setRecommendations(!recommendations)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors p-0.5 ${
                    recommendations ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                      recommendations ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Stay updated with key milestones of your automations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
