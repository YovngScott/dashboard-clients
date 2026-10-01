import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Pencil, X } from 'lucide-react';
import type { WorkspaceContext } from '@/lib/workspace';
import { supabase } from '@/lib/supabase';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

async function validateLogoImage(file: File): Promise<void> {
  if (!LOGO_TYPES.includes(file.type) || file.size > MAX_LOGO_BYTES || file.size < 12) {
    throw new Error('El logo debe ser PNG, JPG o WebP y pesar hasta 2 MB.');
  }
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isRiff = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
  const isWebp = isRiff && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

  if (!isPng && !isJpeg && !isWebp) {
    throw new Error('El archivo no tiene una firma de imagen válida (PNG, JPG o WebP).');
  }
}

export function WorkspaceBrandSettings({ workspace, canEdit, onUpdated }: {
  workspace: WorkspaceContext;
  canEdit: boolean;
  onUpdated: (name: string, logoPath: string | null, logoUrl: string | null) => void;
}) {
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'dashboard';
  const [name, setName] = useState(() => preview ? localStorage.getItem('stage-preview-organization-name') || workspace.name : workspace.name);
  const [file, setFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 120) { setError('El nombre debe tener entre 2 y 120 caracteres.'); return; }
    if (file) {
      try {
        await validateLogoImage(file);
      } catch (validationErr) {
        setError(validationErr instanceof Error ? validationErr.message : 'El logo debe ser PNG, JPG o WebP válido.');
        return;
      }
    }
    setBusy(true); setError(''); setNotice('');
    if (preview) {
      localStorage.setItem('stage-preview-organization-name', cleanName);
      onUpdated(cleanName, workspace.logoPath, workspace.logoUrl);
      setNotice('Vista previa actualizada en este navegador.');
      setBusy(false);
      return;
    }

    let uploadedPath: string | null = null;
    try {
      if (file) {
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'png';
        uploadedPath = `${workspace.organizationId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('organization-logos').upload(uploadedPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
      }
      const nextPath = file ? uploadedPath : removeLogo ? null : workspace.logoPath;
      const { data, error: updateError } = await supabase.from('organizations').update({ name: cleanName, logo_path: nextPath }).eq('id', workspace.organizationId).select('name,logo_path').single();
      if (updateError) throw updateError;
      const nextUrl = data.logo_path ? supabase.storage.from('organization-logos').getPublicUrl(data.logo_path).data.publicUrl : null;
      onUpdated(data.name, data.logo_path, nextUrl);
      if (file && workspace.logoPath) await supabase.storage.from('organization-logos').remove([workspace.logoPath]);
      setName(data.name); setFile(null); setRemoveLogo(false); setEditingName(false); setNotice('Identidad del espacio actualizada.');
    } catch {
      if (uploadedPath) await supabase.storage.from('organization-logos').remove([uploadedPath]);
      setError('No se pudo guardar. Comprueba tu conexión y que tengas el rol de propietario; vuelve a intentarlo.');
    } finally { setBusy(false); }
  }

  const logo = previewUrl ?? (removeLogo ? null : workspace.logoUrl);
  const hasChanges = name.trim() !== workspace.name || Boolean(file) || removeLogo;
  return <section aria-labelledby="workspace-identity-title" className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 id="workspace-identity-title" className="text-base font-bold">Espacio de trabajo</h3><p className="mt-1 text-sm text-ink/70">Nombre y logo que identifican a tu organización.</p></div>
      <span className="rounded-lg border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/70">{canEdit ? 'Propietario' : 'Solo lectura'}</span>
    </div>
    <form onSubmit={save} className="mt-5 border-t border-ink/10 pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="group relative h-12 w-12 shrink-0 rounded-xl border border-ink/10 bg-white p-1">
          <span className="grid h-full w-full place-items-center overflow-hidden rounded-lg">{logo ? <img src={logo} alt="Logo de la organización" className="h-full w-full object-contain" /> : <Building2 aria-hidden="true" className="text-ink/70" />}</span>
          {canEdit && <label aria-label="Cambiar logo de la organización" title="Cambiar logo" className="workspace-logo-edit absolute -bottom-2 -right-2 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-ink/15 bg-panel text-ink shadow-sm focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600">
            <Pencil size={15} aria-hidden="true" /><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setRemoveLogo(false); setError(''); }} />
          </label>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink/70">Nombre del espacio</p>
          {editingName && canEdit ? <label className="sr-only" htmlFor="organization-name">Nombre de la organización</label> : null}
          {editingName && canEdit
            ? <input autoFocus id="organization-name" value={name} disabled={busy} maxLength={120} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-ink/15 bg-canvas px-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:max-w-sm" />
            : <p className="flex min-w-0 items-center gap-1.5 text-base font-semibold"><span className="truncate">{workspace.name}</span>{canEdit && <button type="button" aria-label="Editar nombre de la organización" title="Editar nombre" onClick={() => { setName(workspace.name); setEditingName(true); setError(''); setNotice(''); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/70 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><Pencil size={15} /></button>}</p>}
        </div>
      </div>
      {canEdit && <p className="mt-3 text-xs text-ink/70">Logo PNG, JPG o WebP de hasta 2 MB. Visible para el equipo.</p>}
      {canEdit && (file || removeLogo || editingName) && <div className="mt-3 flex flex-wrap items-center gap-2">
        {file && <span className="max-w-full truncate text-xs text-ink/70">{file.name}</span>}
        {workspace.logoPath && !removeLogo && <button type="button" onClick={() => { setFile(null); setRemoveLogo(true); setError(''); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-ink/70 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><X size={14} />Quitar logo</button>}
        {editingName && <button type="button" disabled={busy} onClick={() => { setName(workspace.name); setEditingName(false); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><X size={14} />Cancelar</button>}
        <button type="submit" disabled={busy || !hasChanges} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-brand-ink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"><Check size={15} />{busy ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>}
      {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-indigo-500/10 px-3 py-2 text-sm text-indigo-800 dark:text-indigo-200">{notice}</p>}
      {!canEdit && <p className="text-xs text-ink/70">Solo el propietario puede cambiar el nombre o el logo.</p>}
      {preview && canEdit && <p className="text-xs text-amber-800 dark:text-amber-200">Vista previa: los cambios no se envían a la organización.</p>}
    </form>
  </section>;
}
