import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type InboxPreferences = {
  opening: 'any_message' | 'attention_only';
  pauseAutomations: 'never' | '30' | '60' | '1440';
  reopened: 'same_agent' | 'unassigned';
  visibility: 'everyone' | 'assigned_only';
  sound: boolean;
  quickReplies: Array<{ id: string; shortcut: string; message: string }>;
};

const defaults: InboxPreferences = {
  opening: 'any_message', pauseAutomations: '30', reopened: 'unassigned',
  visibility: 'everyone', sound: true, quickReplies: [],
};

function RadioChoice({ name, value, selected, title, description, onChange }: {
  name: string; value: string; selected: boolean; title: string; description: string;
  onChange: () => void;
}) {
  return <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-3 py-3 hover:bg-ink/5 focus-within:outline focus-within:outline-2 focus-within:outline-indigo-600">
    <input type="radio" name={name} value={value} checked={selected} onChange={onChange} className="mt-1 h-4 w-4 shrink-0 accent-teal-700" />
    <span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-ink/70">{description}</span></span>
  </label>;
}

export function InboxBehaviorSettings({ organizationId }: { organizationId: string }) {
  const storageKey = `stage-inbox-preferences:${organizationId}`;
  const [preferences, setPreferences] = useState<InboxPreferences>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaults, ...JSON.parse(saved) as Partial<InboxPreferences> } : defaults;
    } catch { return defaults; }
  });
  const [notice, setNotice] = useState('');

  function update<K extends keyof InboxPreferences>(key: K, value: InboxPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setNotice('');
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
      setNotice('Borrador guardado en este navegador. Inbox todavía no aplica estos ajustes.');
    } catch { setNotice('No se pudo guardar el borrador en este navegador.'); }
  }

  function addQuickReply() {
    update('quickReplies', [...preferences.quickReplies, { id: crypto.randomUUID(), shortcut: '', message: '' }]);
  }

  return <form onSubmit={save} className="space-y-5" aria-describedby="inbox-settings-status">
    <div className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
      <h3 className="text-base font-bold">Apertura de conversaciones</h3>
      <p className="mt-1 text-sm text-ink/70">Define qué mensajes nuevos abren un chat en la bandeja.</p>
      <div className="mt-3 grid gap-1 sm:grid-cols-2">
        <RadioChoice name="inbox-opening" value="any_message" selected={preferences.opening === 'any_message'} title="Cada mensaje abre una conversación" description="Los mensajes nuevos aparecen como no asignados." onChange={() => update('opening', 'any_message')} />
        <RadioChoice name="inbox-opening" value="attention_only" selected={preferences.opening === 'attention_only'} title="Solo mensajes que requieren atención" description="Los eventos automáticos no abren un nuevo chat." onChange={() => update('opening', 'attention_only')} />
      </div>
    </div>

    <div className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
      <h3 className="text-base font-bold">Durante y después de atender un chat</h3>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="inbox-pause-duration" className="block text-sm font-semibold">Pausar automatizaciones durante la atención</label>
          <p className="mt-1 text-xs leading-5 text-ink/70">Evita que una respuesta automática interrumpa al agente.</p>
          <select id="inbox-pause-duration" value={preferences.pauseAutomations} onChange={(event) => update('pauseAutomations', event.target.value as InboxPreferences['pauseAutomations'])} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <option value="never">No pausar</option><option value="30">30 minutos</option><option value="60">1 hora</option><option value="1440">24 horas</option>
          </select>
        </div>
        <div>
          <label htmlFor="inbox-reopened" className="block text-sm font-semibold">Al reabrirse una conversación</label>
          <p className="mt-1 text-xs leading-5 text-ink/70">Elige quién vuelve a recibir el chat.</p>
          <select id="inbox-reopened" value={preferences.reopened} onChange={(event) => update('reopened', event.target.value as InboxPreferences['reopened'])} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <option value="same_agent">El mismo agente que la atendió</option><option value="unassigned">Devolverla a No asignadas</option>
          </select>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
      <h3 className="text-base font-bold">Acceso y alertas</h3>
      <div className="mt-3 grid gap-1 sm:grid-cols-2">
        <RadioChoice name="inbox-visibility" value="everyone" selected={preferences.visibility === 'everyone'} title="Todo el equipo ve las conversaciones" description="Los miembros pueden consultar la bandeja completa." onChange={() => update('visibility', 'everyone')} />
        <RadioChoice name="inbox-visibility" value="assigned_only" selected={preferences.visibility === 'assigned_only'} title="Solo las conversaciones asignadas" description="Cada miembro ve las conversaciones que le corresponden." onChange={() => update('visibility', 'assigned_only')} />
      </div>
      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 border-t border-ink/10 pt-3 text-sm font-semibold">
        <input type="checkbox" checked={preferences.sound} onChange={(event) => update('sound', event.target.checked)} className="h-5 w-5 shrink-0 accent-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" />
        Permitir alertas de sonido en la aplicación
      </label>
    </div>

    <div className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-base font-bold">Respuestas predefinidas</h3><p className="mt-1 text-sm text-ink/70">Prepara textos reutilizables para responder más rápido.</p></div>
        <button type="button" onClick={addQuickReply} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 px-3 text-sm font-semibold hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><Plus size={16} />Añadir respuesta</button>
      </div>
      {preferences.quickReplies.length === 0 ? <p className="mt-4 rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink/70">Todavía no hay respuestas. Añade un atajo y el texto que quieras reutilizar.</p> : <div className="mt-4 divide-y divide-ink/10">{preferences.quickReplies.map((reply, index) => <div key={reply.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_44px]">
        <div><label htmlFor={`reply-shortcut-${reply.id}`} className="block text-xs font-semibold">Atajo</label><input id={`reply-shortcut-${reply.id}`} value={reply.shortcut} maxLength={32} onChange={(event) => update('quickReplies', preferences.quickReplies.map((item) => item.id === reply.id ? { ...item, shortcut: event.target.value } : item))} placeholder="Ej. saludo" className="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" /></div>
        <div><label htmlFor={`reply-message-${reply.id}`} className="block text-xs font-semibold">Texto de respuesta {index + 1}</label><textarea id={`reply-message-${reply.id}`} value={reply.message} maxLength={1000} rows={2} onChange={(event) => update('quickReplies', preferences.quickReplies.map((item) => item.id === reply.id ? { ...item, message: event.target.value } : item))} placeholder="Escribe el mensaje que quieres reutilizar" className="mt-1 w-full rounded-xl border border-ink/15 bg-panel px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" /></div>
        <button type="button" aria-label={`Eliminar respuesta ${index + 1}`} onClick={() => update('quickReplies', preferences.quickReplies.filter((item) => item.id !== reply.id))} className="grid h-11 w-11 place-items-center self-end rounded-xl text-ink/70 hover:bg-red-500/10 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><Trash2 size={17} /></button>
      </div>)}</div>}
    </div>

    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-950 dark:text-amber-200">
      <p className="font-semibold">Borrador de interfaz</p><p className="mt-0.5 text-amber-950/80 dark:text-amber-100/80">Las opciones se guardan solo en este navegador. La bandeja aún no aplica estos comportamientos ni sincroniza la configuración con tu equipo.</p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p id="inbox-settings-status" role="status" aria-live="polite" className="text-sm text-ink/70">{notice}</p>
      <button type="submit" className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Guardar borrador</button>
    </div>
  </form>;
}
