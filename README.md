# Job Portal
# 🚀 JobPortalFree — Free Job Portal for Students & Freshers

> A full-stack job portal built for students and freshers in India. Find jobs, apply instantly, upload your resume to get matched with relevant roles, prepare for interviews, take assessments, get certified, and message the admin directly — all in one place. **Free forever.**

[![Cloudflare](https://img.shields.io/badge/Hosted%20on-Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![CI](https://github.com/Sathwik-145/JobPortalFree/actions/workflows/ci.yml/badge.svg)](https://github.com/Sathwik-145/JobPortalFree/actions/workflows/ci.yml)
[![Built with React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green?logo=supabase)](https://supabase.com/)

---

## 🌐 Live Links

| | URL |
|--|-----|
| 📦 **GitHub Repo** | [github.com/Sathwik-145/JobPortalFree](https://github.com/Sathwik-145/JobPortalFree) |
| 🔑 **Admin Login** | `admin@jobportal.com` / `Admin@123456` |

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [User Features](#-user-features)
  - [Home Page](#-home-page)
  - [Dark Mode / Light Mode](#-dark-mode--light-mode)
  - [Job Search & Listings](#-job-search--listings)
  - [Job Detail & Apply](#-job-detail--apply)
  - [Resume Upload & Skill-Based Job Notifications](#-resume-upload--skill-based-job-notifications)
  - [Job Alerts](#-job-alerts)
  - [My Applications](#-my-applications)
  - [Saved Jobs](#-saved-jobs)
  - [User Profile](#-user-profile)
  - [Resume Templates](#-resume-templates)
  - [Interview Preparation](#-interview-preparation)
  - [Important Concepts](#-important-concepts)
  - [Certifications](#-certifications)
  - [Assessments](#-assessments)
  - [Messages to Admin](#-messages-to-admin--within-1-hour-reply)
  - [AI Chat Assistant](#-ai-chat-assistant)
  - [Contact Us](#-contact-us--reply-within-5-hours)
  - [Notifications](#-notifications)
  - [Authentication](#-authentication)
- [Admin Features](#-admin-features)
  - [Admin Dashboard](#-admin-dashboard)
  - [Post / Edit Jobs](#-post--edit-a-job)
  - [Manage Jobs](#-manage-jobs)
  - [Bulk Import Jobs](#-bulk-import-jobs)
  - [Company Job Posting Requests](#-company-job-posting-requests)
  - [Manage Applications](#-manage-applications)
  - [Application Tracking Board](#-application-tracking-board)
  - [Manage Users](#-manage-users)
  - [Manage Sub-Admins](#-manage-sub-admins)
  - [Admin Messages & Replies](#-admin-messages--replies)
  - [Analytics](#-analytics)
  - [Manage Headlines](#-manage-headlines)
  - [Manage Promo Banners](#-manage-promo-banners)
  - [Manage Resume Templates](#-manage-resume-templates)
  - [Theme Settings](#-theme-settings)
  - [Landing Page Settings](#-landing-page-settings)
  - [Manage Concepts](#-manage-concepts)
- [Exam Portal — CodeXam](#-exam-portal--codexam)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Environment Variables](#-environment-variables)
- [Local Setup](#-local-setup)
- [Project Structure](#-project-structure)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| UI Components | shadcn/ui, Radix UI |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Animations | Framer Motion |
| AI Chat | Vercel AI SDK (streaming) |
| Deployment | Cloudflare Workers |
| CI/CD | GitHub Actions |
| Package Manager | npm |
| Charts | Recharts |
| Spreadsheet | SheetJS (xlsx) |

---

## 👤 User Features

---

### 🏠 Home Page

The landing page is the first thing every visitor sees. It is fully dynamic and controlled by the admin.

- **Live Stats Bar** — Real-time counts of active jobs, registered users, and total applications pulled from Supabase
- **Hero Search** — Three-field smart search: Job Title, Location, and Experience Level, each with AutoSuggest dropdowns pre-filled with popular options
- **AutoSuggest** — As you type, relevant suggestions appear for titles (Frontend Developer, Data Scientist, etc.), locations (Hyderabad, Bangalore, Remote, etc.), and experience levels (Fresher, 0-1 years, Senior, etc.)
- **Headline Ticker** — A scrolling news-style banner at the top of the page. Admin updates the messages from the dashboard. Examples: "New TCS jobs posted", "Assessment slots open"
- **Promo Banner** — A highlighted promotional strip below the navbar with a custom message and CTA button link, fully managed by admin
- **Company Marquee** — An infinite scrolling strip of top hiring companies (TCS, Infosys, Google, Amazon, etc.) to build trust with visitors
- **Latest Jobs Section** — Shows the 6 most recently posted active jobs. Each card has a one-click Save button (bookmark icon) for logged-in users
- **Job Category Quick-Links** — Icon cards for Tech, Design, Marketing, Finance, Operations, and more to jump straight to filtered job search
- **Testimonials Marquee** — Real user testimonials in an infinite horizontal scroll
- **Features Section** — Highlights platform benefits: Free access, Resume templates, Job alerts, Interview prep, Certifications
- **Footer** — Links to all pages, social media, and contact email

---

### 🌗 Dark Mode / Light Mode

Every page on the site supports full Dark Mode and Light Mode switching.

- A **Sun/Moon toggle button** is always visible in the top navigation bar
- Clicking the toggle instantly switches the entire site between dark and light themes
- The chosen theme is **saved to localStorage** so it persists across page reloads and sessions
- Supports three modes internally: `light`, `dark`, and `system` (follows your OS setting)
- All components — cards, modals, forms, tables, charts — respect the active theme
- Theme is applied via CSS class (`dark` / `light`) on the root HTML element using Tailwind's dark mode utilities
- Custom brand colors (set by admin in Theme Settings) also respect dark/light mode

---

### 🔍 Job Search & Listings

The `/jobs` page is the core of the portal.

- **Keyword Search** — Search across job title, company name, description, and location simultaneously
- **Filter by Job Type** — All, Full-time, Part-time, Internship, Remote, Contract
- **Filter by Experience Level** — All, Fresher, Junior, Mid-level, Senior
- **Sort Options** — Newest first, Oldest first, Salary (high to low), Title (A–Z)
- **Pagination** — 12 jobs per page with Previous / Next controls
- **URL-synced filters** — Search parameters are reflected in the URL so results pages are shareable
- **Save / Unsave** — Bookmark icon on each job card. Saved status syncs to Supabase and is restored on next visit
- Each **Job Card** shows: Job title, Company, Location badge, Job type badge, Salary range, Time since posting

---

### 📄 Job Detail & Apply

Clicking any job card opens the full job detail page at `/jobs/:id`.

- Full **Markdown-rendered** job description with headings, bullet points, and formatting
- **Skills Required** shown as pill badges
- **Application Deadline** displayed with the exact date
- **One-Click Apply** button opens an apply dialog with:
  - Resume URL field (link to hosted resume or uploaded resume)
  - Cover Letter text area
  - Duplicate application prevention — the apply button becomes "Applied" if already submitted
- **Social Share** — Share the job on WhatsApp, Twitter/X, LinkedIn, or copy the link to clipboard
- Company info section with logo and description
- Related/similar jobs section at the bottom

---

### 📤 Resume Upload & Skill-Based Job Notifications

This is one of the most powerful features for job seekers. Upload your resume once and get notified about jobs that match your skills automatically.

**How it works:**

1. Go to **My Profile** (`/profile`)
2. Under the **Resume** section, click the dashed upload area
3. Upload your resume in **PDF, DOC, or DOCX** format
4. Your resume is securely stored in **Supabase Storage** under your user ID
5. The public URL of your resume is saved to your profile record in the database
6. When you apply to any job, your saved resume URL is **pre-filled automatically** in the application form — no re-uploading needed

**Skill-Based Job Matching for Notifications:**

1. Go to **Job Alerts** (`/job-alerts`)
2. Enter your **Preferred Skills** (comma-separated) — e.g., `React, Python, SQL, Machine Learning`
3. These skills are saved to the `job_preferences` table in Supabase alongside your user ID
4. When new jobs are posted that match your listed skills, you receive a **notification in the bell icon** in the navbar
5. You can also set preferred **locations** and **job types** so notifications are even more targeted
6. Toggle alerts **ON/OFF** any time without losing your preferences

> Your uploaded resume URL is directly used when applying — just click Apply on any job and your resume link is already there.

---

### 🔔 Job Alerts

The Job Alerts page (`/job-alerts`) lets you configure exactly what kinds of jobs you want to be notified about.

- **Preferred Locations** — Type any cities or work modes (e.g., `Remote, Bangalore, Hyderabad, Pune`)
  - As you type, saved values are shown as preview badges below the field
- **Preferred Job Types** — Specify the employment types you want (e.g., `full-time, internship, remote`)
- **Preferred Skills / Keywords** — The most important field. Enter your tech stack and domain skills (e.g., `React, Node.js, Python, SQL, Machine Learning`)
  - The system matches these skills against new job postings and sends you a notification in-app
- **Active / Inactive Toggle** — Switch alerts ON or OFF without deleting your preferences
- **Save Button** — Stores your preferences to Supabase immediately with a success toast
- Preferences are loaded and restored automatically every time you visit the page
- Works hand-in-hand with the **Notification Bell** in the navbar — when a matching job is posted, a notification appears instantly

---

### 💼 My Applications

The `/my-applications` page shows everything you have applied for.

- **Full application list** sorted by newest first
- Each card shows: Job title, Company, Location, Applied date, Current status
- **Status Badges** with colour coding:
  - 🔵 Applied — Initial submission
  - 🟡 Reviewed — Admin has seen the application
  - 🟢 Shortlisted — You are in the running
  - ✅ Selected — Congratulations!
  - ❌ Rejected — Not selected this time
  - ⚫ Withdrawn — You withdrew the application
- **Application Timeline** — A visual step-by-step horizontal/vertical progress tracker that shows which stage your application is currently at
- **Withdraw Application** — A "Withdraw" button with a confirmation dialog to safely remove your application
- Status updates from the admin (reviewed, shortlisted, etc.) reflect here in real time

---

### 🔖 Saved Jobs

The `/saved-jobs` page shows all the jobs you have bookmarked.

- Grid layout of all bookmarked job cards
- Each card has **View Job** (goes to full detail page) and **Unsave** (removes bookmark) buttons
- Saved state syncs to Supabase — your saved jobs persist across devices and sessions
- Empty-state illustration shown if no jobs are saved yet

---

### 👤 User Profile

The `/profile` page is your complete candidate profile.

**Resume Upload Section:**
- Dashed drag-style upload area for your resume file
- Accepts PDF, DOC, DOCX formats
- Uploaded file is stored in Supabase Storage bucket (`resumes`) under your user ID
- After upload, a public URL is generated and saved to your profile
- A **"View Resume"** link appears once a resume is uploaded so you can verify it
- This resume URL is auto-used when applying to jobs

**Personal Information:**
- Full Name, Phone Number
- College / University, Degree
- Graduation Year, Current Location
- Skills (comma-separated — stored as an array and used for job matching)
- Bio / About Me section (free text)
- LinkedIn Profile URL
- GitHub Profile URL

**Avatar Upload:**
- Profile picture upload stored in Supabase Storage
- Avatar shown in the navbar and profile page

**User Dashboard Widget:**
- Shows your total applications count
- Shows your total saved jobs count
- Profile completion nudge if key fields are missing

---

### 📑 Resume Templates

The `/resume-templates` page gives you ready-to-use professional resume formats.

- Curated library of resume templates from multiple categories
- Each template card shows: Template name, Category badge (e.g., Tech, Creative, ATS-friendly), Description
- **Download** button — directly downloads the template file
- **Preview** button — opens a live preview in a new tab
- **Source link** for templates sourced from external sites
- Admin-added templates appear first (sorted by admin priority), followed by built-in static templates
- Static fallback templates are always available even if the database is empty
- Animated card entrance using Framer Motion

---

### 🎯 Interview Preparation

The `/interview-prep` page is your complete interview readiness hub.

- **Accordion-style Q&A library** — questions are grouped by category and expand on click
- Categories included: **General, Technical, Behavioral, HR**
- Each Q&A item has:
  - Question title
  - Detailed answer paragraph
  - A **Tips** bullet list (3–5 tips per question)
- Default questions included out of the box:
  - "Tell me about yourself" (General)
  - "Common coding interview patterns" (Technical)
  - "STAR Method for behavioral questions" (Behavioral)
  - "Salary negotiation tips" (HR)
- **Admin can add, edit, delete questions** directly from this page without going to a separate admin panel (inline editing, protected by admin auth)
- **Reset to Default** button restores original questions if admin edits are undone
- Leads into the **Important Concepts** section below
- All edits persist in localStorage so changes survive page reloads

---

### 🧠 Important Concepts

The **Important Concepts** section is embedded in the Interview Prep page and also shown on the Home page. It is a curated knowledge base of must-know topics for placements and interviews.

**Topics Covered (8 Categories):**

| Category | Topics |
|----------|--------|
| **DSA** | Arrays & Strings, Hash Maps & Sets, Trees & BSTs, Graphs, Dynamic Programming |
| **OOPS** | Four Pillars (Encapsulation, Inheritance, Polymorphism, Abstraction), SOLID Principles |
| **Operating Systems** | Process vs Thread, Deadlocks (with Banker's Algorithm), Memory Management (Paging, TLB) |
| **SQL & DBMS** | Joins (INNER/LEFT/RIGHT/FULL), Normalization (1NF-BCNF), Indexes (B-Tree/Hash), ACID & Transactions |
| **Web Development** | HTTP & REST (verbs, status codes), Authentication (JWT/OAuth/Cookies), Browser Rendering (DOM/CSSOM), React Fundamentals |
| **Computer Networks** | OSI vs TCP/IP model, DNS & HTTPS (TLS handshake) |
| **Machine Learning** | CNN Basics (filters, pooling, feature maps), Bias-Variance Trade-off |
| **System Design** | Scalability (vertical vs horizontal), Load Balancers, Caching (Redis), CDN, Database Sharding |

**How each concept card works:**
- **Importance badge** — `Must Know` (highlighted in primary colour), `Important` (amber), `Good to Know` (grey)
- **Category filter buttons** — Filter to show only DSA, or only OOPS, etc.
- **Summary** — One-line description of what the concept is about
- **Bullet points** — 3–4 key sub-topics or rules to remember
- **Category icon** — Brain for ML/OOPS/System Design, Code for DSA/Web, Book for OS/DBMS/Networks
- Admin can add new concepts, edit existing ones, and delete from `/admin/concepts`
- All concept data is stored in localStorage and backed by Supabase

---

### 🏆 Certifications

The `/certifications` page lists top free and paid certification courses recommended for students.

**Providers included:**
Coursera, AWS, Google Cloud, Microsoft Azure, NPTEL, Udemy, freeCodeCamp, DeepLearning.AI, HubSpot

**Categories:**
Web Development, Data Science, AI/ML, Cloud Computing, CS Fundamentals, Cybersecurity, Marketing

**Each certification card shows:**
- Provider name with colour-coded badge (blue for Coursera, orange for AWS, green for Google Cloud, etc.)
- Course title
- Difficulty level badge: Beginner / Intermediate / Advanced
- **Free / Paid** badge — green "Free" or grey "Paid"
- **Visit Course** button — opens the official course page in a new browser tab

Notable courses included:
- Google Data Analytics Professional Certificate (Coursera, Free)
- Meta Front-End Developer (Coursera, Free)
- AWS Certified Cloud Practitioner
- AWS Solutions Architect Associate
- Google Associate Cloud Engineer
- Azure Fundamentals (AZ-900)
- NPTEL — Programming, Data Structures & Algorithms in Python (Free)
- NPTEL — Machine Learning by IIT Madras (Free)
- freeCodeCamp — Responsive Web Design (Free)
- DeepLearning.AI — Machine Learning Specialization (Free)
- Google Cybersecurity Professional Certificate (Free)

Admin can add, edit, and delete certifications from the page itself (inline, admin-only).

---

### 📊 Assessments

The `/assessments` page connects students to the CodeXam exam system for mock placement tests.

- Companies covered: TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, HCL, Tech Mahindra, Deloitte, IBM, Amazon, Microsoft, Google, Adobe, Goldman Sachs
- **Registration Form:**
  - Full Name
  - Email Address
  - College / University
  - Branch / Department
  - CGPA
- **Time Slot Selection** — Choose from available upcoming exam slots
- After registration, students receive a confirmation and are directed to the CodeXam portal to take the test
- **Perks shown on the page:**
  - Aptitude + Logic (Quantitative, Reasoning, Verbal — real placement test pattern)
  - Company-wise Mocks (TCS NQT, Infosys, Wipro pattern tests)
  - Detailed Score Report (section-wise + topic-level weak area analysis)
  - Curated Study Material (notes, formulas, previous-year questions)

---

### 💬 Messages to Admin — Within 1 Hour Reply

This is the **direct messaging feature** between users and the admin. It is accessible from the **navbar** (MessageCircle icon) and is available on every page when logged in.

**For Users — Sending a Message:**
1. Click the **Message icon** (speech bubble) in the top navigation bar
2. A dialog opens showing **"Messages to Admin"**
3. Click **"New Message"** button
4. Fill in:
   - **Subject** — Brief topic of your message
   - **Message** — Full message body
5. Click **"Send Message"**
6. The message is stored in Supabase (`contact_messages` table) with your user ID, timestamp, and content
7. You are taken back to the message list where you can see all your past messages

**Viewing Admin Replies:**
- Each message card in the list shows:
  - Your original subject and message text
  - The timestamp you sent it
  - An **"Admin Reply"** section (highlighted with a blue left border) if the admin has responded
  - The exact time the admin replied
- **The admin replies directly within the platform — no email needed**
- Replies are visible immediately in your message list

> **Reply time commitment: The admin replies within 1 hour during working hours directly on the website.**

---

### 🤖 AI Chat Assistant

An AI-powered chat assistant is available on every page of the portal.

- **Floating chat widget** in the bottom-right corner of every page
- Click the chat bubble icon to open/minimise the widget
- **Full-page chat** available at `/chat` (click Expand icon in the widget header)
- Powered by **Vercel AI SDK** with real-time streaming responses
- **Persistent chat history** — your conversation is saved to localStorage and restored on your next visit
- **Clear history** button (trash icon) to start fresh
- The assistant can help with:
  - Job search tips and career advice
  - Resume writing and formatting guidance
  - Interview preparation questions
  - Understanding job descriptions
  - How to use portal features
  - General coding and placement queries

---

### 📞 Contact Us — Reply Within 5 Hours

The `/contact` page is for general enquiries, feedback, and support.

- **Contact Form with fields:**
  - Name
  - Email Address
  - Phone Number (optional)
  - Message
- On submit, a pre-filled **mailto:** link opens your email client addressed to `jobportalfreeofficial@gmail.com`
- **Subject auto-filled** as "Contact from [Your Name]"
- **Response time: Within 5 hours** of receiving your email
- **Social Links** displayed:
  - YouTube channel link
  - Instagram link
- Office address and phone number displayed
- Scrolling Headline Ticker shown at the top of the contact page

---

### 🔔 Notifications

The **bell icon** in the navbar is your real-time notification centre.

- Click the bell to open a **popover** showing all your notifications
- **Unread count badge** shown on the bell icon (red dot with number)
- Each notification has:
  - **Icon** — different icon per notification type (Briefcase for jobs, FileText for applications, MessageCircle for messages, UserPlus for account events, Megaphone for announcements)
  - **Colour coding** — Blue for applications, Purple for messages, Green for user events, Orange for announcements
  - **Title** and optional message body
  - **Timestamp** (e.g., "2 hours ago")
- **Mark all as read** — clicking notifications marks them read
- Notification types you receive:
  - Job application status updates (Reviewed, Shortlisted, Selected, Rejected)
  - Admin replies to your messages
  - Admin broadcast announcements to all users
  - Job matches based on your skill preferences
- All notifications stored in Supabase `notifications` table with real-time sync

---

### 🔐 Authentication

Full auth flow powered by Supabase Auth.

| Page | Route | Description |
|------|-------|-------------|
| Register | `/register` | Email + Password sign-up with Full Name |
| Login | `/login` | Email + Password sign-in |
| Forgot Password | `/forgot-password` | Enter email to receive password reset link |
| Reset Password | `/reset-password` | Secure new password entry after clicking the reset link |

- Auth state persists across page refreshes via Supabase session tokens
- Protected routes automatically redirect unauthenticated users to `/login`
- After login, users are redirected back to the page they were trying to access
- Loading spinner shown site-wide while auth state is being checked (AuthGate component)

---

## 🛡 Admin Features

Access the admin panel at `/admin` after logging in with an admin account.

**Demo Admin Credentials:**
- Email: `admin@jobportal.com`
- Password: `Admin@123456`

---

### 📊 Admin Dashboard

The overview page at `/admin` gives the admin a complete snapshot of the portal.

- **Stats cards** — Total active jobs, Total applications received, Total registered users
- **Quick Action buttons** — Post Job (one click to jump to the post form), Manage Jobs
- **Broadcast Announcement panel:**
  - Title field + Message field
  - Click "Send Announcement" to push a notification to **every registered user simultaneously**
  - Used for: new assessment slots, important updates, platform news
- **Sidebar navigation** — All admin sections accessible from a persistent left sidebar (collapses to icons on mobile)
- **Permission-aware sidebar** — Sub-admins only see the sections their permissions allow

---

### ✏️ Post / Edit a Job

**Post Job** (`/admin/post-job`) and **Edit Job** (`/admin/edit-job/:id`) share the same feature-rich form.

| Field | Details |
|-------|---------|
| Job Title | Text field |
| Company | Company name |
| Description | **Full Markdown editor** with live preview — supports headings, bullet points, code blocks, bold/italic |
| Location | City, state, or "Remote" |
| Job Type | Full-time, Part-time, Internship, Remote, Contract |
| Experience Level | Fresher, Junior, Mid-level, Senior |
| Salary Range | e.g., "₹3–6 LPA" or "₹25,000/month" |
| Skills Required | Tag-style input — add skills one by one |
| Application Deadline | Date picker |
| Source URL | Link to original job posting (if aggregated) |
| Active / Inactive | Toggle to publish or unpublish without deleting |

- Edit Job pre-fills all fields from the existing job record
- Changes publish instantly to the live site on save

---

### 📋 Manage Jobs

`/admin/manage-jobs` — Control all jobs from one table.

- Paginated table of every job (active and inactive)
- **Active/Inactive toggle switch** per row — instantly toggles without a page reload
- **Application count** per job shown as a badge
- **Bulk select** — checkboxes on each row to select multiple jobs at once
- **Bulk delete** — delete all selected jobs with one confirmation dialog
- **Edit** button — goes to Edit Job form pre-filled for that job
- **Delete** button — permanently removes job with confirmation
- **View** button — opens the live job detail page in a new tab
- Search box to filter jobs by title in real time

---

### 📥 Bulk Import Jobs

`/admin/bulk-import` — Import dozens of jobs at once from a spreadsheet.

- Upload an **Excel (.xlsx)** file
- Supported column headers (case-insensitive):
  `title`, `company`, `description`, `location`, `job_type`, `experience_level`, `salary_range`, `skills_required`, `source_url`, `deadline`
- After file selection, all parsed rows are **previewed** in a table before import
- Click **"Import All"** to push every row to Supabase in a single batch operation
- Success/failure count shown after import
- Each failed row is reported individually with the error reason

---

### 🏢 Company Job Posting Requests

Companies and recruiters who want to post jobs on the portal can request access through the **Sub-Admin Request** flow.

**How it works:**

1. A company representative registers on the portal as a regular user
2. They navigate to the Sub-Admin Request section and fill in:
   - **Purpose** — Why they want to post jobs (e.g., "Hiring for our startup")
   - **Reason / Company description** — Details about the company and roles they plan to post
3. Their request is submitted and appears in the admin panel under **Manage Sub-Admins → Requests tab**
4. The admin reviews the request and can:
   - **Approve** — Grants the user sub-admin access with specific permissions (e.g., Post Jobs, Manage Jobs only)
   - **Reject** — Declines the request
5. Once approved, the company representative can log in and use the **Post Job** form to publish their openings
6. Admin can set **granular permissions** so companies can only post and manage their own jobs without accessing sensitive data like user lists or analytics

This makes the portal open to real companies while keeping full admin control over what each recruiter/company can do.

---

### 📬 Manage Applications

`/admin/applications` — Review and act on every job application.

- Full list of all applications across all jobs
- Each row shows: Applicant full name, Email, Job title, Company, Status, Date applied
- **Status Update dropdown** per application:
  - Applied → Reviewed → Shortlisted → Selected → Rejected
  - Status change is saved instantly to Supabase
  - Applicant's "My Applications" page reflects the new status immediately
- **View Cover Letter** — Expandable to read the applicant's cover letter inline
- **Resume Link** — Direct link to the applicant's uploaded resume
- **Application Notes** — Admin can add private internal notes per application (visible only to admins)

---

### 📌 Application Tracking Board

`/admin/tracking` — A Kanban-style pipeline board for managing all applications visually.

- **Five columns (stages):** Applied, Reviewed, Shortlisted, Selected, Rejected
- Each column has a distinct colour and shows all applications in that stage
- **Move application** between stages using the status update button on each card
- **Filter by Job** — dropdown to filter the board to show only applications for a specific job
- **Search** — search by applicant name or email across all columns
- Shows applicant name, email, job title, company, and application date on each card
- Stage counts shown in each column header

---

### 👥 Manage Users

`/admin/manage-users` — Full user management panel.

- Complete user list with columns: Name, Email, College, Phone, Location, Date joined
- **Search** — filter users by name or email in real time
- **Edit User** — modal dialog to update: Full Name, Email, College, Phone, Location
- **Delete User** — with a confirmation dialog to prevent accidental deletion
- **Message User** — sends an in-app notification directly to that user's notification bell
- **Export to Excel** — one click downloads every user's data as a `.xlsx` file (uses SheetJS)
  - Export includes: Name, Email, College, Phone, Location, Joined date

---

### 🛡 Manage Sub-Admins

`/admin/sub-admins` — Create and control sub-admin accounts.

**Two tabs:**

**Active Sub-Admins tab:**
- List of all current sub-admins with their name, email, and assigned permissions
- **Edit permissions** via modal with individual toggles for each permission:
  - ✅ Post Jobs
  - ✅ Manage Jobs
  - ✅ View Applications
  - ✅ Manage Users
  - ✅ View Analytics
  - ✅ Manage Content (headlines, banners, templates)
- **Revoke access** — removes sub-admin role from the user

**Requests tab:**
- Shows pending sub-admin access requests from users / companies
- Each request shows: Applicant name, Email, Purpose, Reason, Date submitted
- **Approve** button — grants sub-admin role with the permissions selected by admin
- **Reject** button — declines and removes the request
- Approved users immediately gain access to the admin panel with their specific permissions

---

### 📧 Admin Messages & Replies

`/admin/messages` — The admin side of the direct messaging system.

- Full list of all messages sent by users, sorted newest first
- Each message card shows:
  - **Unread indicator** — Mail icon (sealed) for unread, open mail icon for read
  - **"New" badge** in red for unread messages
  - Sender's full name and email
  - Message subject and full body text
  - Date and time sent
- **Unread count badge** at the top of the page
- **Mark as Read** button per message
- **Reply inline** — click "Reply" to open a text area directly on the card
  - Type your reply and click "Send Reply"
  - The reply is saved to the message record in Supabase
  - An **in-app notification** is automatically sent to the user saying "Admin replied to your message"
  - The user sees your reply immediately in their Messages dialog in the navbar
- **Edit Reply** — if already replied, admin can edit/update their reply
- **Reply time commitment: Within 1 hour on the website itself** — no emails needed, the reply appears directly in the user's message thread

---

### 📈 Analytics

`/admin/analytics` — Data visualisation dashboard.

| Chart | Type | Description |
|-------|------|-------------|
| Applications by Status | Pie chart | Breakdown of all applications by current status (Applied, Reviewed, Shortlisted, Selected, Rejected) |
| Applications Over Time | Line chart | Daily application count for the last 14 days |
| Top Jobs by Applications | Bar chart | Which job postings have received the most applications |
| User Registrations by Month | Bar chart | New user signups grouped by month |

- All charts built with **Recharts**, fully responsive on all screen sizes
- Data pulled directly from Supabase in real time
- Colour scheme follows the site's theme colours

---

### 📰 Manage Headlines

`/admin/headlines` — Control the scrolling ticker shown on the home page and contact page.

- Add new headline items with custom text
- Edit existing headlines
- Delete headlines
- Toggle each headline active/inactive
- Reorder headlines
- Changes take effect immediately across the site (no deploy needed)

---

### 📢 Manage Promo Banners

`/admin/promo-banners` — Promotional announcement strips.

- Create banners with: Message text, CTA button text, CTA button link (URL)
- Toggle banners active/inactive
- Only one banner is shown at a time on the live site (the most recently activated one)
- Delete old banners
- Used for announcements like: "🎉 New batch of TCS mock tests live! Register now"

---

### 📑 Manage Resume Templates

`/admin/templates` — Curate the resume template library.

- **Add template** — form with: Name, Category, Description, Preview URL (image), Download URL (file), Active toggle
- **Edit template** — update any field via modal
- **Toggle active/inactive** — deactivated templates are hidden from users
- **Delete template** — permanent removal
- Admin-added templates appear first in the user-facing library before static fallback templates

---

### 🎨 Theme Settings

`/admin/theme-settings` — Brand and visual identity customisation.

- **Primary colour** — Main brand colour (buttons, links, highlights)
- **Secondary colour** — Secondary accent colour
- **Accent colour** — Tertiary accent
- **Background colour** — Page background
- **Text colour** — Default text colour
- All colour pickers use hex input with a native colour picker
- **Logo Upload** — Upload a custom logo image (PNG/SVG recommended)
  - Logo appears in the navbar and site loader
  - Stored in Supabase Storage
- **Live preview** of colours before saving
- **Save** applies changes via CSS variables across the entire site instantly
- **Reset to Default** restores the original JobPortalFree colour scheme

---

### 🖥 Landing Page Settings

`/admin/landing-settings` — Edit the hero section of the home page.

- **Hero Heading** — Main headline (e.g., "Find Your Dream Job Today")
- **Hero Subheading** — Supporting text below the headline
- **CTA Button Text** — Text on the main call-to-action button
- **Stats Labels** — Customise what the three live stats counters are labelled
- **Reset to Defaults** — Restores original text
- Changes are saved to localStorage and take effect on the home page immediately

---

### 🧠 Manage Concepts

`/admin/concepts` — Manage the Important Concepts knowledge base.

- Add new concept entries with: Category, Title, Summary, Bullet points, Importance level (Must Know / Important / Good to Know), Interview relevance flag, Coding relevance flag
- Edit any existing concept
- Delete concepts
- Reset all concepts to the built-in defaults
- Changes are reflected immediately in the Interview Prep page and Home page Important Concepts section

---

## 🖥 Exam Portal — CodeXam

An integrated online examination system built inside the same app. Students access it via `/exam-login` and `/exam-register`. JobPortal admins and sub-admins are **automatically bridged** into the exam admin without a separate login.

### Student Side

| Feature | Details |
|---------|---------|
| **Student Dashboard** | Lists all available exams; shows completed and in-progress exams |
| **System Check** | Verifies camera, microphone, and browser compatibility before starting an exam |
| **Exam Instructions** | Full instructions screen before each test with rules and time limits |
| **MCQ Tests** | Multiple-choice questions with per-question timer, auto-save, and progress tracking |
| **Writing Tests** | Long-form written answer submissions with rich text area |
| **Fill in the Blank (FIB)** | Structured fill-in-the-blank question types |
| **Tab Switch Detection** | A warning dialog appears if the student switches browser tabs during an exam; repeated violations are logged |
| **Guided Walkthrough** | First-time guided tour for new students |
| **Feedback Form** | Submit feedback after completing an exam |
| **Reevaluation Request** | Request human re-evaluation of subjective answers |
| **Notification Banner** | Admin-sent messages displayed during active exam sessions |
| **Dark / Light Mode** | Full theme toggle available inside the exam portal too |

### Admin / Examiner Side

| Feature | Details |
|---------|---------|
| **Exam Admin Dashboard** | Overview: total exams, registrations, submissions |
| **Manage Tests** | Create, edit, activate/deactivate exam sessions with time limits |
| **Manage MCQ Questions** | Add questions with 4 options, mark correct answer, assign to exam |
| **Manage Writing Questions** | Add essay/writing prompts per exam |
| **Manage FIB Questions** | Add fill-in-the-blank question sets with answer keys |
| **Registrations** | Full list of all student registrations with date and exam selected |
| **Quick Registrations** | Fast bulk or walk-in student registration flow |
| **Manage Students** | View, search, and manage student accounts |
| **Student Reports** | Detailed per-student score breakdown: total score, section scores, topic-level performance |
| **Live Proctoring** | Real-time monitor of students currently taking exams (tab switches, time remaining) |
| **Analytics** | Exam performance trends: score distributions, pass/fail rates, average scores |
| **Leaderboard** | Ranked leaderboard per exam showing top scorers |
| **Reevaluations** | Review reevaluation requests and update scores manually |
| **Feedback** | Read all student feedback submitted after exams |
| **Notifications** | Send exam-level messages to all students in a specific exam |

---

## ☁️ Deploying to Cloudflare (from GitHub)

The site builds into a Cloudflare Worker. Every push to `main` is built and deployed by Cloudflare itself, with no GitHub secrets needed.

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** (Workers Builds) → pick this repo.
3. Build settings:

   | Setting | Value |
   |---------|-------|
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/` |

4. **Settings → Variables and Secrets**. Add these as **build variables** *and* as runtime variables (the `VITE_` ones are baked in at build time):

   | Name | Value | Type |
   |------|-------|------|
   | `VITE_SUPABASE_URL` | `https://<project>.supabase.co` | Variable (build + runtime) |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key | Variable (build + runtime) |
   | `VITE_SITE_URL` | your live site address, e.g. `https://jobportalfree.example.com` | Variable (build) |
   | `SUPABASE_URL` | same as `VITE_SUPABASE_URL` | Variable (runtime) |
   | `SUPABASE_PUBLISHABLE_KEY` | same as `VITE_SUPABASE_PUBLISHABLE_KEY` | Variable (runtime) |
   | `CRON_SECRET` | any long random string | **Secret** |
   | `BREVO_API_KEY` | Brevo → SMTP & API → API keys | **Secret** (needed for emails) |
   | `BREVO_SENDER_EMAIL` | the verified sender address in Brevo | Variable (or set in Portal Settings → Sender email) |
   | `GEMINI_API_KEY` | Google AI Studio key | **Secret** (only for AI chat and the admin assistant) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Secret**, optional |

5. Trigger a new deploy after changing variables.

Local preview of the Worker: `npm run cf:dev`. Manual deploy: `npm run deploy`.

**GitHub Actions in this repo**
- `ci.yml`: type-check, tests and build on every push and pull request.
- `mail-schedule.yml`: pings the scheduled-mail runner. Add the repository **variable** `SITE_URL` and the repository **secret** `CRON_SECRET` (the same value as in Cloudflare).

---

## 📬 Setup for Exam Emails (must read)

Emails are sent through Brevo. Add `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` in Cloudflare as described above, then redeploy.

**2. Automatic (scheduled) emails need a "clock" to ping the site.** The site checks the schedule whenever it is pinged:
- **GitHub Actions (included):** `.github/workflows/mail-schedule.yml` pings every 5 min. In GitHub → Repo → Settings → Secrets and variables → Actions → **Variables** → add `SITE_URL` = `https://your-site.example.com`. Make sure Actions are enabled.
- **Or free cron-job.org:** create a job every 5–15 min calling `https://your-site.example.com/api/public/run-mail-schedule` (GET).
- Backup: it is also checked when the exam admin panel is open (every 2 min) and when anyone visits the site.

**3. How the emails work (main points)**
- Portal Settings → **Sender email**: the verified Brevo sender address (overrides `BREVO_SENDER_EMAIL`).
- Each student can have a **personal email** (add-student dialog, or the table in Portal Settings). Sign-up students use their sign-up email. Generated `@student.codexam.com` addresses cannot receive mail.
- **Filter** in "Send credentials": All / With personal email / Portal credentials only.
- **Templates**: Login credentials, Congratulations-shortlisted, Exam reminder, Invitation, or your own. Placeholders: `{{name}} {{email}} {{password}} {{loginUrl}} {{examTitle}} {{examStart}} {{examEnd}} {{examDuration}}` (exam values come from the selected test).
- **Automatic emails**: ON/OFF, time, every day / selected dates / date range, all or selected students, optional auto-assign test (default + per student).
- "Only students who haven't received it yet" skips students already mailed (including by **Run now**). Use **Reset "already sent" list** to send again.
- **Delivery report** shows how many were received / not received and who.

---

## 🗄️ Fresh Supabase Database Setup

Use this to run the whole app (JobPortalFree + CodeXam) on a brand-new Supabase project.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste each file below, and press **Run** (in this order):

   | Step | File | What it does |
   |------|------|--------------|
   | 1 | `database/fresh-supabase-setup.sql` | All tables, functions, triggers, row-level-security policies and the 3 storage buckets (`resumes`, `templates`, `exam-recordings`) |
   | 2 | `database/seed-data.sql` | Starter data: site settings, headlines, promo banners, interview-prep library, 18 coding questions, 143 MCQs, 10 fill-in-the-blanks, a writing prompt and 27 tests (20 starter tests are added as drafts) |
   | 3 *(optional)* | `database/sample-jobs.sql` | 8 made-up jobs from fictional companies for testing only. Remove them before going live: `DELETE FROM public.jobs WHERE source_url = 'sample-data';` |

   Every file is safe to run more than once and never overwrites data an admin has changed.
3. Copy `.env.example` to `.env` and fill in your project's URL and publishable key (**Project Settings → API**). Set the same variables in Cloudflare (see "Deploying to Cloudflare") and redeploy.
4. Register on the site with `jobportalfreeofficial@gmail.com`. That email is made **admin** automatically. To use a different admin email, change it in `handle_new_user()` in step 1 (and in step 6 of that file) before running it.
5. In **Authentication → URL Configuration**, add your site's URL so email links and redirects work.

---

## 🔑 Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
```

---

## 💻 Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Sathwik-145/JobPortalFree.git
cd JobPortalFree

# 2. Install dependencies (Node 22+)
npm install

# 3. Set up environment variables
cp .env.example .env
# Then edit .env and fill in your Supabase URL and publishable key

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
JobPortalFree/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # type-check, tests, build
│       └── mail-schedule.yml       # scheduled mail ping
├── src/
│   ├── components/
│   │   ├── Navbar.tsx              # Top navigation with theme toggle, notifications, messages
│   │   ├── ChatWidget.tsx          # AI floating chat assistant
│   │   ├── ContactAdmin.tsx        # "Message to Admin" dialog (navbar icon)
│   │   ├── NotificationBell.tsx    # Real-time notification bell
│   │   ├── JobCard.tsx             # Job listing card with save/unsave
│   │   ├── ApplicationTimeline.tsx # Visual application stage tracker
│   │   ├── ImportantConcepts.tsx   # Must-know concepts section
│   │   ├── HeadlineTicker.tsx      # Scrolling news banner
│   │   ├── PromoBanner.tsx         # Admin promo strip
│   │   ├── CompanyMarquee.tsx      # Infinite company logo scroll
│   │   ├── TestimonialsMarquee.tsx # User testimonial scroll
│   │   ├── ThemeToggle.tsx         # Dark/light mode button
│   │   ├── ThemeProvider.tsx       # Theme context + localStorage
│   │   ├── AutoSuggest.tsx         # Smart search suggestions
│   │   ├── UserDashboard.tsx       # User stats widget in profile
│   │   ├── MarkdownEditor.tsx      # Admin job description editor
│   │   ├── SocialShare.tsx         # Share job on social media
│   │   └── AuthGate.tsx            # Auth loading gate
│   ├── pages/
│   │   ├── Index.tsx               # Home page
│   │   ├── Jobs.tsx                # Job listings with filters
│   │   ├── JobDetail.tsx           # Single job + apply
│   │   ├── Profile.tsx             # User profile + resume upload
│   │   ├── MyApplications.tsx      # Application tracker
│   │   ├── SavedJobs.tsx           # Bookmarked jobs
│   │   ├── ResumeTemplates.tsx     # Resume template library
│   │   ├── InterviewPrep.tsx       # Interview Q&A + concepts
│   │   ├── Certifications.tsx      # Course certifications
│   │   ├── Assessments.tsx         # Assessment registration
│   │   ├── JobAlerts.tsx           # Job alert preferences
│   │   ├── Chat.tsx                # Full-page AI chat
│   │   ├── ContactUs.tsx           # Contact form
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx  # Overview + broadcast
│   │       ├── PostJob.tsx
│   │       ├── EditJob.tsx
│   │       ├── ManageJobs.tsx
│   │       ├── BulkImportJobs.tsx
│   │       ├── AdminApplications.tsx
│   │       ├── AdminTracking.tsx   # Kanban board
│   │       ├── ManageUsers.tsx
│   │       ├── ManageSubAdmins.tsx # Company job posting requests
│   │       ├── AdminMessages.tsx   # Reply to user messages
│   │       ├── AdminAnalytics.tsx
│   │       ├── ManageHeadlines.tsx
│   │       ├── ManagePromoBanners.tsx
│   │       ├── ManageTemplates.tsx
│   │       ├── ThemeSettings.tsx
│   │       ├── LandingSettings.tsx
│   │       ├── ManageConcepts.tsx
│   │       └── AdminAssessments.tsx
│   ├── exam/                       # CodeXam integrated exam portal
│   │   ├── pages/
│   │   │   ├── admin/              # 15 exam admin pages
│   │   │   └── student/            # Student exam experience
│   │   └── contexts/
│   ├── contexts/
│   │   └── AuthContext.tsx         # Global auth + admin/subadmin state
│   ├── integrations/
│   │   └── supabase/               # Supabase client, types, auth
│   └── lib/
│       ├── concepts.ts             # Important concepts data + localStorage
│       ├── assessments.ts          # Assessment registration logic
│       ├── staticResumeTemplates.ts
│       ├── siteSettings.ts         # Landing page settings (localStorage)
│       ├── themeSettings.ts        # Theme/brand settings (localStorage)
│       └── jobbot.server.ts        # AI chat server handler
├── public/
├── .env.example
├── .github/workflows/ci.yml
├── vite.config.ts
├── package.json
└── .npmrc
```

---

## 📬 Contact & Support

| Channel | Details |
|---------|---------|
| 📧 **General Email** | jobportalfreeofficial@gmail.com (reply within 5 hours) |
| 💬 **In-app Messages** | Message icon in navbar → admin replies within 1 hour on the website |
| 📦 **GitHub** | [github.com/Sathwik-145/JobPortalFree](https://github.com/Sathwik-145/JobPortalFree) |

---

## 📄 License

This project is open source and free to use for educational and personal purposes.

---

*Built with ❤️ for students and freshers across India. Powered by React, Supabase, Cloudflare, and GitHub Actions.*
