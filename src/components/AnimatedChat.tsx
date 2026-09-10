import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image as ImageIcon, PlusCircle, MoreHorizontal, Phone, Video, ChevronLeft } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  delay: number;
}

const MESSAGES: Message[] = [
  { id: '1', sender: 'user', text: '¡Hola! Me interesa saber más sobre sus servicios.', delay: 1000 },
  { id: '2', sender: 'bot', text: '¡Hola! 👋 Gracias por escribirnos. Soy tu asistente virtual.', delay: 2500 },
  { id: '3', sender: 'bot', text: 'Para ayudarte mejor, ¿estás buscando información sobre planes o necesitas soporte técnico?', delay: 4000 },
  { id: '4', sender: 'user', text: 'Quisiera ver los planes, por favor.', delay: 6500 },
  { id: '5', sender: 'bot', text: '¡Claro! Manejamos planes desde Básico hasta Enterprise.', delay: 8000 },
  { id: '6', sender: 'bot', text: 'Puedes revisarlos a detalle aquí: stage-labs.ai/planes', delay: 9500 },
];

export function AnimatedChat() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    
    const runAnimation = () => {
      setVisibleMessages([]);
      setIsTyping(false);
      
      MESSAGES.forEach((msg, index) => {
        // Show typing indicator before bot messages
        if (msg.sender === 'bot') {
          const typingTimeout = setTimeout(() => {
            setIsTyping(true);
          }, msg.delay - 1000);
          timeouts.push(typingTimeout);
        }

        const msgTimeout = setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
        }, msg.delay);
        timeouts.push(msgTimeout);
      });

      // Loop animation
      const resetTimeout = setTimeout(() => {
        runAnimation();
      }, MESSAGES[MESSAGES.length - 1].delay + 4000);
      timeouts.push(resetTimeout);
    };

    runAnimation();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Instagram-like Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          <button className="text-zinc-900">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-200">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-900 leading-none">Cliente Potencial</span>
              <span className="text-xs text-zinc-500 mt-0.5">Activo(a) ahora</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-zinc-900">
          <Phone size={22} strokeWidth={2} />
          <Video size={24} strokeWidth={2} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden bg-zinc-50/50 p-4 relative flex flex-col justify-end">
        <div className="space-y-4 overflow-y-auto">
          <AnimatePresence>
            {visibleMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#0d5c58] flex items-center justify-center mr-2 mt-auto mb-1">
                    <span className="text-[10px] font-bold text-white">AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-zinc-200 text-zinc-900 rounded-br-sm'
                      : 'bg-white border border-zinc-100 text-zinc-800 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-start items-end"
              >
                <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#0d5c58] flex items-center justify-center mr-2 mb-1">
                  <span className="text-[10px] font-bold text-white">AI</span>
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white border border-zinc-100 px-4 py-3 shadow-sm">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Instagram-like Input Area */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 border-t border-zinc-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d5c58] text-white shadow-sm">
          <ImageIcon size={18} strokeWidth={2.5} />
        </div>
        <div className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-400">
          Envía un mensaje...
        </div>
        <div className="flex items-center justify-center text-zinc-900">
          <PlusCircle size={24} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
