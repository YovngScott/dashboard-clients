import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, PlusCircle, Phone, Video, ChevronLeft, Mic } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  delay: number;
}

const chatTranslations = {
  ES: [
    { id: '1', sender: 'user', text: '¡Hola! Me interesa saber más sobre sus servicios. 🚀', delay: 1500 },
    { id: '2', sender: 'bot', text: '¡Hola! 👋 Gracias por escribirnos. Soy el asistente virtual de Stage.', delay: 3000 },
    { id: '3', sender: 'bot', text: 'Para ayudarte mejor, ¿estás buscando información sobre planes o necesitas soporte técnico?', delay: 5000 },
    { id: '4', sender: 'user', text: 'Quisiera ver los planes, por favor.', delay: 7500 },
    { id: '5', sender: 'bot', text: '¡Claro! Manejamos planes desde Básico hasta Enterprise.', delay: 9000 },
    { id: '6', sender: 'bot', text: 'Puedes revisarlos a detalle aquí: stage-labs.ai/planes ✨', delay: 11000 },
  ],
  EN: [
    { id: '1', sender: 'user', text: 'Hi! I am interested in learning more about your services. 🚀', delay: 1500 },
    { id: '2', sender: 'bot', text: 'Hello! 👋 Thanks for reaching out. I am your Stage virtual assistant.', delay: 3000 },
    { id: '3', sender: 'bot', text: 'To assist you better, are you looking for pricing plans or technical support?', delay: 5000 },
    { id: '4', sender: 'user', text: 'I would like to see the pricing plans, please.', delay: 7500 },
    { id: '5', sender: 'bot', text: 'Sure! We offer plans ranging from Basic to Enterprise.', delay: 9000 },
    { id: '6', sender: 'bot', text: 'You can check them out in detail here: stage-labs.ai/pricing ✨', delay: 11000 },
  ],
  PT: [
    { id: '1', sender: 'user', text: 'Olá! Estou interessado em saber mais sobre seus serviços. 🚀', delay: 1500 },
    { id: '2', sender: 'bot', text: 'Olá! 👋 Obrigado por nos contatar. Sou o assistente virtual do Stage.', delay: 3000 },
    { id: '3', sender: 'bot', text: 'Para ajudar melhor, você está procurando informações sobre planos ou suporte técnico?', delay: 5000 },
    { id: '4', sender: 'user', text: 'Gostaria de ver os planos, por favor.', delay: 7500 },
    { id: '5', sender: 'bot', text: 'Claro! Oferecemos planos do Básico ao Enterprise.', delay: 9000 },
    { id: '6', sender: 'bot', text: 'Você pode conferi-los em detalhes aqui: stage-labs.ai/planos ✨', delay: 11000 },
  ]
} as const;

export function AnimatedChat({ lang = 'ES' }: { lang?: 'ES' | 'EN' | 'PT' }) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const messages = chatTranslations[lang];

  const scrollToBottom = () => {
    if (containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, isTyping]);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    
    const runAnimation = () => {
      setVisibleMessages([]);
      setIsTyping(false);
      
      messages.forEach((msg) => {
        // Show typing indicator before bot messages
        if (msg.sender === 'bot') {
          const typingTimeout = setTimeout(() => {
            setIsTyping(true);
          }, msg.delay - 1200);
          timeouts.push(typingTimeout);
        }

        const msgTimeout = setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
        }, msg.delay);
        timeouts.push(msgTimeout);
      });
    };

    runAnimation();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [lang]); // Re-run animation if language changes

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
        <div className="flex items-center gap-5 text-zinc-900">
          <Phone size={24} strokeWidth={1.5} className="cursor-pointer" />
          <Video size={26} strokeWidth={1.5} className="cursor-pointer" />
        </div>
      </div>

      {/* Chat Area */}
      {/* Added a subtle chat wallpaper background to make it look alive */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth bg-[#fafafa] relative pb-4 pointer-events-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          backgroundImage: `radial-gradient(circle at 100% 100%, rgba(13, 92, 88, 0.03) 0%, transparent 50%), radial-gradient(circle at 0% 0%, rgba(13, 92, 88, 0.02) 0%, transparent 50%)`
        }}
      >
        <div className="flex min-h-full flex-col justify-end px-4 pt-8">
          
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
              {visibleMessages.map((msg, index) => {
                const isLast = index === visibleMessages.length - 1;
                return (
                  <motion.div
                    layout
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#0d5c58] flex items-center justify-center mr-1.5 mt-auto mb-0.5 shadow-sm">
                        <span className="text-[9px] font-bold text-white tracking-tighter">AI</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div
                        className={`max-w-[210px] rounded-[1rem] px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-[#0d5c58] to-[#168a84] text-white rounded-br-sm'
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
              {isTyping && (
                <motion.div
                  layout
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex justify-start items-end mt-3"
                >
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#0d5c58] flex items-center justify-center mr-1.5 mb-0.5 shadow-sm">
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
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[#0d5c58] transition-colors hover:bg-zinc-200">
            <PlusCircle size={18} strokeWidth={1.5} />
          </button>
          
          <div className="flex flex-1 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50/50 pl-3 pr-1 py-1">
            <span className="flex-1 text-[12px] text-zinc-400 truncate">
              Mensaje...
            </span>
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <Mic size={16} strokeWidth={2} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <ImageIcon size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

