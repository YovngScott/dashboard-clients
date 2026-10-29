import { useEffect, useId, useRef, useState } from 'react';
import { approveEntry, approvedFacts, CATALOG_LIMITS, CatalogInputError, editEntry, excludeEntry, normalizeCatalog, sameScope, type Catalog, type CatalogScope, type Fields } from './catalog-text';
type Props = { scope: CatalogScope; normalize?: typeof normalizeCatalog };
const labels: Record<keyof Fields,string> = {name:'Nombre',price:'Precio',currency:'Moneda',variant:'Variante',availability:'Disponibilidad'};
const fieldHints: Record<keyof Fields,string> = {name:'Producto o servicio',price:'1234,56 o no especificado',currency:'USD, EUR, DOP…',variant:'Una variante o no especificada',availability:'disponible, agotado o no especificada'};
const controlBase = 'min-h-11 rounded-xl border border-ink/50 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const control = controlBase+' bg-panel text-ink';
const disclosure = 'min-h-11 cursor-pointer rounded py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
export function CatalogReview(props: Props) {
  return <ScopedCatalogReview key={JSON.stringify(props.scope)} {...props} />;
}
function ScopedCatalogReview({scope,normalize=normalizeCatalog}: Props) {
  const [raw,setRaw] = useState('');
  const [catalog,setCatalog] = useState<Catalog|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [confirmed,setConfirmed] = useState<Set<string>>(new Set());
  const [page,setPage] = useState(0);
  const generation = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const prefix = useId();
  useEffect(()=>()=>{generation.current++;},[]);
  useEffect(()=>{if(error) errorRef.current?.focus();},[error]);
  const sourceHash = catalog?.source.hash;
  useEffect(()=>{if(sourceHash)heading.current?.focus();},[sourceHash]);
  function sourceChange(value: string) {
    generation.current++; setBusy(false); setCatalog(null); setConfirmed(new Set()); setPage(0);
    if (value.length > CATALOG_LIMITS.inputCodeUnits) {setError('El texto supera 100 000 caracteres. No se incorporó el pegado; divide el texto en lotes.');return;}
    setRaw(value); setError('');
  }
  async function review() {
    const version=++generation.current; setBusy(true); setError(''); setCatalog(null); setConfirmed(new Set());
    try {
      const next=await normalize(raw,scope);
      if(version!==generation.current) return;
      if(!sameScope(next.source.scope,scope)||next.source.raw!==raw) throw new CatalogInputError('La fuente o el ámbito cambió. Vuelve a normalizar.');
      setCatalog(next); setPage(0);
    } catch(cause) { if(version===generation.current) setError(cause instanceof CatalogInputError?cause.message:'No pudimos normalizar este texto localmente. No se guardó nada.'); }
    finally {if(version===generation.current) setBusy(false);}
  }
  function edit(id:string,field:keyof Fields,value:string) {
    if(!catalog) return;
    setCatalog(editEntry(catalog,id,{[field]:value})); setConfirmed(new Set()); setError('');
  }
  const facts=catalog?approvedFacts(catalog,scope):[];
  return <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 text-ink sm:px-8" aria-labelledby={prefix+'-title'}>
    <header className="max-w-3xl space-y-3">
      <h1 id={prefix+'-title'} className="font-display text-3xl font-bold tracking-[-.03em]">Revisa tu catálogo textual</h1>
      <p className="text-base leading-7">Normalización determinista local. Separa la fuente de los hechos que apruebes. Nada se envía, guarda o conecta.</p>
      <p className="text-sm leading-6 text-ink/80">PDF, Excel, ingestión y conversación con IA no están disponibles en esta prueba.</p>
    </header>
    <div className="space-y-3">
      <label htmlFor={prefix+'-source'} className="block font-semibold">Texto fuente</label>
      <p id={prefix+'-format'} className="max-w-3xl text-sm leading-6">Una línea por registro: Nombre | Precio | Moneda | Variante | Disponibilidad. También se admiten tabuladores o punto y coma. El texto libre queda pendiente, no se interpreta como instrucciones. Usa “no especificado” cuando quieras conservar un dato desconocido.</p>
      <textarea id={prefix+'-source'} value={raw} onChange={e=>sourceChange(e.target.value)} aria-describedby={prefix+'-format'} rows={6} className={control+' w-full resize-y py-3 leading-6'} spellCheck={false} />
      <div className="flex flex-wrap items-center gap-4"><button type="button" onClick={()=>void review()} disabled={busy} className={controlBase+' bg-brand font-semibold text-brand-ink disabled:opacity-60'}>{busy?'Normalizando texto':'Normalizar texto'}</button><span className="text-sm">Solo memoria. Recargar descarta esta revisión.</span></div>
      {error&&<p ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-ink/30 bg-panel p-4">{error}</p>}
    </div>
    <p role="status" className="text-sm">{catalog?catalog.entries.length+' registros: '+facts.length+' aprobados localmente. Los demás siguen pendientes o excluidos.':busy?'Calculando versión de la fuente...':'Aún no hay hechos aprobados.'}</p>
    {catalog&&<section className="space-y-5" aria-labelledby={prefix+'-results'}>
      <h2 ref={heading} tabIndex={-1} id={prefix+'-results'} className="font-display text-2xl font-semibold">Revisión editable</h2>
      <p className="max-w-3xl text-sm leading-6">Versión de fuente <code className="break-all">{catalog.source.hash.slice(0,16)}</code>. Toda edición o exclusión invalida las aprobaciones del lote. Las advertencias deben corregirse antes de aprobar.</p>
      <ol className="space-y-6">
        {catalog.entries.slice(page*5,page*5+5).map(entry=><li key={entry.id} className="min-w-0 rounded-2xl border border-ink/25 bg-panel p-4 sm:p-6">
          <article aria-labelledby={prefix+'-entry-'+entry.line} className="space-y-4">
            <header className="flex flex-wrap items-baseline justify-between gap-2"><h3 id={prefix+'-entry-'+entry.line} className="font-display text-lg font-semibold">Registro de línea {entry.line}</h3><p className="text-sm font-semibold">{entry.excluded?'Excluido':entry.approval?'Aprobado localmente':'Pendiente de revisión'}</p></header>
            <details><summary className={disclosure}>Ver fuente y procedencia</summary><pre dir="auto" className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-canvas p-3 text-sm">{catalog.source.raw.slice(entry.start,entry.end)}</pre><p className="mt-2 break-all text-xs">Línea {entry.line}, posiciones {entry.start} a {entry.end}. Correcciones: revisión {entry.revision}. {catalog.source.parserVersion}</p></details>
            <fieldset disabled={entry.excluded} className="grid min-w-0 gap-4 border-0 p-0 sm:grid-cols-2">
              <legend className="sr-only">Campos del registro {entry.line}</legend>
              {(Object.keys(labels) as (keyof Fields)[]).map(field=>{
                const fieldId=prefix+'-'+entry.line+'-'+field;
                return <div key={field} className={'min-w-0 space-y-2 '+(field==='name'?'sm:col-span-2':'')}>
                  <label htmlFor={fieldId} className="block text-sm font-semibold">{labels[field]} (línea {entry.line})</label>
                  <input id={fieldId} aria-describedby={fieldId+'-hint'} dir="auto" value={entry.fields[field]} onChange={e=>edit(entry.id,field,e.target.value)} maxLength={CATALOG_LIMITS[field]} className={control+' w-full'} placeholder={fieldHints[field]} />
                  <span id={fieldId+'-hint'} className="block text-xs leading-5 text-ink/80">{fieldHints[field]}</span>
                </div>;
              })}
            </fieldset>
            {!!entry.issues.length&&!entry.excluded&&<div id={prefix+'-issues-'+entry.line} className="space-y-2 text-sm"><p className="font-semibold">Pendiente: {entry.issues.length} advertencias</p><ul className="list-disc space-y-1 pl-5">{entry.issues.map((issue,index)=><li key={issue.code+index}>{issue.message}</li>)}</ul></div>}
            {!entry.excluded&&<label className="flex min-h-11 items-start gap-3 py-2"><input type="checkbox" checked={confirmed.has(entry.id)} onChange={e=>setConfirmed(previous=>{const next=new Set(previous);if(e.target.checked)next.add(entry.id);else next.delete(entry.id);return next;})} className="mt-1 h-5 w-5 shrink-0 accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" /><span>He revisado los campos y la fuente de la línea {entry.line}.</span></label>}
            <div className="flex flex-wrap gap-3">
              {!entry.excluded&&<button type="button" disabled={!confirmed.has(entry.id)||!!entry.issues.length||!!entry.approval} aria-describedby={entry.issues.length?prefix+'-issues-'+entry.line:undefined} onClick={()=>{try{setCatalog(approveEntry(catalog,entry.id,scope,confirmed.has(entry.id)));}catch{setError('No se aprobó el registro. Revisa las advertencias y el ámbito.');}}} className={control+' font-semibold disabled:opacity-50'}>Aprobar línea {entry.line}</button>}
              <button type="button" onClick={()=>{setCatalog(excludeEntry(catalog,entry.id,!entry.excluded));setConfirmed(new Set());}} className={control}>{entry.excluded?'Restaurar':'Excluir'} línea {entry.line}</button>
            </div>
          </article>
        </li>)}
      </ol>
      {catalog.entries.length>5&&<nav aria-label="Páginas de revisión" className="flex flex-wrap items-center gap-3"><button className={control} disabled={page===0} onClick={()=>{setPage(p=>p-1);heading.current?.focus();}}>Anterior</button><span>Página {page+1} de {Math.ceil(catalog.entries.length/5)}</span><button className={control} disabled={(page+1)*5>=catalog.entries.length} onClick={()=>{setPage(p=>p+1);heading.current?.focus();}}>Siguiente</button></nav>}
      <details className="rounded-2xl border border-ink/25 p-4"><summary className={disclosure}>Hechos aprobados localmente ({facts.length})</summary><p className="my-3 text-sm">Sin persistencia ni uso por una IA. Los valores desconocidos se conservan como null o unknown.</p><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm">{JSON.stringify(facts,null,2)}</pre></details>
    </section>}
  </section>;
}
