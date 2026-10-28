/** Neutral session-loading shell: no invented user data or security status. */
export function AuthLoadingSkeleton() {
  return <main className="auth-loading-shell" role="status" aria-busy="true" aria-label="Cargando tu espacio">
    <p className="sr-only">Cargando tu espacio…</p>
    <div className="auth-loading-header" aria-hidden="true"><span className="auth-skeleton-block" /></div>
    <div className="auth-loading-columns" aria-hidden="true">
      <div className="auth-loading-art auth-skeleton-block" />
      <div className="auth-loading-form">
        <div className="auth-skeleton-block auth-loading-tabs" />
        {[0,1,2].map(i => <div className="auth-loading-field" key={i}><span className="auth-skeleton-block" /><div className="auth-skeleton-block" /></div>)}
        <div className="auth-skeleton-block auth-loading-tabs" />
      </div>
    </div>
  </main>;
}
