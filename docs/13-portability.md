# 13 · Portability & Self-hosting

This guide explains exactly what to change if you ever want to move MIR Consulting
off the Emergent platform onto your own hosting (AWS, Railway, Render, Fly.io,
DigitalOcean, a self-managed VPS — anywhere that runs Python + Node + MongoDB).

## TL;DR

**99% of the codebase is platform-agnostic.** Only two backend modules depend on
an Emergent-only package (`emergentintegrations`). Replace them with the official
provider SDKs and everything else just works.

## Everything that's already portable (no changes needed)

- FastAPI app and all 58 routes
- MongoDB schema + indexes
- React frontend, i18next, react-helmet-async, Tailwind, shadcn
- Gmail SMTP email delivery (`backend/email_service.py`)
- GitHub media storage proxy (`backend/github_storage.py`)
- PDF invoice generator (`backend/invoice_pdf.py`, uses `reportlab`)
- Stripe **webhook** endpoint (Stripe is a public service, our webhook is plain FastAPI)
- All admin auth, password reset, lead capture, CMS, invoicing logic

## The two Emergent-coupled files

### `backend/stripe_service.py` — uses `emergentintegrations.payments.stripe.checkout`

This is the only Stripe touch-point. To replace with the **official Stripe SDK**:

```bash
pip install stripe
```

Rewrite `stripe_service.py` (drop-in shape):

```python
import os, stripe

stripe.api_key = os.environ["STRIPE_API_KEY"]

async def create_invoice_session(*, invoice_number, amount, currency,
                                 success_url, cancel_url, metadata=None):
    session = stripe.checkout.Session.create(
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        line_items=[{
            "price_data": {
                "currency": (currency or "usd").lower(),
                "product_data": {"name": f"Invoice {invoice_number}"},
                "unit_amount": int(round(amount * 100)),
            },
            "quantity": 1,
        }],
        metadata={"source": "mir-consulting-invoice",
                  "invoice_number": invoice_number, **(metadata or {})},
    )
    # Mirror the previous return contract (url + session_id)
    class _Resp:
        def __init__(self, s): self.url = s.url; self.session_id = s.id
    return _Resp(session)

async def get_session_status(session_id):
    s = stripe.checkout.Session.retrieve(session_id)
    class _R:
        status = s.status
        payment_status = s.payment_status
        amount_total = s.amount_total
        currency = s.currency
        session_id = s.id
    return _R()
```

The webhook handler (in `server.py`) currently delegates signature
verification to the Emergent client. For the official SDK, swap that block with:

```python
event = stripe.Webhook.construct_event(
    payload=body,
    sig_header=sig,
    secret=os.environ["STRIPE_WEBHOOK_SECRET"],
)
if event["type"] in ("checkout.session.completed", "payment_intent.succeeded"):
    ...
```

You'll need a new env var `STRIPE_WEBHOOK_SECRET` (Stripe gives it to you when
you register the webhook in the dashboard).

### `backend/translate_service.py` — uses `emergentintegrations.llm.chat`

This module is **only** used by the admin "AI translate to DE/ES/EN" button.
If you don't need that feature in v1, you can:

1. Comment out the import + `/api/admin/translate` route in `server.py` (just 2 places).
2. The translate buttons in the admin UI will return 502 — visually they still
   render, but the feature is dormant. Or just remove the toolbar from
   `Admin.jsx` (search `admin-editor-translate-bar`).

Otherwise, pick ONE provider:

| Provider | Install | Env var | Quality / cost |
| --- | --- | --- | --- |
| **OpenAI** | `pip install openai` | `OPENAI_API_KEY` | Excellent, ~$0.50/1M tokens (gpt-4o-mini) |
| **Anthropic Claude** | `pip install anthropic` | `ANTHROPIC_API_KEY` | Excellent on Markdown |
| **Google Gemini** | `pip install google-genai` | `GEMINI_API_KEY` | What we use today |
| **LiteLLM** (recommended) | `pip install litellm` | per-provider keys | Keeps the "one wrapper, many providers" pattern; lets you swap providers via config. |

Example LiteLLM rewrite of `translate_service.py`:

```python
import os
from litellm import acompletion

async def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    sys_prompt = (
        f"Translate the user text into {target_lang}. Preserve all markdown, URLs, "
        f"brand names, and emails verbatim. Reply with ONLY the translation."
    )
    resp = await acompletion(
        model="gemini/gemini-2.5-flash",       # or "openai/gpt-4o-mini" etc.
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user",   "content": text},
        ],
        api_key=os.environ["GEMINI_API_KEY"],   # or whichever you set
    )
    return resp["choices"][0]["message"]["content"].strip()
```

That's the entire replacement — same function name, same return type, same call sites.

## Step-by-step migration recipe

1. **Spin up your destination**
   - One PaaS service for the FastAPI backend (Railway, Render, Fly.io, App Runner, etc.).
   - One static-site host for the React build (Vercel, Netlify, Cloudflare Pages, or your own Nginx).
   - One managed MongoDB (Atlas free tier covers this site easily).

2. **Migrate data**
   ```bash
   mongodump --uri "$MONGO_URL" --out /tmp/mir
   # then on the destination:
   mongorestore --uri "$NEW_MONGO_URL/$DB_NAME" /tmp/mir
   ```

3. **Rewrite the 2 Emergent files** (see above). Test locally:
   ```bash
   cd /app/backend && uvicorn server:app --reload
   ```

4. **Clean up `requirements.txt`**
   - The `emergentintegrations` line is already commented out — leave it that way.
   - Replace `litellm @ https://customer-assets.emergentagent.com/...` with `litellm>=1.80.0` (or remove if you go pure-OpenAI / pure-Anthropic).

5. **Cleanup env vars**
   ```
   REMOVE:  EMERGENT_LLM_KEY
   ADD:     OPENAI_API_KEY  (or ANTHROPIC_API_KEY / GEMINI_API_KEY)
   ADD:     STRIPE_WEBHOOK_SECRET   (from your Stripe dashboard)
   UPDATE:  STRIPE_API_KEY  → your own restricted live key
   UPDATE:  PUBLIC_BASE_URL → https://your-new-domain.com
   UPDATE:  REACT_APP_BACKEND_URL → https://your-new-domain.com  (or api.your-new-domain.com)
   UPDATE:  REACT_APP_SITE_URL → https://your-new-domain.com
   ```

6. **Build the frontend**
   ```bash
   cd /app/frontend && yarn build
   # deploy /app/frontend/build/ to Vercel/Netlify/Cloudflare Pages/etc.
   ```

7. **Re-register the Stripe webhook** at
   `https://your-new-domain.com/api/webhook/stripe` for the events
   `checkout.session.completed` and `payment_intent.succeeded`.

8. **DNS** → point the apex / `www` to your frontend host and (optionally) an
   `api` subdomain to your backend host. Or run everything behind one reverse
   proxy (Caddy, Nginx, Traefik) that rewrites `/api/*` → backend and everything
   else → static frontend. The codebase already assumes this routing.

9. **Smoke test** as per `10-deployment.md`.

## What about the `data-testid="home-emergent-link"`?

Search the frontend for `emergent` — there's a single test id name and a
"Made with Emergent" link on the home page footer. If you want to remove
Emergent branding entirely, edit `frontend/src/components/layout/Footer.jsx`
(or wherever the link is rendered) and update the related `data-testid`.

## "Should I keep emergentintegrations as a fallback?"

If you're staying on Emergent, **keep it** — it gives you a single key across
OpenAI / Claude / Gemini and is auto-topped-up.

If you're migrating off, **remove all three references**:
- `from emergentintegrations...` in `stripe_service.py`
- `from emergentintegrations...` in `translate_service.py`
- The commented line in `requirements.txt`

The two source files _are_ the only places it appears. Once both are rewritten,
the dependency is fully gone and the backend boots without it.
