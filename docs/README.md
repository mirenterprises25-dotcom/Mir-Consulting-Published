# MIR Consulting — Documentation Index

> Project source of truth. Read this first.

Welcome to the engineering documentation for **mirconsulting.com** (the premium consulting
website with a custom CMS, multi-language frontend, invoicing & payments, and an internal
admin portal).

This folder is laid out so a brand-new engineer can be productive in under 30 minutes.

## 📚 What's in here

| File | What it covers |
| --- | --- |
| **[01-overview.md](./01-overview.md)** | Product, stack, top-level architecture diagram, where things live. |
| **[02-folder-structure.md](./02-folder-structure.md)** | Every meaningful folder & file in `/app` with one-line purpose. |
| **[03-environment.md](./03-environment.md)** | Every env var, where to put it, what it does (no secrets — just keys). |
| **[04-data-models.md](./04-data-models.md)** | MongoDB collections, Pydantic schemas, sample docs. |
| **[05-api-reference.md](./05-api-reference.md)** | Every HTTP endpoint with method, auth, request and response shape. |
| **[06-admin-credentials.md](./06-admin-credentials.md)** | How admin auth works, default password, how to reset it. |
| **[07-integrations.md](./07-integrations.md)** | Gmail SMTP, GitHub media storage, Stripe Checkout, Emergent LLM (translation). |
| **[08-workflows.md](./08-workflows.md)** | End-to-end flows: lead capture, invoice → email → pay, content publishing, translation. |
| **[09-development.md](./09-development.md)** | Local dev, supervisor, hot-reload, tests, linting. |
| **[10-deployment.md](./10-deployment.md)** | Production deploy checklist, domain & SEO go-live. |
| **[11-changelog.md](./11-changelog.md)** | What's been built so far, chronologically. |
| **[12-faq.md](./12-faq.md)** | Common questions & gotchas. |
| **[13-portability.md](./13-portability.md)** | Moving off Emergent: drop-in replacements + step-by-step migration recipe. |

## 🚀 30-second orientation

- **Stack**: React 19 SPA + FastAPI + MongoDB (motor async driver).
- **Hosting in preview**: this Emergent pod (URL in `frontend/.env`).
- **Backend port** (internal): `8001` (supervised by `supervisor`).
- **Frontend port** (internal): `3000` (supervised by `supervisor`).
- **All backend routes** are prefixed with `/api`.
- **Admin login**: `https://<preview-or-prod>/admin` — password in `/app/memory/test_credentials.md`.

## 🧭 Where to start by goal

- *I want to add a new public page* → `02-folder-structure.md` (frontend/src/pages) + `09-development.md`.
- *I want to add a new admin feature* → `02-folder-structure.md` (Admin.jsx + admin sub-panels) + `05-api-reference.md`.
- *I need to debug an integration* → `07-integrations.md` + check `tail -n 200 /var/log/supervisor/backend.*.log`.
- *I want to deploy to production* → `10-deployment.md`.
- *I forgot the admin password* → `06-admin-credentials.md`.
