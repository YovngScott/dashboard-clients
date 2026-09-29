-- Remove unauthenticated writes through the public Supabase API. The marketing
-- form now verifies Turnstile in its server route and calls this narrow RPC.
REVOKE INSERT ON TABLE public.leads FROM anon;
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

CREATE OR REPLACE FUNCTION public.submit_public_lead(
  p_name text,
  p_company text,
  p_email text,
  p_services text[],
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_account_email text;
  v_email_confirmed_at timestamptz;
  v_allowed_services text[] := ARRAY[
    'WhatsApp', 'Instagram', 'TikTok', 'Telegram', 'Facebook', 'Gmail', 'Outlook', 'Voice AI',
    'No estoy seguro', 'Not sure', 'Não tenho certeza'
  ];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT u.email, u.email_confirmed_at
  INTO v_account_email, v_email_confirmed_at
  FROM auth.users AS u
  WHERE u.id = v_user_id;

  IF v_email_confirmed_at IS NULL OR lower(v_account_email) <> lower(p_email) THEN
    RAISE EXCEPTION 'verified account required' USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 100
    OR p_company IS NULL OR char_length(btrim(p_company)) NOT BETWEEN 1 AND 100
    OR p_email IS NULL OR char_length(p_email) > 254
    OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR p_message IS NULL OR char_length(btrim(p_message)) NOT BETWEEN 1 AND 3000
    OR p_services IS NULL OR cardinality(p_services) > 9
    OR EXISTS (SELECT 1 FROM unnest(p_services) AS item WHERE item IS NULL OR item <> ALL (v_allowed_services))
  THEN
    RAISE EXCEPTION 'invalid lead data' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.leads (name, company, email, service, message)
  VALUES (btrim(p_name), btrim(p_company), lower(btrim(p_email)), array_to_string(p_services, ', '), btrim(p_message));
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.submit_public_lead(text, text, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_public_lead(text, text, text, text[], text) TO authenticated;
