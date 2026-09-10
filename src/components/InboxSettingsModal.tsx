import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface InboxSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InboxSettingsModal({ isOpen, onClose }: InboxSettingsModalProps) {
  const [behavior, setBehavior] = useState<'automatic' | 'manual'>('automatic');
  const [conversationsVisibility, setConversationsVisibility] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      id="inbox-settings-backdrop"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        id="inbox-settings-modal"
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
            Inbox
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* BEHAVIOR */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Behavior
            </h3>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#212124]">
              {/* Automatic */}
              <div
                onClick={() => setBehavior('automatic')}
                className="flex cursor-pointer items-center justify-between border-b border-zinc-800/80 p-4 transition hover:bg-zinc-800/40"
              >
                <span className="text-sm font-medium text-white">Automatic</span>
                <div
                  className={`grid h-5 w-5 place-items-center rounded-full border ${
                    behavior === 'automatic'
                      ? 'border-white bg-white text-zinc-900'
                      : 'border-zinc-500 bg-transparent'
                  }`}
                >
                  {behavior === 'automatic' && <div className="h-2 w-2 rounded-full bg-zinc-900" />}
                </div>
              </div>

              {/* Manual */}
              <div
                onClick={() => setBehavior('manual')}
                className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-zinc-800/40"
              >
                <span className="text-sm font-medium text-white">Manual</span>
                <div
                  className={`grid h-5 w-5 place-items-center rounded-full border ${
                    behavior === 'manual'
                      ? 'border-white bg-white text-zinc-900'
                      : 'border-zinc-500 bg-transparent'
                  }`}
                >
                  {behavior === 'manual' && <div className="h-2 w-2 rounded-full bg-zinc-900" />}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              Use "Automatic" to track all conversations; unexpected messages show as "Open." Use "Manual" to track only agent-required chats; they're marked "Done" unless manually opened.
            </p>
          </div>

          {/* Conversations visibility */}
          <div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#212124] p-4">
              <span className="text-sm font-medium text-zinc-300">Conversations visibility</span>
              <button
                type="button"
                onClick={() => setConversationsVisibility(!conversationsVisibility)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors p-0.5 ${
                  conversationsVisibility ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                    conversationsVisibility ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
              Agents can access all chats unless disabled, then they can only see new or assigned ones.
            </p>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-xl border border-zinc-800 bg-[#212124] px-5 py-3 text-sm font-semibold text-blue-400 transition hover:bg-zinc-800/80 active:scale-[0.99]"
            >
              Close all open chats
            </button>
            {showConfirm && (
              <p className="mt-2 text-xs text-emerald-400 animate-rise flex items-center gap-1.5">
                <Check size={14} /> Todas las conversaciones abiertas han sido cerradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
