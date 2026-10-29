import { useEffect, useRef, useState } from 'react';
import { AgentUpdateConflict, editableAgentFields, updateAgent, uploadContextPdf, validateContextPdf, type AgentRecord, type Workspace } from './agent-service';
import { agentLimits, draftFieldError, draftValidationError, websiteValidationError } from './draft-validation';
import { localPdfMessage } from './context-pdf';
import { CatalogReview } from '../knowledge/CatalogReview';

type Props = { agent: AgentRecord; workspace: Workspace; userId: string; onClose: () => void; onSaved: () => Promise<void>; initialFocus?: 'business_description' | 'tone' };
const fields = [
  ['name','Nombre del agente'], ['business_name','Nombre de la empresa'], ['business_description','Descripción del negocio'],
  ['catalog_summary','Catálogo o servicios'], ['important_facts','Información importante'],
  ['operating_instructions','Instrucciones operativas'], ['handoff_instructions','Cuándo pedir ayuda'],
  ['website_url','Sitio web'], ['phone','Teléfono'],
] as const;
const limits: Record<string,number> = {name:80,business_name:120,business_description:8000};

export function AgentEditor({agent,workspace,userId,onClose,onSaved,initialFocus}: Props) {
  const [draft,setDraft] = useState(() => editableAgentFields(agent));
  const [saved,setSaved] = useState(agent);
  const [savedDraft,setSavedDraft] = useState(() => JSON.stringify(editableAgentFields(agent)));
  const [file,setFile] = useState<File|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [uncertain,setUncertain] = useState(false);
  const [partial,setPartial] = useState(false);
  const [websiteTouched,setWebsiteTouched] = useState(false);
  const [touched,setTouched] = useState<Partial<Record<keyof typeof agentLimits, boolean>>>({});
  const [confirmDiscard,setConfirmDiscard] = useState(false);
  const [showCatalog,setShowCatalog] = useState(false);
  const active = useRef(true); const inFlight = useRef(false);
  const editorRef = useRef<HTMLElement>(null);
  useEffect(() => { if (initialFocus) editorRef.current?.querySelector<HTMLElement>(`[data-editor-field="${initialFocus}"]`)?.focus(); }, [initialFocus]);
  useEffect(() => { active.current=true; return () => { active.current=false; }; }, []);
  const websiteError=websiteValidationError(draft.website_url ?? '');
  const dirty=JSON.stringify(editableAgentFields(draft))!==savedDraft;

  async function save() {
    if (inFlight.current || uncertain) return;
    const invalid=draftValidationError(draft) ?? websiteError;
    if (invalid) { setError(invalid); return; }
    inFlight.current=true; setBusy(true); setError('');
    try {
      if (file) await validateContextPdf(file);
      if (!active.current) return;
      let current=saved;
      if (dirty) {
        try { current=await updateAgent(workspace,saved,draft); }
        catch (cause) {
          if (!active.current) return;
          if (cause instanceof AgentUpdateConflict) setError('El agente cambió o ya no está disponible. Cierra y vuelve a cargar antes de guardar.');
          else setError('No pudimos confirmar el cambio. Cierra y vuelve a cargar el agente antes de reintentar.');
          setUncertain(true); return;
        }
        if (!active.current) return;
        setSaved(current); setSavedDraft(JSON.stringify(editableAgentFields(current))); setDraft(editableAgentFields(current));
      }
      if (file) {
        try { await uploadContextPdf(workspace.organizationId,current.id,userId,file); }
        catch (cause) {
          if (active.current) { setPartial(dirty || partial); setError(localPdfMessage(cause) ?? 'La configuración guardada no se perdió, pero el PDF no se subió. Reintenta con este mismo archivo.'); }
          return;
        }
      }
      if (!active.current) return;
      await onSaved();
    } catch (cause) {
      if (active.current) setError(localPdfMessage(cause) ?? 'No pudimos validar el archivo. Conservamos tus cambios.');
    } finally { inFlight.current=false; if (active.current) setBusy(false); }
  }

  return <section ref={editorRef} className="mt-4 w-full max-w-2xl rounded-2xl border border-ink/20 bg-panel p-5" aria-label={`Editar ${agent.name}`} aria-busy={busy}>
    <h3 className="font-display text-xl font-bold">Editar configuración</h3>
    <p className="mt-2 text-sm text-ink/70">Los cambios no activan el asistente ni eliminan documentos existentes.</p>
    <fieldset disabled={busy || uncertain} className="mt-4 grid min-w-0 gap-4 border-0 p-0 sm:grid-cols-2">
      {fields.map(([key,label]) => {
        const validated = key === 'name' || key === 'business_name' || key === 'business_description' ? key : null;
        const fieldError = validated && touched[validated] ? draftFieldError(validated, draft[validated]) : null;
        return <label key={key} className="min-w-0 text-sm font-semibold">{label}
        {['business_description','catalog_summary','important_facts','operating_instructions','handoff_instructions'].includes(key)
          ? <textarea data-editor-field={key} aria-label={label} aria-invalid={fieldError ? true : undefined} aria-describedby={fieldError ? `edit-${key}-error` : undefined} onBlur={()=>{if(validated)setTouched(t=>({...t,[validated]:true}));}} value={draft[key] ?? ''} maxLength={limits[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} className="mt-2 min-h-24 w-full rounded-xl border border-ink/20 bg-canvas p-3 font-normal" />
          : <input aria-label={label} type={key === 'website_url' ? 'url' : 'text'} value={draft[key] ?? ''} maxLength={limits[key]} aria-invalid={!!fieldError || (key === 'website_url' && websiteTouched && !!websiteError) || undefined} aria-describedby={fieldError ? `edit-${key}-error` : key === 'website_url' && websiteTouched && websiteError ? 'edit-website-error' : undefined} onBlur={()=>{if(validated)setTouched(t=>({...t,[validated]:true}));if(key==='website_url'){setWebsiteTouched(true);setDraft(d=>({...d,website_url:d.website_url?.trim() || null}));}}} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} className="mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 font-normal" />}
        {fieldError && <span id={`edit-${key}-error`} className="mt-1 block text-rose-700 dark:text-rose-200">{fieldError}</span>}
        {key === 'website_url' && websiteTouched && websiteError && <span id="edit-website-error" className="mt-1 block text-rose-700 dark:text-rose-200">{websiteError}</span>}
      </label>;})}
      <label className="text-sm font-semibold">Objetivo<select value={draft.goal} onChange={e=>setDraft(d=>({...d,goal:e.target.value}))} className="mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3"><option value="customer_service">Servicio al cliente</option><option value="sales_and_service">Ventas y servicio</option><option value="lead_qualification">Calificación de prospectos</option></select></label>
      <label className="text-sm font-semibold">Tono<select data-editor-field="tone" value={draft.tone} onChange={e=>setDraft(d=>({...d,tone:e.target.value}))} className="mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3"><option value="clear_and_warm">Claro y cercano</option><option value="professional">Profesional</option><option value="concise">Breve y directo</option><option value="friendly">Amigable</option></select></label>
      <label className="sm:col-span-2 text-sm font-semibold">Añadir PDF opcional<input aria-label="Añadir PDF opcional" type="file" accept="application/pdf,.pdf" onChange={e=>{setFile(e.target.files?.[0] ?? null);setPartial(false);}} className="mt-2 block w-full text-sm" /><span className="mt-2 block font-normal text-ink/70">El archivo se guarda, pero todavía no se procesa para responder.</span></label>
    </fieldset>
    {error && <p role="alert" className="mt-4 text-sm text-rose-700 dark:text-rose-200">{error}</p>}
    {partial && <p className="mt-2 text-sm">La configuración ya se guardó; reintentar no vuelve a actualizarla ni borra archivos.</p>}
    {confirmDiscard && <p role="alert" className="mt-4 text-sm">Hay cambios sin guardar. ¿Quieres descartarlos? Los cambios ya guardados y los documentos existentes no se borrarán.</p>}
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={busy || uncertain || (!dirty && !file) || !!websiteError || !!draftValidationError(draft)} onClick={()=>void save()} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-brand-ink disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">{busy?'Guardando…':'Guardar cambios'}</button><button type="button" disabled={busy} onClick={() => { if (!uncertain && (dirty || file) && !confirmDiscard) setConfirmDiscard(true); else onClose(); }} className="min-h-11 rounded-xl border border-ink/20 px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">{uncertain?'Cerrar y recargar':confirmDiscard?'Descartar cambios':'Cancelar'}</button>{confirmDiscard && <button type="button" onClick={()=>setConfirmDiscard(false)} className="min-h-11 rounded-xl px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Seguir editando</button>}</div>
    <div className="mt-8 border-t border-ink/20 pt-5"><button type="button" aria-expanded={showCatalog} onClick={()=>setShowCatalog(value=>!value)} className="min-h-11 rounded-xl border border-ink/20 px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">{showCatalog?'Cerrar revisión local':'Revisar catálogo textual'}</button><p className="mt-2 text-sm text-ink/70">La revisión es temporal: no se guarda ni se conecta al asistente.</p>{showCatalog && <CatalogReview scope={{userId,organizationId:workspace.organizationId,agentId:agent.id}} />}</div>
  </section>;
}
