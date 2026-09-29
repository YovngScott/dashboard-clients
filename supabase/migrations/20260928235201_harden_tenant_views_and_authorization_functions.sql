-- Make tenant-facing reporting obey each caller's base-table RLS policies.
ALTER VIEW public.v_metricas SET (security_invoker = true);
ALTER VIEW public.v_servicios_mas_preguntados SET (security_invoker = true);
ALTER VIEW public.v_preguntas_frecuentes SET (security_invoker = true);
ALTER VIEW public.v_consultas_por_categoria SET (security_invoker = true);
ALTER VIEW public.v_embudo SET (security_invoker = true);
ALTER VIEW public.v_clientes_por_dia SET (security_invoker = true);

-- Anonymous access is not needed for private dashboard metrics.
REVOKE SELECT ON
  public.v_metricas,
  public.v_servicios_mas_preguntados,
  public.v_preguntas_frecuentes,
  public.v_consultas_por_categoria,
  public.v_embudo,
  public.v_clientes_por_dia
FROM anon;

-- Tenant authorization is an RLS helper, not a public RPC. Pin its search path
-- and qualify every relation so caller-controlled schemas cannot shadow names.
CREATE OR REPLACE FUNCTION public.tiene_acceso_tenant(t_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.tenant_admins
      WHERE user_id = (SELECT auth.uid()) AND tenant_id = t_id
    );
$function$;

REVOKE EXECUTE ON FUNCTION public.tiene_acceso_tenant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tiene_acceso_tenant(uuid) TO authenticated, service_role;

-- This helper is used by RLS policies, but must not let a signed-in caller
-- probe another user's role by passing an arbitrary UUID.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR _user_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Trigger timestamp helper: keep the lookup path limited to built-ins.
CREATE OR REPLACE FUNCTION public.set_actualizado_en()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  NEW.actualizado_en = pg_catalog.now();
  RETURN NEW;
END;
$function$;
