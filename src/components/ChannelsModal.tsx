import { useState } from 'react';
import { X, MoreVertical, MessageCircle, Send, Phone, Mail, ChevronRight, Info } from 'lucide-react';

interface ChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectChannel?: (channel: string) => void;
}

export function ChannelsModal({ isOpen, onClose, onConnectChannel }: ChannelsModalProps) {
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div
      id="channels-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        id="channels-modal"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-[#171717] text-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast */}
        {toast && (
          <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-xs font-medium text-white shadow-xl">
            {toast}
          </div>
        )}

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
            Channels
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-6 pb-8">
          {/* CONNECTED CHANNELS */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Connected Channels
            </h3>

            {/* Instagram connected card */}
            <div className="rounded-2xl border border-blue-900/40 bg-gradient-to-b from-[#0e1e38] to-[#0a1528] p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-sm text-white">Instagram</span>
                </div>
                <span className="text-xs font-semibold text-blue-300">Connected ✓</span>
              </div>

              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Supercharge your social media marketing with Instagram Automation.
              </p>

              {/* Sub-account profile info */}
              <div className="mt-4 flex items-center justify-between border-t border-blue-800/40 pt-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 overflow-hidden rounded-full bg-zinc-700">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-semibold text-white">svrnx___</span>
                </div>
                <button
                  onClick={() => showToast('Opciones de cuenta svrnx___')}
                  className="text-zinc-400 hover:text-white"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* CONNECT NEW CHANNEL TO THE ACCOUNT */}
          <div>
            <h3 className="mb-2 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Connect New Channel to the Account
            </h3>

            <div className="space-y-3">
              {/* Facebook */}
              <div
                onClick={() => {
                  if (onConnectChannel) onConnectChannel('Facebook');
                  showToast('Conectando Facebook Messenger...');
                }}
                className="cursor-pointer rounded-2xl border border-zinc-800 bg-[#212124] p-4 transition hover:bg-zinc-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white">
                      <MessageCircle size={15} />
                    </div>
                    <span className="font-bold text-sm text-white">Facebook</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-0.5">
                    Connect <ChevronRight size={13} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Use the #1 Messenger chatbot and create meaningful relationships with your customers.
                </p>
              </div>

              {/* TikTok */}
              <div
                onClick={() => {
                  if (onConnectChannel) onConnectChannel('TikTok');
                  showToast('Conectando TikTok...');
                }}
                className="cursor-pointer rounded-2xl border border-zinc-800 bg-[#212124] p-4 transition hover:bg-zinc-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-black text-cyan-400 border border-zinc-700">
                      <span className="font-black text-xs">TT</span>
                    </div>
                    <span className="font-bold text-sm text-white">TikTok</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-0.5">
                    Connect <ChevronRight size={13} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Elevate your marketing with TikTok seamless automation.
                </p>
              </div>

              {/* Telegram */}
              <div
                onClick={() => showToast('Guía para conectar Telegram')}
                className="cursor-pointer rounded-2xl border border-zinc-800 bg-[#212124] p-4 transition hover:bg-zinc-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#229ED9] text-white">
                      <Send size={14} className="-translate-x-0.5 translate-y-0.5" />
                    </div>
                    <span className="font-bold text-sm text-white">Telegram</span>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    How to connect <Info size={13} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Unleash the power of limitless Telegram messaging automation.
                </p>
              </div>

              {/* WhatsApp */}
              <div
                onClick={() => showToast('Guía para conectar WhatsApp')}
                className="cursor-pointer rounded-2xl border border-zinc-800 bg-[#212124] p-4 transition hover:bg-zinc-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#25D366] text-white">
                      <Phone size={14} />
                    </div>
                    <span className="font-bold text-sm text-white">WhatsApp</span>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    How to connect <Info size={13} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Choose the most popular mobile messaging app in the world and reach 2 billion users.
                </p>
              </div>

              {/* SMS */}
              <div
                onClick={() => showToast('Guía para configurar SMS')}
                className="cursor-pointer rounded-2xl border border-zinc-800 bg-[#212124] p-4 transition hover:bg-zinc-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white">
                      <MessageCircle size={14} />
                    </div>
                    <span className="font-bold text-sm text-white">SMS</span>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    How to connect <Info size={13} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Collect phone numbers and reengage your contacts via text.
                </p>
              </div>

              {/* Email */}
              <div
                onClick={() => showToast('Guía para configurar Email')}
                className="cursor-pointer rounded-2xl border border-zinc-800 bg-[#212124] p-4 transition hover:bg-zinc-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-purple-600 text-white">
                      <Mail size={14} />
                    </div>
                    <span className="font-bold text-sm text-white">Email</span>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    How to connect <Info size={13} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Use Email marketing for automation and rich content campaigns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
