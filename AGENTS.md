# Project notes for AI assistants and contributors

Stack: TanStack Start + React, Supabase (database, auth, storage), deployed to Cloudflare Workers from GitHub.
Database setup lives in `database/*.sql` (run in the Supabase SQL Editor); keep `drizzle/` as the schema reference.

## Project rules

- Backend is Supabase; the schema is database/fresh-supabase-setup.sql (mirrored in drizzle/migrations), so never re-add the legacy open-access exam policies.
- Every page is a real TanStack file route under src/routes rendered client-only (ssr: false + lazyRouteComponent); pass the lazy component directly or preload it in loader so navigation keeps the current page on screen instead of suspending to the boot screen. Pages keep Link/useNavigate/useLocation via src/lib/router-compat.tsx (its Link preloads on hover/touch), never react-router-dom or window.location for internal pages.
- Help chat/AI bubbles are hidden on every exam page via src/lib/examPaths.ts; extend that matcher for new exam pages.
- Browser-only providers (auth, exam auth, themes, festival effects, chat widgets) mount once in src/components/AppProviders.tsx after hydration from __root; add new global UI there.
- Guards: ProtectedRoute for signed-in/admin pages, src/components/ExamProtected.tsx for CodeXam pages; exam admin pages require a real admin/sub-admin role (bridged into exam auth without a reload, never a built-in password); /admin is a layout route whose page renders <Outlet />.
- AuthContext finishes loading only after roles are fetched so guarded admin pages never bounce on reload.
- Exam passwords live only in the staff-only student_credentials table; student sign-in is checked by the checkStudentPassword server function, and serverDb() uses the server key, so every /api/public route using it must verify its caller first.
- tsconfig mirrors the original project's strictness (strict, without the extra index/optional-property flags) because the imported code was written against it.

## Imported rules

- Render exam-email previews and outgoing HTML/text through the shared browser-safe mailContent module so formatting and conditional schedule details stay consistent.
- Resolve built-in email pictures (public/email/) through the browser-safe mailImages catalog, whose origin comes from VITE_SITE_URL, never from the sending request's origin, so preview and recipient URLs stay identical.
- Keep rich email formatting as an escaped, allowlisted text syntax with a sandboxed preview; never trust raw HTML or recipient values as markup.
- Pass email schedule visibility and schedule-source choices independently from assignment start times so hiding email dates never changes student access.
- Build result summaries and detailed PDFs only through src/exam/lib/resultReport.ts so browser downloads, admin emails and automatic server emails stay identical.
- Delayed/automatic result emails are queued in the codexam_settings key "result_mail_queue" and flushed by /api/public/run-mail-schedule (pinged by the GitHub cron); per-test settings live in "result_auto_send".
- AI features use GEMINI_API_KEY (Google Generative AI).
- Store report corrections separately and apply them through the shared report builder, preserving original submissions and test-scoped grading.
- Store the exam display name in exam_branding and resolve it for screen labels, mail and PDFs so branding changes stay consistent.
- Persist landing content in site_settings; local browser storage is only a display cache, never the save source of truth.
- Use the existing festival settings for independent artwork, theme, motion and greeting controls; suppress celebration during exam activity.
- Resolve festival dates through the shared calendar helper with year-scoped overrides, preserving legacy ranges; never extrapolate unknown lunar dates because regional observances vary.
- Route every application email through the shared fetch-based Brevo transport; this avoids SMTP runtime incompatibility and keeps provider errors consistent.
- Store recipient lists in one shared email-based catalog and map addresses to student IDs at exam surfaces; this keeps lists portable between both portals without changing existing student credentials.
- Resolve daily plan IDs and exam start-window eligibility through the shared examAvailability helpers; mail, dashboard and exam entry must use the same exact-day assignment and time rules.
- Resolve daily replacement tests through dailyAssignments using saved submissions and exam_completed settings markers; persist the chosen day's IDs so student access and outgoing mail agree without repeating completed tests.
- Admin sign-ins are recorded in admin_sessions; remote logout works by revoking rows that each admin tab polls every minute (no service key needed on Cloudflare).
- Verify-email and admin-alert wording lives in codexam_settings "system_mail_templates" with defaults in src/lib/system-mail-templates.ts, so admins can edit without code changes.
- AI fill-in-the-blank rechecks run through /api/public/recheck-fib (admin-verified) and save accepted equivalents as report corrections, never by rewriting submissions.
- Keep shared exam media in mediaSession and stop it synchronously on final submission or termination; monitoring must cover all question sections.
- Resolve personal-login eligibility through loginIdentity and personal_login_policy, independently from schedule credential display; preserve canonical credentials and reject duplicate personal aliases.
- Grant instant exam access through student_exam_slots and the shared availability helper so individual overrides never change another student's schedule or saved answers.
- Site-wide visual tokens and component classes (surface, surface-ink, eyebrow, btn-pill, admin-rail, mobile-dock, page-hero) live in src/styles.css; restyle there rather than per page so both portals stay consistent. Colour tokens stay HSL triplets because the admin Theme page rewrites --primary/--accent/--secondary at runtime.
- CodeXam admin navigation is defined once in EXAM_ADMIN_NAV (src/exam/components/AdminLayout.tsx); exam-only tools (recordings, monitoring switches) live only in the CodeXam admin and the Job Portal admin links to it with a single entry, so nothing is duplicated across portals.
- AI calls pass fastAiOptions (src/lib/ai-speed.ts) and chat replies stream, so answers start within about two seconds instead of waiting for long model thinking.
- Additional home layouts render through ModernLandingHero using the shared landing props and theme tokens, so admin content, job search and destinations stay identical across designs.
- Festival artwork timing is resolved through festivalArtwork with per-festival overrides and visit-scoped expiry; permanent mode lasts only while the festival is active, without altering calendar eligibility.
- Random test allocation (quick start, approvals, slot bookings) goes through src/exam/lib/testAllocation.ts with admin settings in codexam_settings "test_allocation"; every allocation writes a personal student_exam_slots window so access never depends on when the test was first started.
- Registrations, bookings and link sign-ups are approved only through /api/public/approve-registrations (admin token checked first), which creates the login, allocates the chosen or random test and emails credentials in one step; slot bookings live in registrations.answers (slot_start), never in browser storage.
- Festival looks on exam pages follow festivalAllowedOn (src/lib/examPaths.ts) with the examPages / examAdminPages switches in the festivals site setting.
- Without a database server key, serverDb() identifies the website server with an x-server-key header (CRON_SECRET) whose SHA-256 fingerprint a signed-in main admin links via register_server_key; so Cloudflare needs only Brevo + CRON_SECRET.
- Admin sign-in approval defaults to off; turning it off never needs database setup, turning it on requires the approval tables, Brevo and a linked server.
- Every database connection goes through src/lib/database-target.ts (browser client via @/lib/db-client, server URL/keys via databaseUrl/databaseKey/databaseServiceKey), all driven by environment variables for a single Supabase project.
