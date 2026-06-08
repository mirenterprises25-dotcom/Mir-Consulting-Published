# 03 · Environment Variables

All secrets live in **two files**:
- `/app/backend/.env`
- `/app/frontend/.env`

> ⚠️ Never commit either to git. Never inline secrets in code. Always read via
> `os.environ.get("...")` on the backend and `process.env.REACT_APP_*` on the frontend.

## Backend — `/app/backend/.env`

| Key | What it does | Required | Example |
| --- | --- | --- | --- |
| `MONGO_URL` | Mongo connection string | ✅ | `mongodb://localhost:27017` |
| `DB_NAME` | Mongo database name | ✅ | `mir_consulting` |
| `ADMIN_INITIAL_PASSWORD` | Seed password used the FIRST time the admin user is created in DB | ✅ | `mir-admin-2026` |
| `JWT_SECRET` | Secret used to sign admin JWT-style tokens | ✅ | `(long random string)` |
| `PUBLIC_BASE_URL` | The fully-qualified URL the public uses (used inside invoice emails) | ✅ at deploy | `https://mirconsulting.com` |
| `COMPANY_EMAIL` | "From" + reply-to address shown on invoices/emails | ✅ | `hello@mirconsulting.com` |
| `SMTP_HOST` | Gmail SMTP host | ✅ | `smtp.gmail.com` |
| `SMTP_PORT` | Gmail SMTP port | ✅ | `587` |
| `SMTP_USER` | Gmail account used to send | ✅ | `mirconsulting26@gmail.com` |
| `SMTP_APP_PASSWORD` | Gmail App Password (NOT the account password) | ✅ | `xxxx xxxx xxxx xxxx` |
| `GITHUB_TOKEN` | Fine-grained PAT with `Contents: Read & Write` on the media repo | ✅ | `github_pat_…` |
| `GITHUB_REPO` | `owner/name` of the media repo | ✅ | `mirenterprises25-dotcom/Mir-Consulting-Published` |
| `GITHUB_BRANCH` | Default branch | ✅ | `main` |
| `STRIPE_API_KEY` | Stripe secret key (test or live) | ✅ for payments | `sk_test_emergent` |
| `EMERGENT_LLM_KEY` | Universal key for OpenAI/Anthropic/Gemini via emergentintegrations | ✅ for translation | `sk-emergent-…` |

### Notes
- After editing `.env`, restart backend: `sudo supervisorctl restart backend`.
- Do **not** add comments inside `.env` (the loader is strict).
- The `ADMIN_INITIAL_PASSWORD` is only used the very first time the admin user is bootstrapped. After that, the password in MongoDB is the source of truth.

## Frontend — `/app/frontend/.env`

| Key | What it does | Required |
| --- | --- | --- |
| `REACT_APP_BACKEND_URL` | Base URL the SPA uses to call the API (NEVER hardcode this anywhere) | ✅ |
| `REACT_APP_SITE_URL` | Canonical production URL used for SEO canonical/hreflang tags | ✅ at deploy |

> **Hot tip**: in production these will differ — `REACT_APP_BACKEND_URL` may be the same domain
> (with `/api` rewritten via reverse proxy) while `REACT_APP_SITE_URL` is the marketing canonical.

## How to obtain each credential

- **Gmail SMTP App Password**: enable 2FA on the Gmail account → Google Account → Security → App Passwords → create one for "Mail / Other → MIR backend". Paste into `SMTP_APP_PASSWORD`.
- **GitHub PAT**: <https://github.com/settings/personal-access-tokens/new>. Choose **Fine-grained** → only the media repo → permissions: `Contents: Read & Write`, `Metadata: Read`.
- **Stripe key**: pre-seeded in the Emergent pod as `sk_test_emergent`. For production replace with your own restricted key.
- **Emergent LLM key**: provided by Emergent in the universal key dashboard.
