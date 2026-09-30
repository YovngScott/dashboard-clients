import { useEffect, useMemo, useState } from 'react';
import { Building2, ImagePlus, Save, X } from 'lucide-react';
import type { WorkspaceContext } from '@/lib/workspace';
import { supabase } from '@/lib/supabase';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function WorkspaceBrandSettings({ workspace, canEdit, onUpdated }: {
  workspace: WorkspaceContext;
  canEdit: boolean;
  onUpdated: (name: string, logoPath: string | null, logoUrl: string | null) => void;
}) {
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'dashboard';
  const [name, setName] = useState(() => preview ? localStorage.getItem('stage-preview-organization-name') || workspace.name : workspace.name);
  const [file, setFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 120) { setError('El nombre debe tener entre 2 y 120 caracteres.'); return; }
    if (file && (!LOGO_TYPES.includes(file.type) || file.size > MAX_LOGO_BYTES)) { setError('El logo debe ser PNG, JPG o WebP y pesar hasta 2 MB.'); return; }
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
      setFile(null); setRemoveLogo(false); setNotice('Identidad del espacio actualizada.');
    } catch {
      if (uploadedPath) await supabase.storage.from('organization-logos').remove([uploadedPath]);
      setError('No se pudo guardar. Comprueba tu conexión y que tengas el rol de propietario; vuelve a intentarlo.');
    } finally { setBusy(false); }
  }

  const logo = previewUrl ?? (removeLogo ? null : workspace.logoUrl);
  return <section aria-labelledby="workspace-identity-title" className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 id="workspace-identity-title" className="text-base font-bold">Espacio de trabajo</h3><p className="mt-1 text-sm text-ink/60">Nombre y logo que identifican a tu organización.</p></div>
      <span className="rounded-lg border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/70">{canEdit ? 'Propietario' : 'Solo lectura'}</span>
    </div>
    <div className="mt-5 flex items-center gap-3 border-t border-ink/10 pt-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/10 bg-white p-1">{logo ? <img src={logo} alt="Logo de la organización" className="h-full w-full object-contain" /> : <Building2 aria-hidden="true" className="text-ink/50" />}</span>
      <div className="min-w-0"><p className="text-xs text-ink/55">Nombre guardado</p><p className="truncate text-base font-semibold">{workspace.name}</p></div>
    </div>
    <form onSubmit={save} className="mt-5 space-y-4 border-t border-ink/10 pt-5">
      <div>
        <label htmlFor="organization-name" className="block text-sm font-semibold">Nombre de la organización</label>
        <input id="organization-name" value={name} disabled={!canEdit || busy} maxLength={120} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-canvas px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-65 sm:max-w-xl" />
      </div>
      <div>
        <span className="block text-sm font-semibold">Logo de la organización</span>
        <p className="mt-1 text-xs text-ink/60">PNG, JPG o WebP. Máximo 2 MB. Visible para el equipo.</p>
        {canEdit && <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-ink/15 px-3 text-sm font-semibold hover:bg-ink/5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-600"><ImagePlus size={16} />Elegir imagen<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(''); }} /></label>
          {(file || workspace.logoPath) && <button type="button" onClick={() => { setFile(null); setRemoveLogo(true); setError(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-ink/65 hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"><X size={15} />Quitar logo</button>}
          {file && <p className="max-w-full truncate text-xs text-ink/60">{file.name}</p>}
        </div>}
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-teal-500/10 px-3 py-2 text-sm text-teal-800 dark:text-teal-200">{notice}</p>}
      {canEdit && <button type="submit" disabled={busy || (!preview && name.trim() === workspace.name && !file && !removeLogo)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} />{busy ? 'Guardando…' : 'Guardar identidad'}</button>}
      {!canEdit && <p className="text-xs text-ink/55">Solo el propietario puede cambiar el nombre o el logo.</p>}
      {preview && canEdit && <p className="text-xs text-amber-800 dark:text-amber-200">Vista previa: los cambios no se envían a la organización.</p>}
    </form>
  </section>;
}
