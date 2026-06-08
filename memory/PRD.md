# MIR Consulting — PRD

## Original Problem Statement
Rebuild the entire MIR Consulting website from scratch — a premium, scalable, modern consulting website that reflects a professional business consulting and technology advisory company. MIR Consulting operates at the intersection of Business Consulting, Data Analytics & BI, IT Consulting, Software Architecture, Process Automation, Dashboard Development, Operational Optimization, and Digital Transformation. Must feel: premium, professional, modern, corporate, high trust, technology-driven, enterprise-scale.

## User Choices (verbatim)
- Stack: React + FastAPI + MongoDB.
- Contact handling: MongoDB + simple admin dashboard.
- CMS: Insights + Case Studies (markdown editor with live preview).
- Fallback: show static placeholder cards when CMS DB is empty.
- Logo: text-based "MIR Consulting" wordmark.
- Design: light theme with midnight navy + electric blue accents.
- Email: Gmail SMTP (no third-party API). App Password to be provided by owner.
- Invoices: per-invoice currency picker, format `INV-YYYY-####`, "your call" on field set → standard fields + logo/footer + download + email + public link, both standalone and "from a lead" entry points.
- Languages: English (default), German, Spanish.

## Architecture
- **Frontend**: React SPA + React Router. Tailwind + shadcn/ui + Framer Motion + Lucide. react-helmet-async (SEO). react-markdown + remark-gfm + @tailwindcss/typography. react-i18next + i18next-browser-languagedetector.
- **Backend**: FastAPI (`/app/backend/server.py`) — all routes prefixed `/api`. Motor (MongoDB). slowapi (rate-limit). python-slugify. ReportLab (PDF). smtplib (SMTP).
- **Auth**: static admin token from `/api/admin/login`; Bearer for `/api/admin/*`.

### DB Collections
- `leads` — full_name, email, company, phone, industry, service_interest, message, status (new|contacted|qualified|won|lost), notes, created_at, updated_at.
- `posts` — slug, title, excerpt, content, category, cover_image, read_time, status, timestamps, published_at.
- `case_studies` — slug, title, sector, summary, content, client_name, outcomes[], cover_image, status, timestamps, published_at.
- `videos` — slug, title, description, youtube_url, youtube_id, category, cover_image, status, timestamps, published_at.
- `team_members` — name, role, bio, photo, expertise[], linkedin, order, timestamps.
- `site_settings` (singleton, key=`site`) — logo_url, updated_at.
- `admin_settings` — admin password hash (bcrypt).
- `password_reset_tokens` — token_hash, expires_at (TTL index, single-use).
- `invoices` — number (auto INV-YYYY-####), public_token, client_*, currency, issue_date, due_date, line_items[], subtotal, tax_rate, tax_amount, total, notes, status (draft|sent|paid|overdue|void), sent_at, paid_at, lead_id, timestamps.

## Pages
- Public: `/` `/about` (now includes Team carousel) `/services` `/industries` `/our-work` (unified feed with tabs: All / Case Studies / Insights / Videos) `/our-work/video/:slug` (YouTube embed) `/insights` `/insights/:slug` `/case-studies` `/case-studies/:slug` `/contact` `*`.
- Admin (`/admin`) — login + "Forgot password" magic-link reset (`/admin/reset/:token`); tabs:
  - **Leads** — search, status filter, status dropdown per row, drawer (message, status, notes, "Create invoice for this lead"), delete confirm, **CSV export**.
  - **Insights** — list + markdown editor with live preview, draft/publish, delete.
  - **Case Studies** — same + sector, summary, client, outcomes lines.
  - **Invoices** — list + filter + multi-currency editor with live computed totals; download PDF, copy public link, email to client, edit, delete.
  - **Videos** — YouTube URL CRUD with live iframe preview, draft/publish.
  - **Team** — team-member CRUD (name, role, bio, photo, expertise tags, LinkedIn, display order).
  - **Site** — upload custom logo (replaces "M" placeholder in navbar).

## API
- `GET /api/health`, `GET /api/company`
- `POST /api/leads` (public, rate-limited 5/min) — fires async email to COMPANY_EMAIL when SMTP configured.
- `POST /api/admin/login` (rate-limited 5/min)
- Leads: `GET /api/admin/leads?status=&q=`, `GET/PATCH/DELETE /api/admin/leads/{id}`
- Posts: public `GET /api/posts`, `/api/posts/{slug}`; admin full CRUD on `/api/admin/posts`
- Case studies: public `GET /api/case-studies`, `/api/case-studies/{slug}`; admin full CRUD on `/api/admin/case-studies`
- Videos: public `GET /api/videos`, `/api/videos/{slug}`; admin full CRUD on `/api/admin/videos`.
- Team: public `GET /api/team`; admin full CRUD on `/api/admin/team`.
- Unified feed: `GET /api/works?type=insight|case_study|video` (merges all 3 with `type` + `href`).
- Site settings: public `GET /api/site-settings`; admin `PUT /api/admin/site-settings`.
- Media: admin `POST /api/admin/media/upload` (multipart, max 8 MB, folders=team|blog|videos|logos|uploads) → returns `{path,url}`; public `GET /api/media/{path}` streams via 1h in-memory cache. Backend = `/app/backend/github_storage.py` (GitHub Contents API).
- Leads CSV export: `GET /api/admin/leads-export.csv` (admin auth required, UTF-8 BOM, attachment header).
- Admin auth/reset: `POST /api/admin/login`, `POST /api/admin/forgot-password`, `GET /api/admin/reset-password/{token}`, `POST /api/admin/reset-password`.
- Stats: `GET /api/admin/stats` (leads, posts, case-studies, invoices breakdown)
- Email status: `GET /api/admin/email-status`
- **Invoices**:
  - `GET /api/admin/invoices?status=&q=`
  - `POST /api/admin/invoices`
  - `GET/PUT/DELETE /api/admin/invoices/{id}`
  - `GET /api/admin/invoices/{id}/pdf` (download)
  - `POST /api/admin/invoices/{id}/send` (Gmail SMTP)
  - `GET /api/invoices/public/{token}` (JSON, no auth)
  - `GET /api/invoices/public/{token}/pdf` (PDF, no auth)

## Email Integration (Gmail SMTP)
- File: `/app/backend/email_service.py`
- ENV vars in `/app/backend/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_APP_PASSWORD`, `COMPANY_EMAIL`.
- Status: **wired and tested with graceful fallback**. Currently disabled — owner must paste a 16-char Google App Password into `SMTP_APP_PASSWORD` to activate. Without it: new-lead emails are skipped silently and invoice-send returns 503 with a clear message.

## i18n
- Languages: `en` (default), `de`, `es`. Detection: localStorage → navigator. Storage key `mir_lang`.
- Switcher: globe icon in navbar (desktop + mobile).
- Static UI translated; CMS content stays in author's chosen language.

## SEO
- `Seo` component (react-helmet-async) on all major pages.
- `/app/frontend/public/robots.txt` + `/app/frontend/public/sitemap.xml`.

## Verified Functionality
- **Iteration 1** MVP — passed.
- **Iteration 2** CMS + leads + rate-limit + SEO — 27/27 backend, all frontend flows passed.
- **Iteration 3** Invoices + Gmail SMTP scaffolding + i18n EN/DE/ES — 46/46 backend tests, all frontend flows passed.
- **Iteration 4** Admin password reset (bcrypt + magic-link) — 13/13 backend cases, frontend forgot-password dialog + `/admin/reset/:token` page verified.
- **Iteration 5** Team CRUD + Videos (YouTube) + unified `/our-work` + Site Settings (logo) + GitHub-backed media upload + Lead CSV export + axios 401 interceptor — 20/20 backend cases, all frontend flows verified.

## Credentials & Secrets
- `/app/memory/test_credentials.md` — admin password `mir-admin-2026` (DB-stored bcrypt; `.env` `ADMIN_PASSWORD` is bootstrap-only).
- Backend `.env`: `ADMIN_PASSWORD`, `ADMIN_TOKEN`, `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `COMPANY_EMAIL`, `SMTP_*` (live), `PUBLIC_BASE_URL`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`.

## Changelog
- 2025-12 — MVP site (pages, contact form, basic admin).
- 2026-02 (a) — Full CMS for Insights + Case Studies, lead status workflow + drawer + delete, rate-limiting, SEO basics, markdown live preview, typography plugin, CaseStudyDetail page.
- 2026-02 (b) — Invoice module (multi-currency, ReportLab PDF, download + public token view + email send), Gmail SMTP integration for new-lead notifications, multi-language site (EN/DE/ES) with globe switcher, stats now include invoice counters.
- 2026-02 (c) — Admin DB auth migration (bcrypt) with "Forgot password" magic-link reset email via Gmail SMTP and `/admin/reset/:token` page.
- 2026-06 — Team Members section on About + admin CRUD; Videos (YouTube embed) module + admin CRUD; unified `/our-work` page merging Insights + Case Studies + Videos with category tabs; Site Settings panel + custom logo upload replacing navbar "M"; GitHub-backed media upload (private repo, proxied through `/api/media/{path}` with caching); Lead CSV export; global axios 401 interceptor.
- 2026-06 (b) — **GitHub media upload now LIVE end-to-end** (new PAT with Contents:Write on public repo `mirenterprises25-dotcom/Mir-Consulting-Published`). Site-wide SEO wired via `react-helmet-async`: `Seo` component now applied on Home (with Organization JSON-LD), About, Services, Industries, Contact, OurWork, InsightDetail, CaseStudyDetail, VideoDetail; admin pages (`/admin`, `/admin/reset/*`) and `NotFound` use `noIndex`. Static description/og meta tags removed from `index.html` to avoid duplicates. Canonical/hreflang point at production domain via `REACT_APP_SITE_URL`. Verified iteration_6 — 100% pass.
- 2026-06 (c) — **P2 + backlog completion**: (i) AI translation for CMS articles via Emergent Universal Key (`gemini-2.5-flash`), exposed as `POST /api/admin/translate` and as a 3-button toolbar inside the Insights + Case Studies editor (preserves markdown). (ii) Stripe Checkout on the new public invoice page `/invoice/:token` — `POST /api/invoices/public/{token}/checkout` + idempotent status poll + webhook; new `payment_transactions` audit collection. (iii) shadcn Calendar `DatePicker` replaces native date inputs in the invoice editor. (iv) Topic filter row on `/our-work`. (v) "New case studie" typo fixed (proper singular handling in `ContentList`). (vi) `/app/docs/` onboarding folder added (12 files: overview, folder map, env, data models, API reference, admin creds, integrations, workflows, dev, deploy, changelog, FAQ). Verified iteration_7 — 12/12 backend cases + 6/6 frontend flows pass.

## Backlog
- **P1** — Deploy + custom domain: update `PUBLIC_BASE_URL` + `REACT_APP_SITE_URL` to the live domain; regenerate `sitemap.xml` / `robots.txt`; register Stripe webhook.
- **P2** — Refactor: split `server.py` (~1407 lines) into `routers/` modules and `Admin.jsx` (~1840 lines) into separate panel files. Intentionally deferred — non-trivial and best done in its own focused session.
- **P3** — Optional: extend Posts/CaseStudies/Videos schema to link translations as siblings of the same logical article (today translations are saved as separate slugs).
- **P3** — Optional: ask Emergent to raise the per-call max_budget on `gemini-2.5-flash` (the translate endpoint can intermittently return 429 → friendly retry message already shipped).
