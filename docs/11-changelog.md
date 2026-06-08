# 11 · Changelog

Reverse-chronological. Update on every feature finish.

## 2026-06-08 — P2 + Backlog completion + Docs

**Added**
- 🤖 **AI translation for CMS articles** — `POST /api/admin/translate` (Gemini 2.5 Flash via Emergent Universal Key). Admin Insights / Case Studies editor now has a *Translate to DE / ES / EN* toolbar that translates title, excerpt/summary, category/sector, and markdown body. Translation preserves Markdown and URLs.
- 💳 **Stripe Checkout** — public invoice page now has a "Pay $X online" button. Backend creates the session, polls/webhook flips invoice to `paid` (idempotent). Audit trail in new `payment_transactions` collection.
- 🧾 **Public invoice page** at `/invoice/:token` — branded layout with line items, PDF download, and live status badge. Email "View online" links now point here.
- 🗓️ **shadcn DatePicker** replaced native date inputs in the invoice editor (`/app/frontend/src/components/ui/date-picker.jsx`).
- 🏷️ **Topic filter on /our-work** — second filter row above the grid lets visitors narrow by category.

**Fixed**
- Typo "*New case studie*" → "*New case study*" (proper singular handling).
- Duplicate `<meta name="description">` from `index.html` removed (was overriding Helmet).

**Docs**
- Created `/app/docs/` with full onboarding, env reference, data models, API reference, integration playbooks, deployment checklist.

## 2026-06-08 — Site-wide SEO + GitHub upload restored

- 🔍 `<Seo />` applied to every public page (Home with Organization JSON-LD, About, Services, Industries, Contact, Our Work + detail pages). Admin and 404 marked `noindex`.
- 📷 GitHub media upload working end-to-end after PAT got the right `Contents:Write` scope; repo `Mir-Consulting-Published` now public.

## 2026-06 — CMS expansion

- 🧑‍💼 Team Members CRUD + scrollable carousel on `/about`.
- 🎬 Videos (YouTube embeds) CRUD + dedicated detail view.
- 🧩 Unified `/our-work` hub (Insights + Case Studies + Videos in tabbed grid).
- 🪪 Custom Logo upload via Site Settings panel — replaces the original "M" mark.
- 📥 Leads CSV export.
- 🔄 Global axios 401 interceptor (auto-logs out the admin on expiry).

## 2026-06 — Admin auth overhaul

- 🔐 Migrated single-password env auth → DB-backed admin row with bcrypt + JWT-ish tokens.
- 🪄 Magic-link password reset over Gmail SMTP.
- 🗝️ Default post-reset password: `mir-admin-2026` (see `/app/memory/test_credentials.md`).

## Earlier (initial build)

- Public marketing pages, services, industries, contact form, lead pipeline.
- Invoice generation (PDF via reportlab, multi-currency).
- i18next EN/DE/ES.
- Initial Insights + Case Studies CMS.
