import { useEffect, useState } from 'react';
import {
  AtSign,
  CheckCircle2,
  ChevronRight,
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Radio,
  Send,
  X,
} from 'lucide-react';

interface ChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectChannel?: (channel: string) => void;
}

const channels = [
  { name: 'Instagram', icon: Instagram, status: 'available', description: 'Mensajes directos, comentarios y respuestas a historias.' },
  { name: 'Facebook', icon: Facebook, status: 'planned', description: 'Messenger y conversaciones desde páginas.' },
  { name: 'WhatsApp', icon: MessageCircle, status: 'planned', description: 'Atención y seguimiento desde WhatsApp Business.' },
  { name: 'TikTok', icon: Radio, status: 'planned', description: 'Interacciones y mensajería de tu comunidad.' },
  { name: 'Email', icon: Mail, status: 'planned', description: 'Consultas, seguimiento y clasificación por correo.' },
  { name: 'Telegram', icon: Send, status: 'planned', description: 'Chats, grupos y comunidades.' },
  { name: 'SMS', icon: Phone, status: 'planned', description: 'Mensajes transaccionales y recordatorios.' },
] as const;

export function ChannelsModal({ isOpen, onClose, onConnectChannel }: ChannelsModalProps) {
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function selectChannel(name: string, status: 'available' | 'planned') {
    if (status === 'planned') {
      setNotice(`${name} estará disponible en una próxima integración.`);
      return;
    }
    if (onConnectChannel) {
      onConnectChannel(name);
      return;
    }
    setNotice('Instagram está preparado en la aplicación. La conexión se habilitará al completar la autorización de Meta.');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="channels-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-t-2xl bg-panel text-ink shadow-[0_28px_100px_-36px_rgba(0,0,0,.8)] sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-5 border-b border-ink/10 px-5 py-5 sm:px-6">
          <div>
            <h2 id="channels-title" className="font-display text-xl font-extrabold tracking-[-.02em]">Canales</h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-ink/55">Conecta cada proveedor cuando la integración esté verificada. Elegirlo aquí no lo activa.</p>
          </div>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            aria-label="Cerrar canales"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink/50 transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            <X size={20} />
          </button>
        </header>

        <div className="max-h-[calc(92dvh-104px)] overflow-y-auto px-5 py-5 sm:px-6">
          {notice && (
            <div role="status" aria-live="polite" className="mb-5 flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-ink/70">
              <AtSign size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <span>{notice}</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {channels.map(({ name, icon: Icon, status, description }) => (
              <button
                key={name}
                type="button"
                onClick={() => selectChannel(name, status)}
                className="group flex min-h-[126px] flex-col items-start rounded-2xl border border-ink/10 bg-canvas/60 p-4 text-left transition-[border-color,background-color,transform] duration-150 hover:border-ink/20 active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink/70">
                    <Icon size={19} />
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status === 'available' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-ink/5 text-ink/45'}`}>
                    {status === 'available' && <CheckCircle2 size={12} />}
                    {status === 'available' ? 'Preparado' : 'Próximamente'}
                  </span>
                </span>
                <strong className="mt-4 text-sm font-bold">{name}</strong>
                <span className="mt-1 flex-1 text-xs leading-5 text-ink/50">{description}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ink/45 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                  {status === 'available' ? 'Revisar conexión' : 'Ver estado'}
                  <ChevronRight size={13} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
