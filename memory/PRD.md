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
- `invoices` — number (auto INV-YYYY-####), public_token, client_*, currency, issue_date, due_date, line_items[], subtotal, tax_rate, tax_amount, total, notes, status (draft|sent|paid|overdue|void), sent_at, paid_at, lead_id, timestamps.

## Pages
- Public: `/` `/about` `/services` `/industries` `/insights` `/insights/:slug` `/case-studies` `/case-studies/:slug` `/contact` `*`.
- Admin (`/admin`) — tabs:
  - **Leads** — search, status filter, status dropdown per row, drawer (message, status, notes, "Create invoice for this lead"), delete confirm.
  - **Insights** — list + markdown editor with live preview, draft/publish, delete.
  - **Case Studies** — same + sector, summary, client, outcomes lines.
  - **Invoices** — list + filter + multi-currency editor with live computed totals; download PDF, copy public link, email to client, edit, delete.

## API
- `GET /api/health`, `GET /api/company`
- `POST /api/leads` (public, rate-limited 5/min) — fires async email to COMPANY_EMAIL when SMTP configured.
- `POST /api/admin/login` (rate-limited 5/min)
- Leads: `GET /api/admin/leads?status=&q=`, `GET/PATCH/DELETE /api/admin/leads/{id}`
- Posts: public `GET /api/posts`, `/api/posts/{slug}`; admin full CRUD on `/api/admin/posts`
- Case studies: public `GET /api/case-studies`, `/api/case-studies/{slug}`; admin full CRUD on `/api/admin/case-studies`
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
- **Iteration 3** Invoices + Gmail SMTP scaffolding + i18n EN/DE/ES — **46/46 backend tests (19 new + 27 regression), all frontend flows passed**, zero bugs found (`/app/test_reports/iteration_3.json`).

## Credentials & Secrets
- `/app/memory/test_credentials.md` — admin password `mir-admin-2025`.
- Backend `.env`: `ADMIN_PASSWORD`, `ADMIN_TOKEN`, `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `COMPANY_EMAIL`, `SMTP_*` (App Password TODO), `PUBLIC_BASE_URL` (optional public-view base).

## Changelog
- 2025-12 — MVP site (pages, contact form, basic admin).
- 2026-02 (a) — Full CMS for Insights + Case Studies, lead status workflow + drawer + delete, rate-limiting, SEO basics, markdown live preview, typography plugin, CaseStudyDetail page.
- 2026-02 (b) — Invoice module (multi-currency, ReportLab PDF, download + public token view + email send), Gmail SMTP integration for new-lead notifications, multi-language site (EN/DE/ES) with globe switcher, stats now include invoice counters.

## Backlog
- **P0 (owner action)** — Generate a Google App Password and paste into `SMTP_APP_PASSWORD` to activate email notifications + invoice send.
- **P1** — Set `PUBLIC_BASE_URL` once a domain is decided so invoice emails include a live online-view link.
- **P2** — LLM-powered auto-translate for CMS articles (Insights / Case Studies) using Emergent Universal Key.
- **P2** — Lead CSV export.
- **P2** — Image upload (S3/Cloudinary) instead of URL paste.
- **P2** — Global axios 401 interceptor.
- **P3** — Invoice payment integrations (Stripe Checkout link on public invoice page).
- **P3** — Tag/category filtering on public Insights index.
