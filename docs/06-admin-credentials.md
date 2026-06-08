# 06 · Admin Credentials

## Where the password actually lives

The admin user is a normal MongoDB row in the `admins` collection. The password is
stored as a **bcrypt hash** — the plain-text password is never stored anywhere
except `/app/memory/test_credentials.md` (for the QA team).

## Current credentials

> Always check **`/app/memory/test_credentials.md`** for the live values. The
> credentials file is the source of truth.

As of the latest deploy:

- **Login URL**: `https://<host>/admin`
- **Default password (post reset)**: `mir-admin-2026`

## How auth works

1. `POST /api/admin/login` with `{ password }`.
2. Backend looks up the (single) admin row, bcrypt-compares the password.
3. On success returns `{ token }`. The token is a signed JWT-ish string with a
   2-hour expiry (`JWT_SECRET`).
4. The frontend stores it in `localStorage` under `mir.admin.token` and sends it
   as `Authorization: Bearer …` on every subsequent admin call.

## Resetting the password

Two paths are supported:

### A) Logged-in change (recommended)
1. Admin signs in → Dashboard → **Auth & Security** tab.
2. Enters current password + new password → confirm.
3. Backend rehashes and updates the row.

### B) Forgot password (magic link)
1. Admin clicks "Forgot password?" on `/admin`.
2. Enters their email → frontend calls `POST /api/admin/forgot-password`.
3. Backend writes a reset_token + 30-minute expiry to the admin row and sends an
   email via Gmail SMTP containing the link `https://<host>/admin/reset/<token>`.
4. The reset page (`AdminResetPassword.jsx`) validates the token (`POST /api/admin/validate-reset-token`)
   then posts the new password (`POST /api/admin/reset-password`).

## How to bootstrap on a brand-new environment

1. Set `ADMIN_INITIAL_PASSWORD` in `/app/backend/.env`.
2. Restart the backend. On first boot, if the `admins` collection is empty, the
   server creates the row with `email = COMPANY_EMAIL` and the bootstrap password.
3. Log in, change the password, never use the bootstrap password again.

## Forgot everything? Nuclear reset

```bash
# As a last resort, drop the admins collection and re-bootstrap.
mongo "$MONGO_URL/$DB_NAME" --eval 'db.admins.drop()'
sudo supervisorctl restart backend
# Now you can log in with $ADMIN_INITIAL_PASSWORD.
```

After the reset, update `/app/memory/test_credentials.md` so QA / agents know
the new password.
