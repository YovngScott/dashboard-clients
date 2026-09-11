export const LANDING_URL = 'https://stage-labs.ai.studio';

export type StagePlan = {
  id: 'launch' | 'pulse' | 'infinity'; name: string; price: number; audience: string;
  summary: string; capacity: string; emailLimit: string; seats: string; channels: string;
  extraSeat: string; featured?: boolean;
};

/** Keep aligned with STAGE-LANDING/src/lib/pricing-copy.ts. */
export const STAGE_PLANS: StagePlan[] = [
  { id: 'launch', name: 'Launch', price: 29, audience: 'Para empezar con foco', summary: 'La base para conectar las conversaciones que más mueven tu operación.', capacity: '5.000 contactos activos', emailLimit: '25.000 correos al mes', seats: '3 usuarios incluidos', channels: '4 canales a elección', extraSeat: '$5 / mes por usuario extra' },
  { id: 'pulse', name: 'Pulse', price: 79, audience: 'Para operaciones en expansión', summary: 'Todos tus canales conectados para que cada conversación llegue con contexto.', capacity: '15.000 contactos activos', emailLimit: '75.000 correos al mes', seats: '6 usuarios incluidos', channels: 'Todos los canales', extraSeat: '$4 / mes por usuario extra', featured: true },
  { id: 'infinity', name: 'Infinity', price: 149, audience: 'Para operación crítica', summary: 'Capacidad para equipos que ya no pueden depender de tareas manuales.', capacity: 'Contactos activos ilimitados', emailLimit: '250.000 correos al mes', seats: '15 usuarios incluidos', channels: 'Todos los canales', extraSeat: '$3 / mes por usuario extra' },
];

export const STAGE_CHANNELS = ['WhatsApp', 'Instagram', 'TikTok', 'Telegram', 'Facebook', 'Gmail', 'Outlook', 'Voice AI'] as const;
