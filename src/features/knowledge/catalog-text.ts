/** Deterministic, local-only normalization. No model, network, storage or execution. */
export const CATALOG_LIMITS = { inputCodeUnits: 100_000, inputBytes: 128_000, records: 200, line: 2_000, name: 120, price: 64, currency: 16, variant: 120, availability: 80 } as const;
export const PARSER_VERSION = 'catalog-text-v1';
export const CURRENCIES = ['USD','EUR','DOP','BOB','MXN','ARS','COP','CLP','PEN','BRL','GBP','CAD','AUD','JPY','CNY','INR'] as const;
export type CatalogScope = Readonly<{ userId: string; organizationId: string; agentId: string }>;
export type Fields = { name: string; price: string; currency: string; variant: string; availability: string };
export type Issue = { code: string; message: string };
export type Facts = { name: string; price: { amount: string; currency: string } | null; variant: string | null; availability: 'in_stock' | 'out_of_stock' | 'on_request' | 'unknown' };
export type Approval = Readonly<{ facts: Facts; scope: CatalogScope; sourceHash: string; parserVersion: string; line: number; recordRevision: number }>;
export type Entry = { id: string; line: number; start: number; end: number; original: Readonly<Fields>; fields: Fields; issues: Issue[]; revision: number; excluded: boolean; approval: Approval | null };
export type Catalog = { source: Readonly<{ raw: string; hash: string; parserVersion: string; scope: CatalogScope }>; entries: Entry[] };
export class CatalogInputError extends Error {}
const normalizeKey = (s: string) => s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const unspecified = (s: string) => /^(no especificad[oa]|sin especificar|not specified|unknown|desconocid[oa]|sin precio|no price)$/.test(normalizeKey(s));
export const sameScope = (a: CatalogScope, b: CatalogScope) => a.userId === b.userId && a.organizationId === b.organizationId && a.agentId === b.agentId;
const suspicious = (s: string) => /ignore\s+(all\s+)?(previous|prior|system)\s+instructions|ignora.{0,30}instrucciones|(?:^|\n)\s*(system|developer|sistema)\s*:|<\/?(?:script|system|developer)\b|javascript\s*:|revela.{0,30}(secreto|contraseñ|token)/iu.test(s);

export function normalizeAmount(raw: string): string | null {
  let s = raw.trim().replace(/\u00a0|\u202f/g, ' ');
  if (s.length > CATALOG_LIMITS.price || !/^[\d., ]+$/.test(s)) return null;
  if (s.includes(' ')) {
    if (!/^\d{1,3}(?: \d{3})+(?:[.,]\d{1,2})?$/.test(s)) return null;
    s = s.split(' ').join('');
  }
  const comma = s.lastIndexOf(','); const dot = s.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.'; const group = decimal === ',' ? '.' : ',';
    const parts = s.split(decimal);
    if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[1])) return null;
    if (!(new RegExp('^\\d{1,3}(?:\\' + group + '\\d{3})+$')).test(parts[0])) return null;
    s = parts[0].split(group).join('') + '.' + parts[1];
  } else if (comma >= 0 || dot >= 0) {
    const sep = comma >= 0 ? ',' : '.'; const parts = s.split(sep);
    if (parts.length === 2) {
      // A single separator followed by 3 digits is intentionally ambiguous.
      if (!/^\d+$/.test(parts[0]) || !/^\d{1,2}$/.test(parts[1])) return null;
      s = parts[0] + '.' + parts[1];
    } else {
      if (!/^\d{1,3}$/.test(parts[0]) || !parts.slice(1).every(p => /^\d{3}$/.test(p))) return null;
      s = parts.join('');
    }
  }
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(s)) return null;
  const [whole, fraction = ''] = s.split('.');
  const normalizedFraction = fraction.replace(/0+$/, '');
  return whole.replace(/^0+(?=\d)/,'') + (normalizedFraction ? '.' + normalizedFraction : '');
}

export function inspectFields(fields: Fields): { facts: Facts; issues: Issue[] } {
  const issues: Issue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });
  for (const key of Object.keys(fields) as (keyof Fields)[]) {
    if (fields[key].length > CATALOG_LIMITS[key]) add('limit_' + key, 'El campo ' + key + ' supera su límite.');
    if (Array.from(fields[key]).some(char => { const point=char.codePointAt(0)!; return point<32 || point===127 || (point>=0x202a&&point<=0x202e) || (point>=0x2066&&point<=0x2069); })) add('control_character','Hay caracteres de control que requieren revisión.');
  }
  const name = fields.name.trim().normalize('NFC');
  if (!name) add('missing_name','Escribe el nombre del producto o servicio.');
  let currency = fields.currency.trim().toUpperCase();
  let priceRaw = fields.price.trim();
  const explicit = priceRaw.match(/^(USD|EUR|DOP|BOB|MXN|ARS|COP|CLP|PEN|BRL|GBP|CAD|AUD|JPY|CNY|INR|US\$|RD\$|€|£)\s*/i)
    ?? priceRaw.match(/\s*(USD|EUR|DOP|BOB|MXN|ARS|COP|CLP|PEN|BRL|GBP|CAD|AUD|JPY|CNY|INR|€|£)$/i);
  if (explicit) {
    const token = explicit[1].toUpperCase();
    const detected = ({'US$':'USD','RD$':'DOP','€':'EUR','£':'GBP'} as Record<string,string>)[token] ?? token;
    if (currency && currency !== detected) add('currency_conflict','La moneda del precio no coincide con la columna Moneda.');
    else currency = detected;
    priceRaw = priceRaw.replace(explicit[0], '').trim();
  }
  if (/^[$¥]/u.test(priceRaw)) {
    const symbol = priceRaw[0];
    if (!currency) add('ambiguous_currency','El símbolo no identifica una moneda. Escribe su código, por ejemplo USD o MXN.');
    else if ((symbol === '¥' && !['JPY','CNY'].includes(currency)) || (symbol === '$' && !['USD','DOP','MXN','ARS','COP','CLP','CAD','AUD'].includes(currency))) add('currency_conflict','El símbolo y el código de moneda no coinciden.');
    priceRaw = priceRaw.slice(1).trim();
  }
  const unknownPrice = unspecified(priceRaw);
  const amount = unknownPrice ? null : normalizeAmount(priceRaw);
  if (!priceRaw) add('missing_price','Falta precio. Escríbelo o indica “no especificado”.');
  else if (!unknownPrice && amount === null) add('ambiguous_price','Precio ambiguo o inválido. Usa un importe único como 1234,56 o “no especificado”.');
  if (amount !== null && !(CURRENCIES as readonly string[]).includes(currency)) add('missing_currency','Indica una moneda explícita admitida; no se deduce del idioma.');
  if (amount?.includes('.') && ['JPY','CLP'].includes(currency)) add('currency_precision','Esta moneda no admite fracciones en esta revisión.');
  if (unknownPrice && currency && !unspecified(currency) && !(CURRENCIES as readonly string[]).includes(currency)) add('invalid_currency','Revisa el código de moneda.');
  const variantRaw = fields.variant.trim();
  if (!variantRaw) add('missing_variant','Indica una variante o escribe “no especificada”.');
  if (/[/|;]|\s(?:o|or)\s/i.test(variantRaw)) add('ambiguous_variant','Separa las variantes en registros distintos.');
  const availabilityRaw = normalizeKey(fields.availability);
  const availability = /^(en stock|disponible|available|in stock)$/.test(availabilityRaw) ? 'in_stock'
    : /^(agotado|sin stock|no disponible|out of stock|unavailable)$/.test(availabilityRaw) ? 'out_of_stock'
    : /^(bajo pedido|por encargo|on request|preorder)$/.test(availabilityRaw) ? 'on_request' : 'unknown';
  if (!unspecified(availabilityRaw) && availability === 'unknown') add('ambiguous_availability','No se puede afirmar disponibilidad. Corrige el texto o indica “no especificada”.');
  if (suspicious(Object.values(fields).join('\n'))) add('untrusted_instruction','Texto con apariencia de instrucción: no se ejecuta ni puede aprobarse.');
  return { facts: { name, price: amount !== null && (CURRENCIES as readonly string[]).includes(currency) ? {amount,currency} : null, variant: unspecified(variantRaw) ? null : variantRaw || null, availability }, issues };
}

function refresh(catalog: Catalog): Catalog {
  const entries = catalog.entries.map(entry => {
    const raw = catalog.source.raw.slice(entry.start, entry.end);
    const issues = inspectFields(entry.fields).issues;
    if (raw.length > CATALOG_LIMITS.line) issues.push({code:'long_line',message:'La línea fuente supera 2000 caracteres. Divide y vuelve a normalizar.'});
    if (suspicious(raw) && !issues.some(i => i.code === 'untrusted_instruction')) issues.push({code:'untrusted_instruction',message:'La fuente contiene una posible instrucción. Excluye esta línea; editar campos no elimina esta advertencia.'});
    if (raw.split(/\t|\||;/).length > 5) issues.push({code:'malformed',message:'La fuente tiene más de cinco columnas. Corrígela y vuelve a normalizar.'});
    return { ...entry, issues };
  });
  const groups = new Map<string, Entry[]>();
  for (const entry of entries.filter(e => !e.excluded)) {
    // Compare the same semantics that approval emits: all explicit unknown
    // synonyms are null, not distinct variants. A tuple keeps null distinct
    // from a genuine variant named "null" without inventing a placeholder.
    const { name, variant } = inspectFields(entry.fields).facts;
    const key = JSON.stringify([normalizeKey(name), variant === null ? null : normalizeKey(variant)]);
    const group = groups.get(key) ?? []; group.push(entry); groups.set(key,group);
  }
  for (const group of groups.values()) if (group.length > 1) for (const entry of group) entry.issues.push({code:'duplicate',message:'Nombre y variante repetidos. Revisa conflictos o excluye el duplicado.'});
  return { ...catalog, entries };
}

export async function normalizeCatalog(raw: string, scope: CatalogScope): Promise<Catalog> {
  if (typeof raw !== 'string' || !raw.trim()) throw new CatalogInputError('Pega texto antes de normalizar.');
  if (raw.length > CATALOG_LIMITS.inputCodeUnits) throw new CatalogInputError('El texto supera 100 000 caracteres. Divídelo en lotes.');
  if (new TextEncoder().encode(raw).length > CATALOG_LIMITS.inputBytes) throw new CatalogInputError('El texto supera 128 000 bytes. Divídelo en lotes.');
  if (![scope.userId,scope.organizationId,scope.agentId].every(s => typeof s === 'string' && s.length > 0 && s.length <= 120)) throw new CatalogInputError('Falta un ámbito de usuario, organización o agente válido.');
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))).map(b => b.toString(16).padStart(2,'0')).join('');
  const source = Object.freeze({raw,hash,parserVersion:PARSER_VERSION,scope:Object.freeze({...scope})});
  const entries: Entry[] = [];
  let offset = 0;
  const lines = raw.split(/(\r\n|\r|\n)/);
  for (let index=0; index<lines.length; index+=2) {
    const line = lines[index]; const start=offset; offset+=line.length+(lines[index+1]?.length??0);
    if (!line.trim()) continue;
    const delimiter = line.includes('\t') ? '\t' : line.includes('|') ? '|' : ';';
    const columns = line.split(delimiter).map(s=>s.trim());
    if (entries.length === 0 && columns.length === 5 && [/^(nombre|name)$/i,/^(precio|price)$/i,/^(moneda|currency)$/i,/^(variante|variant)$/i,/^(disponibilidad|availability)$/i].every((re,i)=>re.test(columns[i]))) continue;
    if (entries.length >= CATALOG_LIMITS.records) throw new CatalogInputError('Hay más de 200 registros. Divide el texto; no se omitió ninguna línea silenciosamente.');
    const fields: Fields = {name:columns[0]??'',price:columns[1]??'',currency:columns[2]??'',variant:columns[3]??'',availability:columns[4]??''};
    entries.push({id:hash+':'+(index/2+1),line:index/2+1,start,end:start+line.length,original:Object.freeze({...fields}),fields,issues:[],revision:0,excluded:false,approval:null});
  }
  if (!entries.length) throw new CatalogInputError('No hay registros para revisar.');
  return refresh({source,entries});
}

export function editEntry(catalog: Catalog, id: string, patch: Partial<Fields>): Catalog {
  const target = catalog.entries.find(e=>e.id===id);
  if (!target) throw new CatalogInputError('Registro no encontrado.');
  const fields = {...target.fields};
  for (const key of Object.keys(fields) as (keyof Fields)[]) if (patch[key] !== undefined) {
    if (typeof patch[key] !== 'string') throw new CatalogInputError('El campo debe ser texto.');
    fields[key]=patch[key]!;
  }
  // Cross-record duplicates can change, so every approval must be reconfirmed.
  return refresh({...catalog,entries:catalog.entries.map(e=>({...e,approval:null,...(e.id===id?{fields,revision:e.revision+1}:{})}))});
}
export function excludeEntry(catalog: Catalog,id: string,excluded: boolean): Catalog {
  if (!catalog.entries.some(e=>e.id===id)) throw new CatalogInputError('Registro no encontrado.');
  return refresh({...catalog,entries:catalog.entries.map(e=>({...e,approval:null,...(e.id===id?{excluded}:{})}))});
}
export function approveEntry(catalog: Catalog,id: string,scope: CatalogScope,confirmed: boolean): Catalog {
  if (!sameScope(catalog.source.scope,scope)) throw new CatalogInputError('El ámbito cambió. Vuelve a normalizar.');
  const reviewed = refresh(catalog); const entry=reviewed.entries.find(e=>e.id===id);
  if (!confirmed || !entry || entry.excluded || entry.issues.length) throw new CatalogInputError('Corrige las advertencias y confirma la revisión de este registro.');
  const facts=inspectFields(entry.fields).facts;
  const approval: Approval=Object.freeze({facts:Object.freeze({...facts,price:facts.price?Object.freeze({...facts.price}):null}),scope:catalog.source.scope,sourceHash:catalog.source.hash,parserVersion:PARSER_VERSION,line:entry.line,recordRevision:entry.revision});
  return {...reviewed,entries:reviewed.entries.map(e=>e.id===id?{...e,approval}:e)};
}
export function approvedFacts(catalog: Catalog,scope: CatalogScope): Approval[] {
  if (!sameScope(catalog.source.scope,scope)) return [];
  return catalog.entries.filter(e=>!e.excluded&&e.approval&&!e.issues.length&&e.approval.recordRevision===e.revision).map(e=>e.approval!);
}
