const pdfMessages = {
  mime: 'Selecciona un archivo PDF (.pdf). Otros formatos todavía no están disponibles.',
  size: 'El PDF supera el máximo de 20 MB. Reduce su tamaño o selecciona otro archivo.',
  signature: 'El archivo no tiene una firma PDF válida. Expórtalo de nuevo como PDF o selecciona otro archivo.',
  read: 'No pudimos leer el archivo seleccionado. Vuelve a seleccionarlo y comprueba que puedes abrirlo en tu equipo.',
} as const;

/** Only locally generated codes may produce specific file feedback. */
export class ContextPdfError extends Error {
  readonly reason: keyof typeof pdfMessages;
  constructor(reason: keyof typeof pdfMessages) {
    super(pdfMessages[reason]);
    this.reason = reason;
    this.name = 'ContextPdfError';
  }
}

export function localPdfMessage(error: unknown): string | null {
  return error instanceof ContextPdfError ? pdfMessages[error.reason] ?? null : null;
}

export async function validateContextPdf(file: File): Promise<void> {
  if (file.type !== 'application/pdf') throw new ContextPdfError('mime');
  if (file.size > 20 * 1024 * 1024) throw new ContextPdfError('size');
  let signature: Uint8Array;
  try { signature = new Uint8Array(await file.slice(0, 5).arrayBuffer()); }
  catch { throw new ContextPdfError('read'); }
  if (String.fromCharCode(...signature) !== '%PDF-') throw new ContextPdfError('signature');
}
