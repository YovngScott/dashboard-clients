import { useEffect, useState } from 'react';
import { Bell, Check, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Preferences = {
  notify_assigned_message: boolean;
  notify_unassigned_conversation: boolean;
  notify_conversation_assigned: boolean;
  notify_via_browser: boolean;
  notify_via_email: boolean;
  notify_via_telegram: boolean;
  notify_via_sms: boolean;
  notification_email: string;
  notification_phone: string;
  sms_consent: boolean;
};

const defaults = (email: string): Preferences => ({
  notify_assigned_message: false,
  notify_unassigned_conversation: false,
  notify_conversation_assigned: false,
  notify_via_browser: false,
  notify_via_email: false,
  notify_via_telegram: false,
  notify_via_sms: false,
  notification_email: email,
  notification_phone: '',
  sms_consent: false,
});

const preferenceFields = [
  ['notify_assigned_message', 'Nuevo mensaje en una conversación asignada', 'Cuando llegue una respuesta a una conversación que atiendes.'],
  ['notify_unassigned_conversation', 'Nueva conversación sin asignar', 'Cuando un contacto inicie una conversación que el equipo aún no tomó.'],
  ['notify_conversation_assigned', 'Conversación asignada a mí', 'Cuando te asignen una conversación existente.'],
] as const;

const channelFields = [
  ['notify_via_browser', 'Este navegador', 'Avisos emergentes mientras Stage esté abierto.', Bell],
  ['notify_via_email', 'Correo electrónico', 'Destino editable abajo; entrega por correo aún no conectada.', Mail],
  ['notify_via_telegram', 'Telegram', 'Preferencia guardada; falta conectar el bot de Stage.', MessageCircle],
  ['notify_via_sms', 'SMS', 'Preferencia guardada; requiere teléfono, consentimiento y proveedor.', Smartphone],
] as const;

function SwitchRow({
  id, label, description, checked, onChange,
}: {
  id: string; label: string; description: string; checked: boolean; onChange: (checked: boolean) => void;
}) {
  return <label htmlFor={id} className="flex min-h-[68px] cursor-pointer items-center justify-between gap-4 border-b border-ink/10 py-3 last:border-0">
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-ink/60">{description}</span>
    </span>
    <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 shrink-0 accent-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600" />
  </label>;
}

export function NotificationSettings({ userId, accountEmail }: { userId: string; accountEmail: string | null }) {
  const [preferences, setPreferences] = useState(() => defaults(accountEmail ?? ''));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported');

  const isPreview = userId.startsWith('demo-') || userId === 'preview';
  const previewKey = `stage-notification-preferences:${userId}`;

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      setLoading(true);
      setError('');
      if (isPreview) {
        try {
          const saved = localStorage.getItem(previewKey);
          if (saved && !cancelled) setPreferences({ ...defaults(accountEmail ?? ''), ...JSON.parse(saved) as Partial<Preferences> });
        } catch {
          if (!cancelled) setError('No se pudieron leer las preferencias de esta vista previa.');
        }
        if (!cancelled) setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (loadError) setError('No se pudieron cargar tus preferencias. Intenta actualizar la página.');
      else if (data) setPreferences({
        ...defaults(accountEmail ?? ''),
        ...data,
        notification_email: data.notification_email ?? accountEmail ?? '',
        notification_phone: data.notification_phone ?? '',
        sms_consent: Boolean(data.sms_consent_at),
      });
      setLoading(false);
    }

    void loadPreferences();
    return () => { cancelled = true; };
  }, [accountEmail, isPreview, previewKey, userId]);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setNotice('');
    setError('');
  }

  async function enableBrowserNotifications() {
    if (!('Notification' in window)) {
      setBrowserPermission('unsupported');
      setError('Este navegador no admite notificaciones emergentes.');
      return;
    }
    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    if (permission !== 'granted') {
      setError(permission === 'denied'
        ? 'El navegador bloqueó los avisos. Cámbialo en los permisos del sitio y vuelve a intentarlo.'
        : 'No se concedió permiso para mostrar avisos.');
      return;
    }
    update('notify_via_browser', true);
    setNotice('Permiso del navegador concedido. Guarda tus preferencias para conservar la selección.');
  }

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setError('');
    const email = preferences.notification_email.trim().toLowerCase();
    const phone = preferences.notification_phone.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Escribe un correo válido o deja el campo vacío.');
      return;
    }
    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError('Escribe el teléfono en formato internacional, por ejemplo +14155552671.');
      return;
    }
    if (preferences.notify_via_sms && (!phone || !preferences.sms_consent)) {
      setError('Para activar SMS, añade un teléfono válido y confirma que te pertenece y autorizas los avisos.');
      return;
    }

    setSaving(true);
    const payload = {
      user_id: userId,
      notify_assigned_message: preferences.notify_assigned_message,
      notify_unassigned_conversation: preferences.notify_unassigned_conversation,
      notify_conversation_assigned: preferences.notify_conversation_assigned,
      notify_via_browser: preferences.notify_via_browser && browserPermission === 'granted',
      notify_via_email: preferences.notify_via_email,
      notify_via_telegram: preferences.notify_via_telegram,
      notify_via_sms: preferences.notify_via_sms,
      notification_email: email || null,
      notification_phone: phone || null,
      sms_consent_at: preferences.sms_consent ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (isPreview) {
      localStorage.setItem(previewKey, JSON.stringify({ ...preferences, notification_email: email, notification_phone: phone }));
      setNotice('Preferencias guardadas en este navegador de vista previa.');
    } else {
      const { error: saveError } = await supabase.from('user_notification_preferences').upsert(payload, { onConflict: 'user_id' });
      if (saveError) setError('No se guardaron los cambios. Intenta de nuevo; si el problema continúa, contacta soporte.');
      else setNotice('Preferencias guardadas en tu cuenta. La entrega por correo, Telegram y SMS aún requiere sus integraciones.');
    }
    setSaving(false);
  }

  return <form onSubmit={savePreferences} aria-busy={loading || saving} className="space-y-5">
    <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
      <h3 className="text-base font-bold">Notificaciones de escritorio de Inbox</h3>
      <p className="mt-1 text-sm text-ink/60">Elige qué actividad debería generar un aviso en este dispositivo.</p>
      <div className="mt-3">
        {preferenceFields.map(([key, label, description]) => <SwitchRow key={key} id={key} label={label} description={description} checked={preferences[key]} onChange={(value) => update(key, value)} />)}
      </div>
    </section>

    <section className="rounded-2xl border border-ink/10 bg-panel p-5 sm:p-6">
      <h3 className="text-base font-bold">Acción: notificar a los asignados</h3>
      <p className="mt-1 text-sm text-ink/60">Selecciona por qué canales debería avisarse a la persona asignada. Las preferencias se guardan por persona, no por organización.</p>
      <div className="mt-3">
        {channelFields.map(([key, label, description, Icon]) => <div key={key} className="flex items-center gap-3">
          <Icon aria-hidden="true" size={17} className="shrink-0 text-ink/55" />
          <div className="min-w-0 flex-1"><SwitchRow id={key} label={label} description={description} checked={preferences[key]} onChange={(value) => update(key, value)} /></div>
        </div>)}
      </div>
      <div className="mt-4 rounded-xl border border-ink/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold">Permiso de este navegador</p><p className="mt-1 text-xs text-ink/60">Estado: {browserPermission === 'granted' ? 'concedido' : browserPermission === 'denied' ? 'bloqueado en el navegador' : browserPermission === 'default' ? 'sin decidir' : 'no disponible'}</p></div>
          <button type="button" onClick={() => void enableBrowserNotifications()} disabled={loading || browserPermission === 'granted' || browserPermission === 'unsupported'} className="min-h-11 rounded-xl border border-ink/15 px-4 text-sm font-semibold text-ink hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50">
            {browserPermission === 'granted' ? 'Permiso concedido' : 'Permitir avisos'}
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="notification-email" className="block text-sm font-semibold">Correo para avisos</label>
          <input id="notification-email" type="email" autoComplete="email" value={preferences.notification_email} onChange={(event) => update('notification_email', event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600" placeholder="nombre@empresa.com" />
          <p className="mt-1 text-xs text-ink/55">No cambia el correo de acceso de tu cuenta.</p>
        </div>
        <div>
          <label htmlFor="notification-phone" className="block text-sm font-semibold">Teléfono para SMS</label>
          <input id="notification-phone" type="tel" autoComplete="tel" inputMode="tel" value={preferences.notification_phone} onChange={(event) => update('notification_phone', event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-panel px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600" placeholder="+14155552671" aria-describedby="notification-phone-help" />
          <p id="notification-phone-help" className="mt-1 text-xs text-ink/55">Formato internacional con + y código de país.</p>
        </div>
      </div>
      <label className="mt-4 flex min-h-11 items-start gap-3 text-sm leading-5 text-ink/75">
        <input type="checkbox" checked={preferences.sms_consent} onChange={(event) => update('sms_consent', event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600" />
        <span>Confirmo que el teléfono me pertenece y autorizo a Stage AI Labs a enviarme notificaciones por SMS cuando este canal esté disponible.</span>
      </label>
    </section>

    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-950 dark:text-amber-200">
      <p className="font-semibold">Entrega de avisos: integraciones pendientes</p>
      <p className="mt-0.5 text-amber-950/80 dark:text-amber-100/80">Stage todavía no produce eventos de Inbox ni tiene conectado el envío de correo, Telegram o SMS. Puedes guardar tus preferencias; activarlas aquí no enviará mensajes hasta conectar esos servicios.</p>
    </div>

    {error && <p role="alert" className="rounded-xl border border-red-600/25 bg-red-600/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">{error}</p>}
    {notice && <p role="status" aria-live="polite" className="rounded-xl border border-teal-700/20 bg-teal-700/10 px-4 py-3 text-sm text-teal-950 dark:text-teal-100">{notice}</p>}
    <div className="flex justify-end">
      <button type="submit" disabled={loading || saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-ink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? 'Guardando…' : <><Check aria-hidden="true" size={16} />Guardar preferencias</>}
      </button>
    </div>
  </form>;
}
