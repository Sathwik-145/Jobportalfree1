# Roadmap

## Done (this import)
- [x] Imported the full JobPortalFree + CodeXam project and connected it to the user's own database (jobs, students, tests, MCQs all load).
- [x] Every page now has its own address (74 pages) with page titles; old navigation calls kept working.
- [x] Fixed admin pages bouncing to the home page after a refresh.
- [x] New design system (Sapphire ink & ember, Sora/Manrope) for both portals; new top menu with "Everything" menu, phone bottom menu, new footer, split-screen sign-in/sign-up/password pages, new home hero with one-place launcher, dark admin side rail, grouped CodeXam admin menu, refreshed exam login.
- [x] One place for admins: Job Portal admin menu now lists the CodeXam exam tools; CodeXam admin links back.
- [x] Admin AI assistant and JobBot chat verified working with the built-in AI (Gemini key optional).
- [x] All 111 automated checks pass.

- [x] Page switches no longer flash the full loading screen; links preload; admin → exam tools without reload.
- [x] Chat bubble hidden on all exam pages.
- [x] Removed built-in exam admin password from the app.
- [x] Admin sign-in alert fixed (was refused).
- [x] Added 30 jobs (36 total).
- [x] Vercel settings file + env checklist given.

- [x] Exam settings tabs fixed (tab switching was broken) and the page redesigned into Portal / Students / Email groups.
- [x] CodeXam admin sidebar redesigned (search, folding groups, student pages, back link).
- [x] Exam recordings and monitoring switches moved to the exam portal only; Job Portal admin keeps one CodeXam link.
- [x] AI replies faster: JobBot streams, admin AI and rechecks use quick-thinking settings (~2s to first words).

## Now (this request)
- [ ] Add global and per-festival artwork durations, including permanent, 1 minute and 5 minutes.
- [ ] Balance the too-light panel colour and verify festival timing behaviour.
- [x] Refresh feature-panel colour and align everyday hover states with the admin theme.
- [x] Add five more modern animated home designs, keeping the existing five.
- [x] Check all ten design options on desktop and phone, plus job search.
- [x] Imported project as-is into this app (139 checks pass, home page loads live data).
- [x] Festival background tint matched to site colours; festival picture shows ~5s in the launcher spot, then the main card.
- [x] Success pop-ups green, error pop-ups red.
- [x] Exam settings moved to the top of the CodeXam admin menu.
- [x] Everyday background look switches reliably (also while a festival is showing).
- [x] 5 home page designs the admin can pick from.
- [x] 7 colourful report PDF designs.
- [x] Check all pages for broken parts.

- [x] Theme colours (incl. feature panel colour, auto text colour) saved online for everyone.

## This import (Nov 2026)
- [x] Rebuilt the project here as-is with a fresh database layout (no old records yet).
- [x] Admin switch for festival looks on student exam pages and exam admin pages.
- [x] Quick start no longer says "Exam no longer available": each student gets their own start window from sign-up.
- [x] Admin-editable test allocation settings (quick start on/off, start windows, random pool, booking days/slots, default email).
- [x] Slot bookings saved online; one-click approve allocates a chosen or random test and emails login details (single or bulk, incl. link registrants).
- [x] Old records copied from the previous database (36 jobs, 76 tests, 160 MCQs, 55 fill-in-blanks, 4 students, results, 67 settings); admin account recreated with the same ID.
- [x] Admin password set to the one requested (user will change it).
- [ ] Student exam passwords were not copied — reissue from the admin panel.

## Now (Nov 9 request)
- [ ] "Student workspace · Your exams" heading not showing on student dashboard.
- [ ] Submit-test confirmation box bigger and centred.
- [ ] Quick-start students see their results after submitting.
- [ ] Slot bookings show up for admin approval (approve with chosen or random test, mail login + timing).
- [ ] Admin auto-approve for slot bookings: immediately, after 5 min, or custom minutes.
- [ ] Refresh buttons on link registrants.

## Open
- [x] Moved to Lovable Cloud with all records copied (36 jobs, 76 tests, 160 MCQs, 4 students, results, settings); admin account recreated.
- [x] Secured exam data: passwords in a staff-only store, sign-in checked on the server, question bank and registrations locked to staff, credential/result mail tools admin-only.
- [x] Student exam screens redesigned for phone and desktop.
- [ ] Brevo key (BREVO_API_KEY) — needed for every email (verification, results, alerts). Blocked on the user adding it.
- [ ] CRON_SECRET — same value in this project and GitHub → Actions secrets. Blocked on the user.
- [ ] GEMINI_API_KEY (optional) — AI already works without it; "Find recent jobs" web search needs it.
- [ ] Admin should change the temporary admin password (it is on a public leaked-password list).
- [ ] Uploaded files (resumes, template files, recordings) from the old database could not be copied.
- [ ] Live email delivery and scheduled result mails unverified until Brevo + CRON_SECRET are set.

## Latest request
- [x] Admin sign-in approval starts OFF; turning it on works without the secret database key (uses Brevo + CRON_SECRET).
- [x] Verification email and student exam login use the same website server access.
- [x] Chatbot / admin AI: removed the Gemini thinking setting that made direct Gemini calls fail; extra fallback model.
- [x] Failing GitHub "Deploy to Vercel" check now runs only by hand.
- [ ] Run database/upgrade-existing-database.sql in the database SQL editor (waiting on the user).
- [ ] Editable job alert email templates and "booking received" email.
- [x] Moved off Lovable: plain Vite build, Supabase project configured by environment variables, deploys to Cloudflare Workers from GitHub.
