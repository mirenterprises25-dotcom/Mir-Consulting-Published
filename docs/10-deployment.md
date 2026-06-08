# 10 · Deployment checklist

> Always update [11-changelog.md](./11-changelog.md) with a new entry when you deploy.

## Pre-flight

1. **Domain decided** (e.g. `mirconsulting.com`).
2. **DNS** points to your hosting provider (Emergent / Vercel / Railway / etc.). For Emergent, use the "Deploy" button — the platform handles the certs.
3. **Backend env**:
   - `PUBLIC_BASE_URL=https://mirconsulting.com`
   - `STRIPE_API_KEY` swapped from `sk_test_emergent` to your live restricted key.
   - `JWT_SECRET` regenerated (32+ bytes).
   - `ADMIN_INITIAL_PASSWORD` only needed on the very first deploy — remove or rotate after first login.
   - `SMTP_*` set for the production mailbox.
   - `GITHUB_TOKEN` rotated and limited to read+write on the media repo only.
   - `EMERGENT_LLM_KEY` set with a healthy balance.
4. **Frontend env**:
   - `REACT_APP_BACKEND_URL=https://mirconsulting.com` (or whichever your prod ingress is).
   - `REACT_APP_SITE_URL=https://mirconsulting.com` ← drives canonical/hreflang. **Always set this.**
5. **Sitemap / robots**:
   - Edit `/app/frontend/public/sitemap.xml` and replace any preview URLs with the production domain.
   - `robots.txt` already disallows `/admin*` — verify.
6. **Stripe webhook**: in the Stripe dashboard, register `https://mirconsulting.com/api/webhook/stripe` for events `checkout.session.completed` and `payment_intent.succeeded`. Copy the signing secret into the relevant env var (if your Stripe playbook uses one).

## Deploy

If using Emergent:
1. Click **Deploy** in the chat.
2. Verify by visiting the production URL.
3. Re-run the testing-agent against the production URL by passing the new `REACT_APP_BACKEND_URL` in your test description.

## Post-deploy smoke

```bash
PROD=https://mirconsulting.com
curl -s "$PROD/api/" | python3 -m json.tool                        # health
curl -s "$PROD/sitemap.xml" | head                                 # SEO
curl -s "$PROD/robots.txt" | head                                  # SEO
curl -s -X POST "$PROD/api/admin/login" -H "Content-Type: application/json" \
   -d '{"password":"<new prod password>"}' | python3 -m json.tool  # admin auth
```

Also:
- Submit a fake contact form → check the lead lands in the admin tab AND that you got the SMTP notification.
- Create a $1 test invoice, send it to your own email, click "Pay online" with a Stripe test card.
- Open `/admin/reset/<expired>` — should show "link is invalid or expired."

## Rollback

Use the Emergent **Rollback** feature — it restores both code and env safely.
Do NOT `git reset` manually inside the pod (it can desync the platform).
