import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, animate, useReducedMotion } from 'motion/react';
import { Image as ImageIcon, PlusCircle, ChevronLeft } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  delay: number;
}

const chatTranslations = {
  ES: [
    { id: '1', sender: 'user', text: '¡Hola! Me interesa saber más sobre sus servicios. 🚀', delay: 500 },
    { id: '2', sender: 'bot', text: '¡Hola! 👋 Gracias por escribirnos. Soy el asistente virtual de Stage.', delay: 1800 },
    { id: '3', sender: 'bot', text: 'Para ayudarte mejor, ¿estás buscando información sobre planes o necesitas soporte técnico?', delay: 3300 },
    { id: '4', sender: 'user', text: 'Quisiera ver los planes, por favor.', delay: 5000 },
    { id: '5', sender: 'bot', text: 'Claro. Tenemos Launch, Pulse e Infinity según el volumen y los canales de tu operación.', delay: 6500 },
    { id: '6', sender: 'bot', text: 'Puedes compararlos en stagelaboratories.com/pricing.', delay: 8000 },
  ],
  EN: [
    { id: '1', sender: 'user', text: 'Hi! I am interested in learning more about your services. 🚀', delay: 500 },
    { id: '2', sender: 'bot', text: 'Hello! 👋 Thanks for reaching out. I am your Stage virtual assistant.', delay: 1800 },
    { id: '3', sender: 'bot', text: 'To assist you better, are you looking for pricing plans or technical support?', delay: 3300 },
    { id: '4', sender: 'user', text: 'I would like to see the pricing plans, please.', delay: 5000 },
    { id: '5', sender: 'bot', text: 'Sure. We offer Launch, Pulse, and Infinity based on your volume and channels.', delay: 6500 },
    { id: '6', sender: 'bot', text: 'Compare them at stagelaboratories.com/pricing.', delay: 8000 },
  ],
  PT: [
    { id: '1', sender: 'user', text: 'Olá! Estou interessado em saber mais sobre seus serviços. 🚀', delay: 500 },
    { id: '2', sender: 'bot', text: 'Olá! 👋 Obrigado por nos contatar. Sou o assistente virtual do Stage.', delay: 1800 },
    { id: '3', sender: 'bot', text: 'Para ajudar melhor, você está procurando informações sobre planos ou suporte técnico?', delay: 3300 },
    { id: '4', sender: 'user', text: 'Gostaria de ver os planos, por favor.', delay: 5000 },
    { id: '5', sender: 'bot', text: 'Claro. Oferecemos Launch, Pulse e Infinity conforme seu volume e seus canais.', delay: 6500 },
    { id: '6', sender: 'bot', text: 'Compare em stagelaboratories.com/pricing.', delay: 8000 },
  ]
} as const;

export function AnimatedChat({ lang = 'ES' }: { lang?: 'ES' | 'EN' | 'PT' }) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const messages = chatTranslations[lang];
  const displayedMessages = reduceMotion ? messages : visibleMessages;

  useEffect(() => {
    const viewport = containerRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    let movement: ReturnType<typeof animate> | undefined;
    const followConversation = () => {
      const offset = Math.max(0, content.scrollHeight - viewport.clientHeight);
      movement?.stop();
      movement = animate(content, { transform: `translate3d(0, -${offset}px, 0)` }, {
        duration: reduceMotion ? 0 : 0.5, ease: [0.23, 1, 0.32, 1],
      });
    };
    const observer = new ResizeObserver(followConversation);
    observer.observe(viewport);
    observer.observe(content);
    followConversation();
    return () => { observer.disconnect(); movement?.stop(); };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const viewport = containerRef.current;
    if (!viewport) return;
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let playing = false;
    const clearSequence = () => {
      timeouts.forEach(clearTimeout);
      timeouts = [];
    };
    const schedule = (callback: () => void, delay: number) => {
      timeouts.push(setTimeout(callback, delay));
    };
    const runSequence = () => {
      clearSequence();
      setVisibleMessages([]);
      setIsTyping(false);
      messages.forEach((msg) => {
        if (msg.sender === 'bot') schedule(() => setIsTyping(true), msg.delay - 650);
        schedule(() => {
          setIsTyping(false);
          setVisibleMessages(previous => [...previous, msg]);
        }, msg.delay);
      });
      schedule(runSequence, 11500);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !playing) {
        playing = true;
        runSequence();
      } else if (!entry.isIntersecting && playing) {
        playing = false;
        clearSequence();
      }
    }, { threshold: 0.25 });
    observer.observe(viewport);
    return () => { observer.disconnect(); clearSequence(); };
  }, [messages, reduceMotion]);

  return (
    <div className="flex h-full w-full flex-col bg-white overflow-hidden rounded-[2rem] shadow-inner relative z-10">
      {/* Instagram-like Header */}
      <div className="relative z-20 flex items-center justify-between border-b border-zinc-100 bg-white/90 px-4 py-3 backdrop-blur-md pointer-events-none">
        <div className="flex items-center gap-3">
          <button className="text-zinc-900 transition-transform active:scale-95">
            <ChevronLeft size={28} strokeWidth={2} className="-ml-2" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-zinc-200">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-semibold text-zinc-900 leading-none">Cliente Potencial</span>
              </div>
              <span className="text-xs text-zinc-500 mt-1">Activo(a) ahora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      {/* Added a subtle chat wallpaper background to make it look alive */}
      <div 
        ref={containerRef}
        className="min-h-0 flex-1 overflow-hidden bg-[#fafafa] relative pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 100% 100%, rgba(13, 92, 88, 0.03) 0%, transparent 50%), radial-gradient(circle at 0% 0%, rgba(13, 92, 88, 0.02) 0%, transparent 50%)`
        }}
      >
        <div ref={contentRef} className="flex flex-col px-4 pb-4 pt-8">
          
          {/* Instagram Chat Profile Header */}
          <div className="flex flex-col items-center justify-center pb-6 pt-2">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-zinc-200 mb-2 shadow-sm">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
                alt="Profile Large" 
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 leading-tight">Cliente Potencial</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Instagram</p>
            <p className="text-xs text-zinc-500 mt-0.5 text-center px-2">12 mil seguidores · 143 publicaciones</p>
            <button className="mt-3 rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-200">
              Ver perfil
            </button>
          </div>

          <div className="flex justify-center mb-4">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-zinc-100/50 px-2.5 py-1 rounded-full">
              Hoy 10:42 a.m.
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {displayedMessages.map((msg, index) => {
                const isLast = index === displayedMessages.length - 1;
                return (
                  <motion.div
                    key={msg.id}
                    initial={reduceMotion ? false : { opacity: 0, transform: 'translate3d(0, 12px, 0)' }}
                    animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#126769] flex items-center justify-center mr-1.5 mt-auto mb-0.5 shadow-sm">
                        <span className="text-[9px] font-bold text-white tracking-tighter">AI</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div
                        className={`max-w-[210px] rounded-[1rem] px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-[#126769] to-[#126769] text-white rounded-br-sm'
                            : 'bg-white border border-zinc-100/80 text-zinc-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {/* Visto status for user message */}
                      {msg.sender === 'user' && isLast && !isTyping && (
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-[11px] text-zinc-400 mt-1 ml-auto mr-1"
                        >
                          Visto
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Typing Indicator */}
              {isTyping && !reduceMotion && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, transform: 'translate3d(0, 8px, 0)' }}
                  animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="flex justify-start items-end mt-3"
                >
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#126769] flex items-center justify-center mr-1.5 mb-0.5 shadow-sm">
                    <span className="text-[9px] font-bold text-white tracking-tighter">AI</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-[1rem] rounded-bl-sm bg-white border border-zinc-100/80 px-3.5 py-3 shadow-sm">
                    <motion.div
                      animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0, ease: "easeInOut" }}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2, ease: "easeInOut" }}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4, ease: "easeInOut" }}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Instagram-like Input Area */}
      <div className="flex flex-col bg-white pb-3 pt-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1">
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[#126769] transition-colors hover:bg-zinc-200">
            <PlusCircle size={18} strokeWidth={1.5} />
          </button>
          
          <div className="flex flex-1 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50/50 pl-3 pr-1 py-1">
            <span className="flex-1 text-[12px] text-zinc-400 truncate">
              Mensaje...
            </span>
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <ImageIcon size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

