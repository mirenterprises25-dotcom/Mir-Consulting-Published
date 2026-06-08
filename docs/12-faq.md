# 12 · FAQ & Gotchas

### Q: I changed something in `.env`, but the backend isn't picking it up.
The backend hot-reloads `.py` files, but **not** env vars. After editing
`/app/backend/.env`, run:
```bash
sudo supervisorctl restart backend
```

### Q: My CSS / locale change isn't showing on the public site.
The CRA dev server caches aggressively. Hit hard refresh in the browser. If
still missing, `supervisorctl restart frontend` and wait 10s.

### Q: GitHub upload returns 403 / "Resource not accessible by personal access token".
Your PAT does not have **Contents: Read & Write** on the media repo. Regenerate at
<https://github.com/settings/personal-access-tokens> and re-paste into `GITHUB_TOKEN`.
See `07-integrations.md §2`.

### Q: Stripe Checkout returns 502.
Either `STRIPE_API_KEY` is missing/invalid, or `emergentintegrations` isn't installed.
Reinstall: `pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/`.

### Q: A lead came in but the admin never got the alert email.
Check `/api/admin/email-status`. If `configured: false`, the SMTP env vars are
wrong or the App Password is invalid. `tail -n 200 /var/log/supervisor/backend.err.log`
will show the exact SMTP error.

### Q: I forgot the admin password.
1. Click "Forgot password?" on `/admin` and use the magic-link flow, OR
2. As a nuclear option: drop the `admins` collection and let the backend re-bootstrap from `ADMIN_INITIAL_PASSWORD` (see `06-admin-credentials.md` last section).

### Q: The "Pay online" button is missing on an invoice.
The button is hidden when `status == "paid"` or `total <= 0`. Check the invoice
in the admin panel.

### Q: AI translate returns 502 "translation failed".
- Check the universal key balance in your Emergent profile.
- Look in backend logs for the exact LLM error message.
- The model is `gemini-2.5-flash`; if Google has a regional outage, switch the
  model name in `backend/translate_service.py` to a Claude or OpenAI fallback.

### Q: i18next switches language but a page is still showing English text.
That page is reading a static string (probably from `/app/frontend/src/lib/content.js`).
Move the string to the relevant locale JSON file.

### Q: Production URL ≠ preview URL — where do I change it?
- For the SPA: edit `REACT_APP_BACKEND_URL` and `REACT_APP_SITE_URL` in `/app/frontend/.env`.
- For email links in invoices: `PUBLIC_BASE_URL` in `/app/backend/.env`.
- Regenerate `/app/frontend/public/sitemap.xml` with the new domain.

### Q: How do I add a fourth language?
1. Add a folder under `/app/frontend/src/locales/<lang>/` with the same JSON
   files as the existing languages.
2. Register the language in `/app/frontend/src/i18n.js`.
3. Add the language code to the `langs` array in `/app/frontend/src/lib/Seo.jsx`.
4. Update the navbar language selector (in `Navigation.jsx`).
