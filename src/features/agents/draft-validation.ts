import { localPdfMessage } from './context-pdf.ts';
export const agentLimits = { name: 80, business_name: 120, business_description: 8000 } as const;
export function draftValidationError(draft: { name: string; business_name: string; business_description: string }): string | null {
  for (const [field, label, minimum] of [['name', 'Nombre del agente', 2], ['business_name', 'Nombre de la empresa', 2], ['business_description', 'Descripción del negocio', 20]] as const) {
    if ([...draft[field].trim()].length < minimum) return label + ': escribe al menos ' + minimum + ' caracteres.';
    if ([...draft[field]].length > agentLimits[field]) return label + ': el máximo es ' + agentLimits[field] + ' caracteres.';
  }
  return null;
}
export function safeAgentError(error: unknown): string {
  const pdfMessage = localPdfMessage(error);
  if (pdfMessage) return pdfMessage;
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === '42501') return 'No tienes permiso para guardar en este espacio. Revisa tu rol con el administrador.';
  if (code === '23514' || code === '23502' || code === '22023') return 'Revisa los campos obligatorios y sus límites antes de guardar.';
  if (code === '23503') return 'El espacio o recurso cambió. Vuelve a cargarlo antes de guardar.';
  return 'No pudimos completar el guardado. Conservamos tus datos; revisa la conexión e inténtalo nuevamente.';
}
