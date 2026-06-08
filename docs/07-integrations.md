# 07 · Integrations

Four external services. All keys are in `/app/backend/.env`.

---

## 1) Gmail SMTP (transactional email)

**File**: `backend/email_service.py`
**Used by**: lead notifications + invoice "Send to client" + admin password reset.

### What it sends
| Trigger | Sent to | Contents |
| --- | --- | --- |
| New lead form submission | `COMPANY_EMAIL` | "New lead from …" with the lead body. |
| `POST /admin/invoices/{id}/send` | Lead's email | Branded HTML email + PDF attachment + "View online" link. |
| `POST /admin/forgot-password` | Admin email | Magic-link reset URL valid for 30 minutes. |

### Setup
1. Use the dedicated Gmail account (we use `mirconsulting26@gmail.com`).
2. Enable 2-Step Verification on the Google account.
3. Generate an **App Password** at <https://myaccount.google.com/apppasswords> → "Mail" → "Other (MIR backend)".
4. Set `SMTP_*` env vars (see [03-environment.md](./03-environment.md)).
5. Restart backend.

### Verify
```bash
curl -s $REACT_APP_BACKEND_URL/api/admin/email-status -H "Authorization: Bearer $TOK"
# → { "configured": true, "from": "..." }
```

### Common gotchas
- Using the regular Gmail password instead of an App Password → SMTP error 535.
- Gmail blocks the connection if 2FA isn't on.
- The `$` character in `.env` values gets shell-expanded. Quote them: `SMTP_APP_PASSWORD="abcd efgh ijkl mnop"`.

---

## 2) GitHub media storage

**File**: `backend/github_storage.py`
**Used by**: `POST /api/admin/media/upload` (logo, post covers, team photos, video thumbnails).

We host all uploaded media inside a dedicated GitHub repo
(**`mirenterprises25-dotcom/Mir-Consulting-Published`**, public). The backend:

1. Receives a multipart upload from the admin UI.
2. Slugifies the filename + adds a UUID suffix to avoid collisions.
3. PUTs the file to `https://api.github.com/repos/<repo>/contents/<folder>/<filename>` using a fine-grained PAT.
4. Stores the path; the frontend uses `/api/media/<folder>/<filename>` which the backend re-fetches and streams (with 24h cache).

### Required PAT permissions
- Repo access: **Only select repositories → Mir-Consulting-Published**
- Permissions: **Contents: Read & Write** (Metadata Read is auto-included).

If you see `403 Resource not accessible by personal access token` → the token is missing `Contents: Write`.

### Allowed folders
`team`, `blog`, `videos`, `logos`, `uploads`. Other paths are rejected (path-traversal protection).

---

## 3) Stripe Checkout (invoice payments)

**File**: `backend/stripe_service.py` (wraps the `emergentintegrations.payments.stripe.checkout` client).
**Used by**: public invoice page `PublicInvoice.jsx`.

### Flow
```
[Public invoice page]
   ▼ click "Pay $X online"
POST /api/invoices/public/{token}/checkout   → returns { url, session_id }
   ▼ redirect to Stripe Checkout
[Client pays on Stripe]
   ▼ success_url = /invoice/{token}?payment=success&session_id={CHECKOUT_SESSION_ID}
[Public invoice page polls]
GET /api/invoices/public/{token}/checkout/{session_id} → flips invoice → paid (idempotent)
```

The webhook (`POST /api/webhook/stripe`) is a safety net so payments are also
captured if the customer closes the browser before redirecting back. It is
idempotent — a payment row is only flipped to `paid` once.

### Configuration
- `STRIPE_API_KEY` (default in pod: `sk_test_emergent`).
- Front-end origin is auto-detected (`window.location.origin`) — no hardcoded URLs.
- Currencies supported: every ISO code Stripe supports. The invoice's own `currency` is passed through.

### Useful Stripe test cards
- `4242 4242 4242 4242` – any future expiry + any CVC → success.
- `4000 0000 0000 9995` → declined.
- More at <https://docs.stripe.com/testing>.

---

## 4) Emergent Universal LLM Key — Gemini translation

**File**: `backend/translate_service.py`
**Used by**: `POST /api/admin/translate` and the Translate buttons inside the admin
Insights / Case Studies editor.

- Model: `gemini-2.5-flash` (best cost / quality / Markdown preservation).
- The system prompt explicitly forbids preamble, commentary, summary; only the translation.
- Supports `en`, `de`, `es` in both directions (source can be `auto`).

### Behaviour in the admin UI
When the admin clicks **AI translate this article to → DE / ES / EN**:
1. Title, excerpt/summary, category/sector, and content (markdown) are translated.
2. The current form fields are **replaced** with the translated values.
3. The admin reviews, changes the slug, and saves it as a **new** article.

> Today translations are stored as completely separate articles. If you want
> linked translations (one Insight with three rows), see roadmap in
> `memory/PRD.md` — that's a future iteration.

### Budget warning
If you see `429` errors or "out of credits" → top up at
**Emergent dashboard → Profile → Universal Key → Add balance** (auto-top-up is recommended).
