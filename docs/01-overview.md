# 01 · Overview

## Product

**MIR Consulting** is a senior-led management & technology consulting firm. This codebase
powers their marketing website, lead funnel, content hub, and internal back-office
(invoices, CMS, team, video library, brand settings).

### Public site features
- Marketing pages: Home, About + Team carousel, Services, Industries, Contact form, Our Work hub.
- Unified **Our Work** hub: Insights, Case Studies, and Video conversations in one filtered grid.
- Multi-language **EN / DE / ES** via `i18next`.
- Site-wide SEO (title, description, canonical, hreflang, OG, Twitter, JSON-LD) via `react-helmet-async`.
- Public payable invoice page at `/invoice/:token` (Stripe Checkout).

### Admin portal (`/admin`)
- Lead inbox + CSV export
- CMS for Insights & Case Studies (markdown editor + live preview, AI translate)
- Team Members CRUD
- Videos (YouTube embeds) CRUD
- Site Settings (custom logo upload)
- Invoices: create, send via email (Gmail SMTP), download PDF, public payable link
- Password change + magic-link password reset

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          Visitor browser                            │
│           ┌────────────────────────────────────────────┐            │
│           │  React 19 SPA   (frontend/, port 3000)     │            │
│           │   - i18next  - react-helmet-async  - shadcn │            │
│           └──────────────────┬─────────────────────────┘            │
│                              │  axios → /api/*                       │
│           ┌──────────────────┴─────────────────────────┐            │
│           │  FastAPI backend  (backend/, port 8001)    │            │
│           │   - motor (Mongo)   - slowapi (rate-limit) │            │
│           │   - reportlab (PDF) - bcrypt + JWT-style    │            │
│           │   - emergentintegrations (Stripe + LLM)    │            │
│           └──┬────┬──────┬───────────┬─────────────────┘            │
│              │    │      │           │                              │
│         ┌────┘    │      │           └───────────┐                  │
│         ▼         ▼      ▼                       ▼                  │
│   ┌─────────┐ ┌────────┐ ┌────────────┐   ┌───────────────────┐    │
│   │ MongoDB │ │  Gmail │ │ GitHub API │   │ Stripe (test)     │    │
│   │ (local) │ │  SMTP  │ │  (media)   │   │ + Emergent LLM    │    │
│   └─────────┘ └────────┘ └────────────┘   └───────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

## Tech stack at a glance

| Layer | What we use |
| --- | --- |
| Frontend | React 19, React Router v7, Tailwind, **shadcn/ui**, framer-motion, i18next, react-helmet-async, lucide-react, sonner (toasts), react-markdown |
| State | Local React state + axios |
| Backend | FastAPI, motor (async Mongo), slowapi, pydantic v2, reportlab, httpx |
| Auth | DB-backed admin user with bcrypt password hash + magic-link reset over Gmail SMTP |
| DB | MongoDB (one DB, simple document collections — no relational joins) |
| Media | GitHub repo `mirenterprises25-dotcom/Mir-Consulting-Published` (public). Backend reads via httpx and serves through `/api/media/{path}` with caching headers. |
| Email | Gmail SMTP using app password (no 3rd-party API) |
| Payments | Stripe Checkout sessions via `emergentintegrations` |
| LLM | Emergent Universal Key → `gemini-2.5-flash` for content translation |

## Repository layout (top level)

See [02-folder-structure.md](./02-folder-structure.md) for the full tree. Quick map:

```
/app
├── backend/        # FastAPI app + integrations + tests
├── frontend/       # React SPA (CRA build)
├── docs/           # ← you are here
├── memory/         # Single source of truth: PRD.md + test_credentials.md
├── test_reports/   # Automated test runs (iteration_N.json)
└── tests/          # Top-level test helpers
```
