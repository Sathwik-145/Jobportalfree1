-- =====================================================================
-- New features: application tracker (status history + student notifications)
-- and saved resumes for the resume builder.
-- Safe to run more than once. Paste into Supabase -> SQL Editor -> Run.
-- =====================================================================

-- ---- Application tracker ----------------------------------------------
ALTER TABLE public.applications ALTER COLUMN status SET DEFAULT 'applied';
UPDATE public.applications SET status = 'applied' WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_status_history_app_idx
  ON public.application_status_history (application_id, created_at);
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own or staff read status history" ON public.application_status_history;
CREATE POLICY "own or staff read status history" ON public.application_status_history
  FOR SELECT TO authenticated USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.track_application_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE job_title text;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_status_history (application_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO job_title FROM public.jobs WHERE id = NEW.job_id;
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id, 'Application update',
            'Your application for ' || COALESCE(job_title, 'a job') || ' is now: ' || NEW.status);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS applications_track_status ON public.applications;
CREATE TRIGGER applications_track_status AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.track_application_status();

-- Give existing applications a starting point in the timeline.
INSERT INTO public.application_status_history (application_id, status, created_at)
SELECT a.id, a.status, a.created_at FROM public.applications a
WHERE NOT EXISTS (SELECT 1 FROM public.application_status_history h WHERE h.application_id = a.id);

-- ---- Resume builder ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resumes (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  template text NOT NULL DEFAULT 'classic',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own resume select" ON public.resumes;
DROP POLICY IF EXISTS "own resume insert" ON public.resumes;
DROP POLICY IF EXISTS "own resume update" ON public.resumes;
CREATE POLICY "own resume select" ON public.resumes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own resume insert" ON public.resumes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own resume update" ON public.resumes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
