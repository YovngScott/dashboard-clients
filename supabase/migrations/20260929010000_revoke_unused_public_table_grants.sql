-- These tables are internal-only and intentionally have no RLS policies.
-- Remove API-role grants as defense in depth so a future policy change cannot
-- accidentally make sensitive integration and administration data reachable.
REVOKE ALL ON TABLE
  public.asistente_cuentas,
  public.email_followups,
  public.google_oauth_tokens,
  public.instagram_connections,
  public.instagram_rules,
  public.owner_alerts,
  public.super_admins
FROM PUBLIC, anon, authenticated;
