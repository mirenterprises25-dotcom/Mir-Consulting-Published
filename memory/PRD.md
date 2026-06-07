# MIR Consulting — PRD

## Original Problem Statement
Rebuild the entire MIR Consulting website from scratch — a premium, scalable, modern consulting website that reflects a professional business consulting and technology advisory company. MIR Consulting operates at the intersection of Business Consulting, Data Analytics & BI, IT Consulting, Software Architecture, Process Automation, Dashboard Development, Operational Optimization, and Digital Transformation. Must feel: premium, professional, modern, corporate, high trust, technology-driven, enterprise-scale.

## User Choices (verbatim)
- Stack: React + FastAPI + MongoDB (acknowledged Next.js not available)
- Contact handling: MongoDB + simple admin dashboard
- Insights: static placeholder articles
- Logo: text-based "MIR Consulting" wordmark
- **Design pivot**: Brighter / white background as main, with the remaining colors used accordingly (light theme dominant, midnight navy + electric blue accents)

## Architecture
- **Frontend**: React SPA with React Router (BrowserRouter). Tailwind CSS + shadcn/ui primitives. Framer Motion for animations. Lucide-react icons. Google Fonts (Outfit + Manrope).
- **Backend**: FastAPI (`/app/backend/server.py`) — all routes prefixed `/api`. MongoDB via Motor. Env-based admin auth (password + static Bearer token).
- **DB Collections**: `leads` (consultation requests with status, timestamps, contact details).

## Pages Implemented (Dec 2025)
- `/` Home — Hero with capabilities marquee, trust indicators, About preview with image card, Services preview (6 cards), Industries bento grid (6 sectors), Why MIR (4 reasons), dark Midnight CTA section.
- `/about` — story, mission/vision/philosophy/promise pillars, stat blocks.
- `/services` — 6 detailed service rows (problems / offerings / outcomes / industries).
- `/industries` — 6 sector deep-dives with challenges / solutions / use-cases + imagery.
- `/insights` — 4 placeholder articles (featured + 3 secondary, bento layout).
- `/case-studies` — 4 "Coming Soon" placeholder case study cards.
- `/contact` — Consultation form (name, email, company, phone, industry, service interest, message) with shadcn Select + sonner toast.
- `/admin` (standalone, no nav/footer) — Password login → dashboard with stat cards (Total / New) + leads table + logout.
- `*` — 404 page.

## Design System
- **Theme**: Light/white dominant (`hsl(0,0%,100%)` bg) with `mir-surface` (off-white) for alternating sections.
- **Accents**: Electric blue `hsl(216,100%,50%)` for highlights, `mir-midnight` `hsl(222,47%,9%)` for high-contrast panels (footer + CTA section).
- **Typography**: Outfit (display) + Manrope (body), geometric / premium enterprise feel.
- **Patterns**: Subtle grid backdrops, soft halo glow, grain texture, sharp-edged (no rounded corners) borders.

## Verified Functionality
- Full backend test suite at `/app/backend/tests/test_mir_api.py` — 10/10 pass.
- End-to-end Playwright test: all pages navigate, contact form submits and appears in admin dashboard, admin auth works (wrong + correct + logout).
- Test report: `/app/test_reports/iteration_1.json` → 100% backend / 100% frontend.

## Credentials & Secrets
- `/app/memory/test_credentials.md` — admin password `mir-admin-2025`.
- Backend `.env`: `ADMIN_PASSWORD`, `ADMIN_TOKEN`, `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`.

## Backlog / Next Items
- **P0** — None blocking; site is launch-ready.
- **P1** — Email notification on new lead (Resend/SendGrid) so leadership gets pinged without polling the admin dashboard.
- **P1** — Replace static Insights with a real CMS (admin can create/edit posts).
- **P1** — Real case studies once confidentiality reviews complete.
- **P2** — Lead status workflow (new → contacted → qualified → won/lost) + filters in admin.
- **P2** — Rate-limiting on `/api/leads` and `/api/admin/login` (brute-force protection).
- **P2** — Global axios 401 interceptor for auto-logout.
- **P2** — SEO: sitemap.xml + robots.txt + per-page meta titles via react-helmet.
- **P2** — Move logger init to top of `server.py` (cosmetic code review note).
- **P3** — Lead detail drawer in admin (full message + status change actions).
- **P3** — Public LinkedIn/contact integrations.
