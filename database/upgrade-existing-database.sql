-- =====================================================================
-- JobPortalFree + CodeXam: bring your existing database up to date.
-- HOW TO USE: Supabase dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. It is safe to run more than once and keeps your data.
-- =====================================================================
BEGIN;

-- 0) Keep old exam passwords: they move from the public students list into the
--    staff-only student_credentials store further below.
CREATE TEMP TABLE IF NOT EXISTS _old_student_passwords (student_id text PRIMARY KEY, password text) ON COMMIT DROP;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='password') THEN
    EXECUTE $q$INSERT INTO _old_student_passwords SELECT id, password FROM public.students WHERE coalesce(password, '') <> '' ON CONFLICT DO NOTHING$q$;
  END IF;
END $$;

-- 1) Reset access rules so they exactly match this version of the app.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname IN (
    'users upload own resume','users update own resume','read own resume or staff','staff upload templates','read templates',
    'Exam clients upload recordings','Staff read exam recordings','Staff delete exam recordings') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- 2) Tables, functions and access rules (same as the app's schema).
CREATE TABLE IF NOT EXISTS public.questions (id text PRIMARY KEY, title text NOT NULL DEFAULT '', description text DEFAULT '', difficulty text DEFAULT 'easy', default_public_count int DEFAULT 2, default_private_count int DEFAULT 3, languages jsonb DEFAULT '[]', time_limit int DEFAULT 2, max_marks int DEFAULT 10, sample_count int DEFAULT 3, sort_order int DEFAULT 0, public_test_cases jsonb DEFAULT '[]', private_test_cases jsonb DEFAULT '[]', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.students (id text PRIMARY KEY, name text DEFAULT '', email text NOT NULL, is_blocked boolean DEFAULT false, tab_switch_count int DEFAULT 0, max_tab_switches int DEFAULT 3, exam_status text DEFAULT 'not_started', assigned_questions jsonb DEFAULT '[]', retake_exam_ids jsonb DEFAULT '[]', show_results text DEFAULT 'default', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id text NOT NULL, question_id text NOT NULL, language text, code text, passed_public int DEFAULT 0, total_public int DEFAULT 0, passed_private int DEFAULT 0, total_private int DEFAULT 0, submitted_at timestamptz DEFAULT now(), public_results jsonb DEFAULT '[]', private_results jsonb DEFAULT '[]', marks numeric DEFAULT 0, max_marks numeric DEFAULT 10);
CREATE TABLE IF NOT EXISTS public.exams (id text PRIMARY KEY, title text DEFAULT '', description text DEFAULT '', question_ids jsonb DEFAULT '[]', mcq_ids jsonb DEFAULT '[]', writing_ids jsonb DEFAULT '[]', fib_ids jsonb DEFAULT '[]', section_names jsonb, assigned_student_ids jsonb DEFAULT '[]', status text DEFAULT 'draft', scheduled_at timestamptz, started_at timestamptz, ended_at timestamptz, is_timed boolean DEFAULT false, start_buffer_minutes int DEFAULT 10, exam_duration_minutes int DEFAULT 60, allow_copy_paste boolean DEFAULT true, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.mcq_questions (id text PRIMARY KEY, question text DEFAULT '', options jsonb DEFAULT '[]', correct_index int DEFAULT 0, category text, difficulty text, marks numeric DEFAULT 1, explanation text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.mcq_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id text, exam_id text, mcq_id text, selected_index int, is_correct boolean, marks_awarded numeric DEFAULT 0, submitted_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.writing_questions (id text PRIMARY KEY, title text, prompt text, min_words int DEFAULT 0, max_words int DEFAULT 500, marks numeric DEFAULT 10, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.writing_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id text, exam_id text, writing_id text, answer_text text, word_count int DEFAULT 0, marks_awarded numeric DEFAULT 0, max_marks numeric DEFAULT 0, submitted_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.fib_questions (id text PRIMARY KEY, sentence text, answers jsonb DEFAULT '[]', case_sensitive boolean DEFAULT false, marks numeric DEFAULT 1, difficulty text, explanation text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.fib_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id text, exam_id text, fib_id text, answers jsonb DEFAULT '[]', is_correct boolean, marks_awarded numeric DEFAULT 0, max_marks numeric DEFAULT 0, submitted_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.exam_feedback (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id text, exam_id text, rating int, comments text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.reevaluation_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id text, student_name text, exam_id text, question_id text, question_type text, reason text, status text DEFAULT 'pending', admin_response text, resolved_at timestamptz, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.admin_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message text, target text DEFAULT 'all', target_student_ids jsonb DEFAULT '[]', duration_seconds int, expires_at timestamptz, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.registrations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, email text, phone text DEFAULT '', notes text DEFAULT '', status text DEFAULT 'pending', approved_at timestamptz, approved_student_id text, link_id text, link_title text, answers jsonb DEFAULT '{}', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.codexam_settings (key text PRIMARY KEY, value jsonb, updated_at timestamptz DEFAULT now());
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS client_id text UNIQUE;

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','subadmin','student'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id, role));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.site_settings (key text PRIMARY KEY, value jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.site_settings TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated; GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_login_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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

-- Server access without the secret server key: the website's server sends the
-- CRON_SECRET in a private header; only its fingerprint is stored here. A signed-in
-- admin links it automatically (Admin Controls). It gives the server staff access only.
CREATE TABLE IF NOT EXISTS public.server_access (
  key_hash text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.server_access FROM anon, authenticated;
GRANT ALL ON public.server_access TO service_role;
ALTER TABLE public.server_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.server_request() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(length(h.k) >= 16 AND EXISTS (
    SELECT 1 FROM public.server_access a WHERE a.key_hash = encode(sha256(convert_to(h.k, 'UTF8')), 'hex')
  ), false)
  FROM (SELECT NULLIF(current_setting('request.headers', true), '')::json->>'x-server-key' AS k) h
$$;
REVOKE ALL ON FUNCTION public.server_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.server_request() TO anon, authenticated, service_role;

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
  SELECT (_user_id IS NULL AND _role IN ('admin','subadmin') AND public.server_request())
    OR (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    AND (_role NOT IN ('admin','subadmin') OR (_user_id = auth.uid() AND public.admin_session_is_approved())))
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (_user_id IS NULL AND public.server_request())
    OR (_user_id = auth.uid() AND public.admin_session_is_approved()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','subadmin')))
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
DROP TRIGGER IF EXISTS approval_setting_session ON public.site_settings;
CREATE TRIGGER approval_setting_session BEFORE INSERT OR UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.preserve_approval_settings_session();

CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, email text, full_name text, phone text, college text, degree text, graduation_year int, bio text, location text, skills text[], avatar_url text, resume_url text, github_url text, linkedin_url text, email_verified boolean NOT NULL DEFAULT true, verify_token text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin profile delete" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE need boolean;
BEGIN
  SELECT COALESCE((value->>'requireEmailVerification')::boolean, false) INTO need FROM public.site_settings WHERE key = 'auth';
  need := COALESCE(need, false) AND lower(NEW.email) <> 'jobportalfreeofficial@gmail.com';
  INSERT INTO public.profiles (user_id, email, full_name, phone, college, degree, email_verified, verify_token)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NULLIF(NEW.raw_user_meta_data->>'phone',''), NULLIF(NEW.raw_user_meta_data->>'college',''), NULLIF(NEW.raw_user_meta_data->>'degree',''),
          NOT need, CASE WHEN need THEN replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','') END)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  IF lower(NEW.email) = 'jobportalfreeofficial@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text, company text, description text, location text, job_type text, experience_level text, salary_range text, skills_required text[], deadline timestamptz, source_url text, scraped_content text, scheduled_publish_at timestamptz, is_active boolean NOT NULL DEFAULT true, posted_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.headlines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), text text NOT NULL, is_active boolean NOT NULL DEFAULT true, created_by uuid, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.promo_banners (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, subtitle text, link_url text, icon_type text NOT NULL DEFAULT 'sparkles', is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.resume_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, category text, download_url text NOT NULL DEFAULT '', preview_url text, source_url text, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.interview_prep (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, category text NOT NULL DEFAULT 'general', content text NOT NULL DEFAULT '', tips text[], is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['jobs','headlines','promo_banners','resume_templates','interview_prep'] LOOP
  EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "staff manage" ON public.%I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
END LOOP; END $$;

CREATE TABLE IF NOT EXISTS public.applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE, cover_letter text, resume_url text, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.saved_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE, user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(job_id, user_id));
CREATE TABLE IF NOT EXISTS public.job_preferences (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, preferred_job_types text[], preferred_locations text[], preferred_skills text[], is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL, message text, is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.contact_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL, subject text NOT NULL, message text NOT NULL, is_read boolean NOT NULL DEFAULT false, admin_reply text, replied_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.subadmin_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE, purpose text NOT NULL DEFAULT '', reason text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending', reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.subadmin_permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, can_manage_jobs boolean NOT NULL DEFAULT false, can_view_applications boolean NOT NULL DEFAULT false, can_manage_templates boolean NOT NULL DEFAULT false, can_manage_headlines boolean NOT NULL DEFAULT false, can_manage_banners boolean NOT NULL DEFAULT false, can_view_messages boolean NOT NULL DEFAULT false, can_view_analytics boolean NOT NULL DEFAULT false, can_view_users boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.application_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE, admin_id uuid NOT NULL, note text, rating int, created_at timestamptz NOT NULL DEFAULT now());
DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['applications','saved_jobs','job_preferences','notifications','contact_messages','subadmin_requests','subadmin_permissions','application_notes'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "staff all" ON public.%I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
END LOOP;
FOREACH t IN ARRAY ARRAY['applications','saved_jobs','job_preferences','notifications'] LOOP
  EXECUTE format('CREATE POLICY "own rows" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
END LOOP;
FOREACH t IN ARRAY ARRAY['subadmin_requests','subadmin_permissions'] LOOP
  EXECUTE format('CREATE POLICY "own read" ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid())', t);
END LOOP; END $$;
CREATE POLICY "own request insert" ON public.subadmin_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own messages" ON public.contact_messages FOR SELECT TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "send message" ON public.contact_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ DELETE FROM public.notifications WHERE created_at < now() - interval '30 days' $$;

CREATE OR REPLACE FUNCTION public.verify_email_token(_token text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF _token IS NULL OR length(_token) < 32 THEN RETURN false; END IF;
  UPDATE public.profiles SET email_verified = true, verify_token = NULL WHERE verify_token = _token;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n > 0;
END $$;
GRANT EXECUTE ON FUNCTION public.verify_email_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.pending_verify_token(_email text, _secret text DEFAULT NULL) RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT p.verify_token FROM public.profiles p
  WHERE public.server_request() AND lower(p.email) = lower(_email) AND p.email_verified = false AND p.created_at > now() - interval '1 day' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.pending_verify_token(text, text) FROM PUBLIC, authenticated;
-- Callable by the website's server only: without the private header it returns nothing.
GRANT EXECUTE ON FUNCTION public.pending_verify_token(text, text) TO anon, service_role;

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  device text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ended_at timestamptz
);
CREATE INDEX IF NOT EXISTS admin_sessions_created_idx ON public.admin_sessions (created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.admin_sessions TO authenticated;
GRANT ALL ON public.admin_sessions TO service_role;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff insert own session" ON public.admin_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_staff(auth.uid()));
CREATE POLICY "own or admin read sessions" ON public.admin_sessions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own or admin update sessions" ON public.admin_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.exam_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  student_name text,
  student_email text,
  exam_title text,
  kind text NOT NULL CHECK (kind IN ('camera','screen')),
  path text NOT NULL UNIQUE,
  size_bytes bigint,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.exam_recordings TO anon;
GRANT INSERT, SELECT, DELETE ON public.exam_recordings TO authenticated;
GRANT ALL ON public.exam_recordings TO service_role;
ALTER TABLE public.exam_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exam clients can log recordings" ON public.exam_recordings FOR INSERT TO anon, authenticated
  WITH CHECK (path LIKE 'rec/%' AND kind IN ('camera','screen') AND length(student_id) BETWEEN 1 AND 200);
CREATE POLICY "Staff read recordings" ON public.exam_recordings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete recordings" ON public.exam_recordings FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS exam_recordings_created_idx ON public.exam_recordings (created_at DESC);

CREATE TABLE IF NOT EXISTS public.student_credentials (
  student_id text PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  password text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.student_credentials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_credentials TO authenticated;
GRANT ALL ON public.student_credentials TO service_role;
ALTER TABLE public.student_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage credentials" ON public.student_credentials FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "new student first password" ON public.student_credentials FOR INSERT TO anon
  WITH CHECK (length(password) BETWEEN 6 AND 100);

DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['questions','mcq_questions','writing_questions','fib_questions','admin_notifications'] LOOP
  EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "exam read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "staff manage" ON public.%I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
END LOOP;
FOREACH t IN ARRAY ARRAY['exams','students','submissions','mcq_submissions','writing_submissions','fib_submissions','exam_feedback','reevaluation_requests','codexam_settings'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "exam read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "exam insert" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);
  EXECUTE format('CREATE POLICY "exam update" ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t);
  EXECUTE format('CREATE POLICY "staff delete" ON public.%I FOR DELETE TO authenticated USING (public.is_staff(auth.uid()))', t);
END LOOP;
FOREACH t IN ARRAY ARRAY['submissions','mcq_submissions','writing_submissions','fib_submissions'] LOOP
  EXECUTE format('CREATE POLICY "exam replace answer" ON public.%I FOR DELETE TO anon, authenticated USING (true)', t);
END LOOP; END $$;

GRANT INSERT ON public.registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can register" ON public.registrations FOR INSERT TO anon, authenticated WITH CHECK (status IN ('pending','approved'));
CREATE POLICY "staff manage registrations" ON public.registrations FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.app_secrets (key text PRIMARY KEY, value text NOT NULL);
GRANT ALL ON public.app_secrets TO service_role;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users upload own resume" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users update own resume" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "read own resume or staff" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));
CREATE POLICY "staff upload templates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'templates' AND public.is_staff(auth.uid()));
CREATE POLICY "read templates" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'templates');
CREATE POLICY "Exam clients upload recordings" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'exam-recordings' AND (storage.foldername(name))[1] = 'rec');
CREATE POLICY "Staff read exam recordings" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'exam-recordings' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete exam recordings" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exam-recordings' AND public.is_staff(auth.uid()));

-- 3) Exam passwords: copy into the staff-only store, then remove the public copies.
INSERT INTO public.student_credentials (student_id, password)
SELECT o.student_id, o.password FROM _old_student_passwords o
JOIN public.students s ON s.id = o.student_id
ON CONFLICT (student_id) DO NOTHING;
ALTER TABLE public.students DROP COLUMN IF EXISTS password;
ALTER TABLE public.registrations DROP COLUMN IF EXISTS password;

-- 4) File folders used by resumes, resume templates and exam recordings.
INSERT INTO storage.buckets (id, name, public) VALUES
  ('resumes','resumes', false), ('templates','templates', false), ('exam-recordings','exam-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- 5) Job alerts: the admin can switch alerts off for one person.
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS admin_paused boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.guard_job_alert_pause() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only staff may change the admin switch; a user saving their own alerts keeps the admin's choice.
  IF NOT public.is_staff(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN NEW.admin_paused := false;
    ELSE NEW.admin_paused := OLD.admin_paused; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_job_alert_pause ON public.job_preferences;
CREATE TRIGGER guard_job_alert_pause BEFORE INSERT OR UPDATE ON public.job_preferences
FOR EACH ROW EXECUTE FUNCTION public.guard_job_alert_pause();

-- 6) Admin account: make sure jobportalfreeofficial@gmail.com is an admin.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'jobportalfreeofficial@gmail.com'
ON CONFLICT DO NOTHING;

-- 7) Quick-start students who signed up earlier can see their scores.
UPDATE public.students s SET show_results = 'show'
WHERE coalesce(s.show_results, 'default') = 'default'
  AND EXISTS (SELECT 1 FROM public.registrations r WHERE r.approved_student_id = s.id AND r.notes ILIKE 'Quick-start%');

-- 8) Website server access (works with only the Brevo key + CRON_SECRET on Cloudflare).
CREATE OR REPLACE FUNCTION public.register_server_key(_hash text, _label text DEFAULT '') RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
  IF _hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid key'; END IF;
  INSERT INTO public.server_access(key_hash, label) VALUES (_hash, left(coalesce(_label, ''), 60))
  ON CONFLICT (key_hash) DO NOTHING;
  -- Keep only the newest few linked servers (e.g. live site + preview).
  DELETE FROM public.server_access WHERE key_hash NOT IN (SELECT key_hash FROM public.server_access ORDER BY created_at DESC LIMIT 4);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.register_server_key(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_server_key(text, text) TO authenticated;

DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity AND c.relname <> 'server_access' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "website server" ON public.%I', t.relname);
    EXECUTE format('CREATE POLICY "website server" ON public.%I FOR ALL TO anon USING ((SELECT public.server_request())) WITH CHECK ((SELECT public.server_request()))', t.relname);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', t.relname);
  END LOOP;
END $$;

COMMIT;
NOTIFY pgrst, 'reload schema';
