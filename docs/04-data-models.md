# 04 · Data Models (MongoDB)

The DB name comes from `DB_NAME` in `backend/.env`. Mongo is used as a simple
document store — no joins, no transactions. All `id` fields are UUID v4 strings
(NOT ObjectId) so they're safe to return directly via JSON.

## Collections

### `admins`
The single admin user (DB-backed auth). Bootstrapped on first boot from
`ADMIN_INITIAL_PASSWORD`.

```json
{
  "id": "uuid",
  "email": "admin@mirconsulting.com",
  "password_hash": "$2b$12$...",          // bcrypt
  "reset_token": "...",                   // optional, set during magic-link reset
  "reset_token_expires_at": "iso8601",
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

### `leads`
Contact-form submissions.

```json
{
  "id": "uuid",
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "company": "ACME",
  "phone": "+34...",
  "subject": "Strategy review",
  "message": "...",
  "source": "contact-page",
  "status": "new" | "contacted" | "qualified" | "won" | "lost",
  "notes": "free text from admin",
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

### `posts` (Insights)
Markdown CMS articles.

```json
{
  "id": "uuid",
  "title": "Beyond dashboards",
  "slug": "beyond-dashboards",
  "excerpt": "...",
  "content": "## Markdown body...",
  "category": "Analytics",
  "cover_image": "/api/media/blog/foo.jpg",
  "read_time": "6 min",
  "status": "draft" | "published",
  "published_at": "iso8601",
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

### `case_studies`
Same shape as `posts` plus:

```json
{
  "sector": "Hospitality",
  "client_name": "ACME Hotels",
  "summary": "executive 1-liner",
  "outcomes": ["+32% revenue", "12 properties unified"]
}
```

### `videos`
YouTube embeds + descriptive metadata.

```json
{
  "id": "uuid",
  "title": "Why dashboards aren't decisions",
  "slug": "why-dashboards-arent-decisions",
  "youtube_id": "dQw4w9WgXcQ",
  "description": "...",
  "cover_image": "/api/media/videos/thumb.jpg",
  "category": "Conversation",
  "published_at": "iso8601",
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

### `team`
Team members shown on /about.

```json
{
  "id": "uuid",
  "name": "Iván Rodríguez",
  "role": "Managing Partner",
  "bio": "...",
  "image_url": "/api/media/team/ivan.jpg",
  "order": 1,
  "created_at": "iso8601"
}
```

### `invoices`
Full structured invoice + public payable token.

```json
{
  "id": "uuid",
  "number": "INV-2026-0001",
  "public_token": "url-safe 16-byte",        // → /invoice/{token}
  "client_name": "ACME",
  "client_email": "billing@acme.com",
  "client_company": "ACME Inc.",
  "client_address": "Street …",
  "currency": "USD" | "EUR" | "GBP" | …,
  "issue_date": "2026-06-08",
  "due_date":   "2026-06-22",
  "line_items": [
    { "description": "Strategy sprint", "quantity": 1, "rate": 5000, "amount": 5000 }
  ],
  "subtotal": 5000.00,
  "tax_rate": 10,
  "tax_amount": 500.00,
  "total": 5500.00,
  "notes": "…",
  "status": "draft" | "sent" | "paid" | "overdue" | "void",
  "lead_id": "uuid?",
  "sent_at": "iso8601?",
  "paid_at": "iso8601?",
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

### `payment_transactions`
Audit trail for every Stripe Checkout session — never delete rows here.

```json
{
  "id": "uuid",
  "session_id": "cs_test_…",
  "invoice_id": "uuid",
  "invoice_number": "INV-2026-0001",
  "public_token": "…",
  "amount": 5500.0,
  "currency": "USD",
  "payment_status": "initiated" | "paid" | "unpaid",
  "status": "open" | "complete" | "expired",
  "created_at": "iso8601",
  "updated_at": "iso8601"
}
```

### `settings`
A single document for global brand settings.

```json
{
  "id": "site",
  "logo_url": "/api/media/logos/logo.png",
  "updated_at": "iso8601"
}
```

## Indexes (auto-created on boot)

| Collection | Index | Why |
| --- | --- | --- |
| `admins` | `{ email: 1 }` unique | login lookup |
| `posts` | `{ slug: 1 }` unique | route lookup |
| `case_studies` | `{ slug: 1 }` unique | route lookup |
| `videos` | `{ slug: 1 }` unique | route lookup |
| `invoices` | `{ number: 1 }` unique, `{ public_token: 1 }` unique | listing + public link |
| `payment_transactions` | `{ session_id: 1 }` unique | idempotent webhook |
