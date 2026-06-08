# 02 · Folder Structure

Every file with a one-line "what it does" so you can navigate the repo without grep.

```
/app
├── README.md                  Quick onboarding pointer (this docs folder is the source of truth).
├── design_guidelines.json     Frozen design tokens (colours, type, spacing) used by Tailwind.
├── yarn.lock                  Frontend dependency lockfile.
│
├── backend/
│   ├── .env                   ALL secrets (Mongo, SMTP, GitHub PAT, Stripe key, Emergent LLM key).
│   ├── requirements.txt       Python deps frozen via `pip freeze`.
│   ├── server.py              FastAPI app — every API route, middleware, startup hooks.
│   ├── auth_admin.py          Admin bcrypt auth, JWT-ish tokens, magic-link reset.
│   ├── email_service.py       Gmail SMTP send helpers (lead alerts + invoice emails).
│   ├── invoice_pdf.py         reportlab-based PDF invoice renderer (currency-aware).
│   ├── github_storage.py      Upload / fetch media via the GitHub Contents API.
│   ├── stripe_service.py      Stripe Checkout session helpers (emergentintegrations).
│   ├── translate_service.py   LLM (Gemini) translator preserving Markdown.
│   └── tests/                 pytest cases hitting the live API (test_mir_api*.py).
│
├── frontend/
│   ├── .env                   REACT_APP_BACKEND_URL + REACT_APP_SITE_URL.
│   ├── package.json           Frontend deps (yarn).
│   ├── tailwind.config.js     Tailwind + custom design tokens.
│   ├── craco.config.js        CRA override (@/ alias).
│   ├── public/
│   │   ├── index.html         Static shell, GA snippet, fallback title.
│   │   ├── robots.txt         Allows everything except /admin*.
│   │   └── sitemap.xml        Static sitemap (regenerate on domain change).
│   └── src/
│       ├── App.js             Routes + HelmetProvider + Toaster.
│       ├── index.js           ReactDOM mount.
│       ├── index.css          Tailwind base + custom global classes.
│       ├── i18n.js            i18next setup (EN default; DE + ES bundles).
│       ├── locales/           JSON dictionaries — en/, de/, es/.
│       ├── components/
│       │   ├── layout/        Layout, Navigation, Footer.
│       │   ├── sections/      Reusable Hero, CTA, StatBlock, TeamSection, Section.
│       │   ├── admin/         MediaUpload widget shared by admin panels.
│       │   └── ui/            shadcn/ui primitives (button, dialog, input, calendar, popover, date-picker, ...).
│       ├── lib/
│       │   ├── api.js         axios instance + every API helper used by the SPA.
│       │   ├── Seo.jsx        <Seo /> component — head tags, hreflang, JSON-LD.
│       │   └── content.js     Fallback static content (used if API empty).
│       └── pages/
│           ├── Home.jsx
│           ├── About.jsx
│           ├── Services.jsx
│           ├── Industries.jsx
│           ├── Contact.jsx
│           ├── OurWork.jsx           Merged Insights + Case Studies + Videos hub.
│           ├── Insights.jsx          Legacy listing (still routed).
│           ├── InsightDetail.jsx
│           ├── CaseStudies.jsx       Legacy listing (still routed).
│           ├── CaseStudyDetail.jsx
│           ├── VideoDetail.jsx       Video conversation detail page.
│           ├── PublicInvoice.jsx     /invoice/:token — Stripe pay + PDF download.
│           ├── Admin.jsx             Master admin shell + tabs (Posts / Case Studies / Leads / Auth).
│           ├── AdminResetPassword.jsx  /admin/reset/:token magic-link page.
│           ├── NotFound.jsx          Public 404.
│           └── admin/
│               ├── InvoicesPanel.jsx       Admin tab: invoices CRUD, PDF, send.
│               ├── TeamPanel.jsx           Admin tab: team members CRUD.
│               ├── VideosPanel.jsx         Admin tab: videos CRUD.
│               └── SiteSettingsPanel.jsx   Admin tab: custom logo + brand.
│
├── docs/                       This documentation set.
│
├── memory/
│   ├── PRD.md                  Live product requirements + roadmap (must update on each finish).
│   └── test_credentials.md     Active admin password & integration env keys.
│
├── test_reports/               Automated QA outputs (iteration_N.json).
└── tests/                      Top-level test helpers (currently empty/test_result.md).
```

## Where to put new things

| You're adding… | Put it in |
| --- | --- |
| A public marketing page | `frontend/src/pages/MyPage.jsx` + register in `App.js` + add to `sitemap.xml`. |
| A new admin tab | New file in `frontend/src/pages/admin/MyPanel.jsx`, import in `Admin.jsx`. |
| A reusable section component | `frontend/src/components/sections/`. |
| A shadcn-style primitive | `frontend/src/components/ui/`. |
| A new API endpoint | Inside `backend/server.py` under the relevant section (or extract a new router for big modules). |
| A new integration | New `backend/<svc>_service.py` module + env keys in `backend/.env`. |
| Tests | `backend/tests/test_<feature>.py` for backend; pass `testing_agent_v3_fork` for full e2e. |
