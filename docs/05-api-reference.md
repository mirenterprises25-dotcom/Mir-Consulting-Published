# 05 · API Reference

> Base URL: `${REACT_APP_BACKEND_URL}/api`
> All admin routes require `Authorization: Bearer <token>` from `POST /api/admin/login`.

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health check (returns `{message: "..."}`) |
| `POST` | `/leads` | Submit contact form (rate-limited) |
| `GET` | `/posts` | List published Insights |
| `GET` | `/posts/{slug}` | Single Insight |
| `GET` | `/case-studies` | List published Case Studies |
| `GET` | `/case-studies/{slug}` | Single Case Study |
| `GET` | `/team` | Public team list |
| `GET` | `/videos` | List published Videos |
| `GET` | `/videos/{slug}` | Single Video |
| `GET` | `/work` | Merged Insights + Case Studies + Videos (used by `/our-work` page) |
| `GET` | `/site-settings` | Get logo + public brand settings |
| `GET` | `/company` | Static company facts |
| `GET` | `/media/{path:path}` | Proxy a file from the GitHub media repo (cached) |

## Public — Invoice + Stripe

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/invoices/public/{token}` | Public invoice JSON |
| `GET` | `/invoices/public/{token}/pdf` | Streamed PDF (inline) |
| `POST` | `/invoices/public/{token}/checkout` | Create Stripe Checkout session. Body: `{ origin_url }` |
| `GET` | `/invoices/public/{token}/checkout/{session_id}` | Poll session status; flips invoice → paid on success |

Webhook (mounted outside `/api` router for raw body access):

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/webhook/stripe` | Stripe webhook — idempotent, flips invoice → paid on `checkout.session.completed` |

## Admin auth

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/admin/login` | `{ password }` → `{ token }` |
| `POST` | `/admin/forgot-password` | `{ email }` → sends a magic link via SMTP |
| `POST` | `/admin/validate-reset-token` | `{ token }` → `{ valid: true }` |
| `POST` | `/admin/reset-password` | `{ token, new_password }` |
| `POST` | `/admin/change-password` | Auth required. `{ current_password, new_password }` |

## Admin — CMS

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/stats` | Dashboard stat tiles |
| `GET` | `/admin/leads` | Lead inbox |
| `PATCH` | `/admin/leads/{id}` | Update lead status/notes |
| `DELETE` | `/admin/leads/{id}` | Remove a lead |
| `GET` | `/admin/leads-export.csv` | Download CSV |
| `GET/POST/PUT/DELETE` | `/admin/posts[/{id}]` | Insights CRUD |
| `GET/POST/PUT/DELETE` | `/admin/case-studies[/{id}]` | Case Studies CRUD |
| `GET/POST/PUT/DELETE` | `/admin/team[/{id}]` | Team CRUD |
| `GET/POST/PUT/DELETE` | `/admin/videos[/{id}]` | Videos CRUD |
| `PUT` | `/admin/site-settings` | Patch logo / global settings |

## Admin — Invoices

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/invoices` | List, with query filters |
| `POST` | `/admin/invoices` | Create |
| `GET` | `/admin/invoices/{id}` | Read |
| `PUT` | `/admin/invoices/{id}` | Update |
| `DELETE` | `/admin/invoices/{id}` | Delete |
| `GET` | `/admin/invoices/{id}/pdf` | Download PDF |
| `POST` | `/admin/invoices/{id}/send` | Email PDF to client + flip to `sent` |

## Admin — Media & AI

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/admin/media/upload` | Multipart upload → pushes to GitHub → returns `{ path, url }` |
| `POST` | `/admin/translate` | `{ text, target_lang, source_lang? }` → `{ translated, target_lang }` (Gemini) |
| `GET` | `/admin/email-status` | Reports whether SMTP is configured |
