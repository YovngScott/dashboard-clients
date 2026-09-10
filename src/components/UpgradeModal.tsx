import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'essential' | 'pro'>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  if (!isOpen) return null;

  return (
    <div
      id="upgrade-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        id="upgrade-modal-sheet"
        className="relative max-h-[94vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#22074d] text-white shadow-2xl sm:rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #2b0860 0%, #1c0542 50%, #12032e 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Grid Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Circular White Close Button top-right (matching image) */}
        <button
          id="upgrade-modal-close"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-8 w-8 place-items-center rounded-full bg-white text-zinc-900 shadow-md transition hover:bg-zinc-200"
          aria-label="Cerrar"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Header content */}
        <div className="relative px-6 pt-12 pb-4 text-center">
          <h2 className="mx-auto max-w-xs font-black text-2xl leading-tight tracking-tight text-white sm:text-3xl">
            12.000+ Líderes eligen Stage AI Labs.
            <br />
            Ahora es tu turno.
          </h2>

          {/* Plan Selector Pills: Free, Essential, Pro */}
          <div className="relative mt-5 flex justify-center gap-2">
            <button
              onClick={() => setSelectedPlan('free')}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                selectedPlan === 'free'
                  ? 'bg-[#7c3aed] text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setSelectedPlan('essential')}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                selectedPlan === 'essential'
                  ? 'bg-[#7c3aed] text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
            >
              Essential
            </button>
            <button
              onClick={() => setSelectedPlan('pro')}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                selectedPlan === 'pro'
                  ? 'bg-[#7c3aed] text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
            >
              Pro
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative px-5 pb-8">
          {/* FREE PLAN VIEW (Exact match to uploaded Image 7) */}
          {selectedPlan === 'free' && (
            <div className="rounded-2xl border border-white/10 bg-[#160d26]/90 p-5 backdrop-blur-md">
              <h3 className="font-extrabold text-2xl text-white">Free</h3>
              <p className="mt-1 font-bold text-sm text-white">25 <span className="font-normal text-white/80">Active Contacts/mo</span></p>

              <ul className="mt-4 space-y-2.5 text-xs text-white/85">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>2 channels (Instagram, Messenger, TikTok, Telegram)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Basic automations (up to 4 active automations)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>1 user</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Basic unified Inbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Self-serve Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Manychat branding</span>
                </li>
              </ul>

              {/* Your current plan box */}
              <div className="mt-6 flex items-center justify-between rounded-xl border border-purple-500/80 bg-purple-950/40 p-3.5 ring-1 ring-purple-500/40">
                <div className="flex items-center gap-3">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-purple-500 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="block text-[11px] text-white/70">Your current plan</span>
                    <span className="font-extrabold text-lg text-white">
                      $0<span className="text-xs font-normal text-white/70">/mo</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ESSENTIAL PLAN VIEW */}
          {selectedPlan === 'essential' && (
            <div className="rounded-2xl border border-white/10 bg-[#160d26]/90 p-5 backdrop-blur-md">
              <h3 className="font-extrabold text-2xl text-white">Essential</h3>
              <p className="mt-1 font-bold text-sm text-white">1,000 <span className="font-normal text-white/80">Active Contacts/mo</span></p>

              <ul className="mt-4 space-y-2.5 text-xs text-white/85">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>3 channels (Instagram, Messenger, TikTok, Telegram)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Unlimited automations & sequences</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>2 users</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Unified Inbox with filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Email Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>No Manychat branding</span>
                </li>
              </ul>

              <div className="mt-6 flex items-center justify-between rounded-xl border border-purple-500/80 bg-purple-950/40 p-3.5 ring-1 ring-purple-500/40">
                <div className="flex items-center gap-3">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-purple-500 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="block text-[11px] text-white/70">Starter growth</span>
                    <span className="font-extrabold text-lg text-white">
                      $15<span className="text-xs font-normal text-white/70">/mo</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRO PLAN VIEW */}
          {selectedPlan === 'pro' && (
            <div className="rounded-2xl border border-white/10 bg-[#160d26]/90 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-2xl text-white">Pro</h3>
                <span className="rounded-md bg-purple-500 px-2 py-0.5 text-[10px] font-black text-white">
                  AI
                </span>
              </div>
              <p className="mt-1 font-bold text-sm text-white">2,500 <span className="font-normal text-white/80">Active Contacts/mo</span></p>

              <ul className="mt-4 space-y-2.5 text-xs text-white/85">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>All channels (Instagram, Messenger, WhatsApp, TikTok, Telegram)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Advanced automations & broadcast campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>3+ team seats</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>AI Smart Flow Builder & dynamic responses</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>Priority Support 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                  <span>White-label: No Manychat branding</span>
                </li>
              </ul>

              {/* Pricing options */}
              <div className="mt-6 space-y-2.5">
                <div
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                    billingCycle === 'monthly'
                      ? 'border-purple-500 bg-purple-950/50 ring-1 ring-purple-500/50'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        billingCycle === 'monthly'
                          ? 'border-purple-400 bg-purple-500 text-white'
                          : 'border-white/40'
                      }`}
                    >
                      {billingCycle === 'monthly' && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="block text-[11px] text-white/70">Monthly</span>
                      <span className="font-bold text-base text-white">
                        $39<span className="text-xs font-normal text-white/60">/mo</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setBillingCycle('annually')}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                    billingCycle === 'annually'
                      ? 'border-purple-500 bg-purple-950/50 ring-1 ring-purple-500/50'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        billingCycle === 'annually'
                          ? 'border-purple-400 bg-purple-500 text-white'
                          : 'border-white/40'
                      }`}
                    >
                      {billingCycle === 'annually' && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="block text-[11px] text-white/70">Annually</span>
                      <span className="font-bold text-base text-white">
                        $349<span className="text-xs font-normal text-white/60">/yr</span>
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    25% OFF
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Find out more in FAQs */}
          <div className="mt-4 text-center">
            <span className="text-xs text-zinc-300">
              Find out more in{' '}
              <a
                href="https://stage-labs.ai.studio/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 underline hover:text-purple-300"
              >
                FAQs
              </a>
            </span>
          </div>

          {/* CTA Action Button */}
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-2xl bg-[#7c3aed] py-3.5 font-bold text-sm text-white shadow-xl transition hover:bg-[#6d28d9] active:scale-[0.99]"
          >
            {selectedPlan === 'free'
              ? 'Continue with Free'
              : selectedPlan === 'essential'
              ? 'Upgrade to Essential'
              : 'Try free for 14 days'}
          </button>

          {/* Footer links: Restore Purchase • Terms • Privacy Policy */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/50">
            <button onClick={onClose} className="hover:underline">Restore Purchase</button>
            <span>•</span>
            <a
              href="https://stage-labs.ai.studio/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-white/80"
            >
              Terms
            </a>
            <span>•</span>
            <a
              href="https://stage-labs.ai.studio/security"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-white/80"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
