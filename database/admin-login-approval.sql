-- Apply to the existing database before enabling admin approval.
CREATE TABLE public.admin_login_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT ON public.admin_login_approvals TO authenticated;
GRANT ALL ON public.admin_login_approvals TO service_role;
ALTER TABLE public.admin_login_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own approval" ON public.admin_login_approvals FOR SELECT TO authenticated
USING (user_id = auth.uid() AND session_id::text = auth.jwt()->>'session_id');

CREATE OR REPLACE FUNCTION public.admin_approval_identity() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','subadmin'))
$$;
REVOKE ALL ON FUNCTION public.admin_approval_identity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approval_identity() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_session_is_approved() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT COALESCE((SELECT (value->>'enabled')::boolean FROM public.site_settings WHERE key = 'admin_login_approval'), false)
    OR EXISTS (SELECT 1 FROM public.admin_login_approvals
      WHERE user_id = auth.uid() AND session_id::text = auth.jwt()->>'session_id' AND status = 'approved')
$$;
REVOKE ALL ON FUNCTION public.admin_session_is_approved() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_session_is_approved() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    AND (_role NOT IN ('admin','subadmin') OR (_user_id = auth.uid() AND public.admin_session_is_approved()))
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid() AND public.admin_session_is_approved()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','subadmin'))
$$;

CREATE OR REPLACE FUNCTION public.preserve_approval_settings_session() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.key = 'admin_login_approval' AND COALESCE((NEW.value->>'enabled')::boolean,false)
    AND auth.uid() IS NOT NULL AND public.admin_approval_identity() THEN
    INSERT INTO public.admin_login_approvals(user_id,session_id,email,status,token_hash,expires_at,decided_at)
    VALUES(auth.uid(),(auth.jwt()->>'session_id')::uuid,COALESCE(auth.jwt()->>'email',''),
      'approved',gen_random_uuid()::text || gen_random_uuid()::text,now(),now())
    ON CONFLICT (session_id) DO UPDATE SET status='approved',decided_at=now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER approval_setting_session BEFORE INSERT OR UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.preserve_approval_settings_session();