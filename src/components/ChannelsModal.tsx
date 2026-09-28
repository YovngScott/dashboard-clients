import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  X,
} from 'lucide-react';
import { FacebookIcon, GmailIcon, InstagramIcon, TelegramIcon, TikTokIcon, WhatsAppIcon } from './BrandIcons';

interface ChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectChannel?: (channel: string) => void;
  connectedChannels?: string[];
}

const channels: Array<{ name: string; icon: ReactNode; brand: string; status: 'available' | 'planned'; description: string; readiness: string }> = [
  { name: 'Instagram', icon: <InstagramIcon />, brand: 'instagram', status: 'available', description: 'Mensajes directos, comentarios y respuestas a historias.', readiness: 'La configuración inicial está preparada. Falta habilitar la autorización de Meta para conectar la cuenta.' },
  { name: 'Facebook', icon: <FacebookIcon />, brand: 'facebook', status: 'planned', description: 'Messenger y conversaciones desde páginas.', readiness: 'La conexión requiere autorizar una página de Facebook y sus permisos de Messenger.' },
  { name: 'WhatsApp', icon: <WhatsAppIcon />, brand: 'whatsapp', status: 'planned', description: 'Atención y seguimiento desde WhatsApp Business.', readiness: 'La conexión requiere autorizar una cuenta de WhatsApp Business.' },
  { name: 'TikTok', icon: <TikTokIcon />, brand: 'tiktok', status: 'planned', description: 'Interacciones y mensajería de tu comunidad.', readiness: 'La conexión requiere habilitar los permisos de mensajería de TikTok.' },
  { name: 'Email', icon: <GmailIcon />, brand: 'email', status: 'planned', description: 'Consultas, seguimiento y clasificación por correo.', readiness: 'La conexión requiere autorizar un buzón de correo.' },
  { name: 'Telegram', icon: <TelegramIcon />, brand: 'telegram', status: 'planned', description: 'Chats, grupos y comunidades.', readiness: 'La conexión requiere configurar y autorizar un bot de Telegram.' },
  { name: 'SMS', icon: <Phone size={19} />, brand: 'sms', status: 'planned', description: 'Mensajes transaccionales y recordatorios.', readiness: 'La conexión requiere configurar un proveedor y autorizar el número de envío.' },
];

export function ChannelsModal({ isOpen, onClose, connectedChannels = [] }: ChannelsModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setSelected(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
      if (event.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('[aria-labelledby="channels-title"]');
        const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [closeModal, isOpen]);

  if (!isOpen) return null;
  const selectedChannel = channels.find((channel) => channel.name === selected);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="channels-title"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-panel text-ink shadow-[0_28px_100px_-36px_rgba(0,0,0,.8)] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-ink/10 px-5 py-5 sm:px-6">
          <div>
            {selectedChannel && (
              <button type="button" onClick={() => setSelected(null)} className="mb-3 inline-flex min-h-9 items-center gap-1 rounded-lg pr-2 text-xs font-bold text-ink/50 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500">
                <ChevronLeft size={16} /> Todos los canales
              </button>
            )}
            <h2 id="channels-title" className="font-display text-xl font-extrabold tracking-[-.02em]">{selectedChannel ? selectedChannel.name : 'Canales'}</h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-ink/55">
              {selectedChannel ? selectedChannel.description : 'Elige hasta tres canales en Launch. Conectarlos aquí no activa respuestas automáticas.'}
            </p>
          </div>
          <button autoFocus type="button" onClick={closeModal} aria-label="Cerrar canales" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink/50 transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500">
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {selectedChannel ? (
            <div className="mx-auto max-w-xl py-3">
              <div className="flex items-start gap-4 rounded-2xl border border-ink/10 bg-canvas/70 p-5 sm:p-6">
                <span className={`channel-brand-icon channel-brand-icon--${selectedChannel.brand} grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink/5 text-ink/65`}>{selectedChannel.icon}</span>
                <div>
                  <p className="text-sm font-bold">{connectedChannels.includes(selectedChannel.name) ? 'Canal conectado' : 'Conexión pendiente'}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/55">{selectedChannel.readiness}</p>
                  <p className="mt-4 text-xs leading-5 text-ink/45">Primero se autorizará el acceso. Después podrás seleccionar este canal para un agente y decidir cuándo activarlo.</p>
                </div>
              </div>
              {selectedChannel.status === 'available' && !connectedChannels.includes(selectedChannel.name) && (
                <button type="button" disabled className="mt-5 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink opacity-55" title="La autorización aún no está disponible">
                  Esperando autorización de Meta
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {channels.map(({ name, icon, brand, description }) => {
                const connected = connectedChannels.includes(name);
                return (
                  <button key={name} type="button" onClick={() => setSelected(name)} className={`channel-card group flex min-h-[142px] flex-col items-start rounded-2xl border border-ink/10 bg-canvas/60 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${connected ? 'is-connected' : ''}`}>
                    <span className="flex w-full items-start justify-between gap-3">
                      <span className={`channel-brand-icon channel-brand-icon--${brand} grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink/65`}>{icon}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${connected ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-violet-500/10 text-violet-700 dark:text-violet-300'}`}>
                        {connected ? <CheckCircle2 size={12} /> : null}
                        {connected ? 'Conectado' : 'Configurar'}
                      </span>
                    </span>
                    <strong className="mt-4 text-sm font-bold">{name}</strong>
                    <span className="mt-1 flex-1 text-xs leading-5 text-ink/50">{description}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-700 dark:text-violet-300">Configurar canal <ChevronRight size={13} /></span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
