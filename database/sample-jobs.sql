-- =====================================================================
-- JobPortalFree  |  SAMPLE JOBS  (step 3 of 3, OPTIONAL)
--
-- These are made-up listings from fictional companies so a fresh site is not empty
-- while you are testing. DO NOT leave them on a live site: students would apply to
-- jobs that do not exist.
--
-- To remove them later (run in the SQL Editor):
--     DELETE FROM public.jobs WHERE source_url = 'sample-data';
-- =====================================================================

INSERT INTO public.jobs (title, company, description, location, job_type, experience_level, salary_range, skills_required, deadline, source_url, is_active)
SELECT v.t, v.c, v.d, v.l, v.jt, v.el, v.s, v.sk, now() + interval '45 days', 'sample-data', true FROM (VALUES
  ('Junior Frontend Developer', 'Sample Labs', 'Build and maintain responsive user interfaces with React and TypeScript.', 'Hyderabad', 'full-time', 'entry', '₹4 – 6 LPA', ARRAY['React','TypeScript','HTML/CSS','Git']::text[]),
  ('Backend Developer Intern', 'Sample Labs', 'Work with the platform team on REST APIs and database queries.', 'Remote', 'internship', 'entry', '₹15,000 – 25,000 / month', ARRAY['Node.js','SQL','REST APIs','Git']::text[]),
  ('Data Analyst', 'Example Analytics', 'Turn raw data into dashboards and weekly insight reports.', 'Bengaluru', 'full-time', 'entry', '₹4 – 7 LPA', ARRAY['SQL','Excel','Python','Power BI']::text[]),
  ('QA Engineer', 'Example Analytics', 'Design test plans and automate regression suites.', 'Pune', 'full-time', 'entry', '₹3.5 – 5.5 LPA', ARRAY['Selenium','API Testing','Jest']::text[]),
  ('UI/UX Designer', 'Demo Studio', 'Own the design of web and mobile flows from research to hand-off.', 'Chennai', 'full-time', 'mid', '₹6 – 10 LPA', ARRAY['Figma','Prototyping','Design Systems']::text[]),
  ('Full Stack Developer', 'Demo Studio', 'Ship features end to end across a React front end and a Node.js API.', 'Hyderabad', 'full-time', 'mid', '₹8 – 14 LPA', ARRAY['React','Node.js','PostgreSQL','TypeScript']::text[]),
  ('DevOps Engineer', 'Placeholder Cloud', 'Maintain CI/CD pipelines and cloud infrastructure.', 'Remote', 'contract', 'mid', '₹10 – 16 LPA', ARRAY['AWS','Docker','CI/CD','Linux']::text[]),
  ('Digital Marketing Executive', 'Placeholder Cloud', 'Plan and run SEO and social campaigns.', 'Mumbai', 'full-time', 'entry', '₹3 – 4.5 LPA', ARRAY['SEO','Content Strategy','Google Analytics']::text[])
) AS v(t, c, d, l, jt, el, s, sk)
WHERE NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.title = v.t AND j.company = v.c);
