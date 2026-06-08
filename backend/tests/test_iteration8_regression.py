"""Iteration 8 regression — full backend smoke test after the modular refactor.

Covers:
- public endpoints (health, /, posts, case-studies, team, videos, works, site-settings)
- POST /api/leads (rate-limited, JSON body)
- POST /api/admin/login (rate-limited, JSON body, forward-ref fix)
- admin guarded GETs (/stats, /leads, /posts, /case-studies, /team, /videos, /invoices, /email-status)
- admin CRUD posts/case-studies/team/videos + slug uniqueness + YouTube id extraction
- invoice create -> public token fetch -> Stripe checkout -> PDF download
- POST /api/admin/translate (de) via LiteLLM
- media upload + fetch
- POST /api/admin/forgot-password JSON body parsing
- POST /api/admin/change-password endpoint shape (no actual password change)
"""
import io
import os
import uuid

import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load backend .env so we can read the static admin token directly
load_dotenv(Path("/app/backend/.env"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")  # from /app/frontend/.env via shell
ADMIN_PASSWORD = "mir-admin-2026"
COMPANY_EMAIL = os.environ.get("COMPANY_EMAIL", "mirconsulting26@gmail.com")


# ----------------------- fixtures -----------------------
@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ----------------------- PUBLIC -----------------------
class TestPublic:
    def test_health(self, s):
        r = s.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "healthy"
        assert "timestamp" in body

    def test_root(self, s):
        r = s.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("service") == "MIR Consulting API"

    @pytest.mark.parametrize("path", [
        "/api/posts",
        "/api/case-studies",
        "/api/team",
        "/api/videos",
        "/api/works",
        "/api/site-settings",
    ])
    def test_public_collections(self, s, path):
        r = s.get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text[:200]}"
        # site-settings returns object, others return lists
        if path == "/api/site-settings":
            assert isinstance(r.json(), dict)
        else:
            assert isinstance(r.json(), list)


class TestLeadCreate:
    """POST /api/leads — rate-limited @5/min and JSON body parsing (forward-ref fix)."""

    def test_create_lead_and_persisted(self, s, auth_headers):
        unique = uuid.uuid4().hex[:8]
        payload = {
            "full_name": f"TEST_Lead {unique}",
            "email": f"test-{unique}@example.com",
            "company": "TEST_Corp",
            "phone": "+1-555-0100",
            "industry": "Technology",
            "service_interest": "Strategy",
            "message": "This is an automated regression test lead — please ignore.",
        }
        r = s.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 201, f"{r.status_code} {r.text}"
        lead = r.json()
        assert lead["email"] == payload["email"]
        assert lead["full_name"] == payload["full_name"]
        assert lead["status"] == "new"
        assert "id" in lead
        lead_id = lead["id"]

        # Verify persistence via admin list
        r2 = requests.get(f"{BASE_URL}/api/admin/leads", headers=auth_headers, params={"q": unique})
        assert r2.status_code == 200
        found = [x for x in r2.json() if x["id"] == lead_id]
        assert len(found) == 1, "Lead not found after POST"

        # cleanup
        requests.delete(f"{BASE_URL}/api/admin/leads/{lead_id}", headers=auth_headers)


# ----------------------- ADMIN AUTH -----------------------
class TestAdminAuth:
    def test_login_returns_token(self, s):
        r = s.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200
        token = r.json()["token"]
        # static token from env
        assert token == os.environ.get("ADMIN_TOKEN")

    def test_login_invalid(self, s):
        r = s.post(f"{BASE_URL}/api/admin/login", json={"password": "wrong"})
        assert r.status_code == 401

    def test_email_status(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/email-status", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert "smtp_configured" in body
        assert body["from_email"] == COMPANY_EMAIL

    def test_forgot_password_json_parses(self, s):
        """Forward-ref bug fix verification — JSON body must parse under @limiter."""
        # Use a non-admin email so we don't actually queue an email (still 200/{sent:True})
        r = s.post(
            f"{BASE_URL}/api/admin/forgot-password",
            json={"email": "not-admin@example.com"},
        )
        # 200 (silent OK for non-admin email) — proves JSON body parsed correctly.
        # If forward-ref bug existed this would 422 / 500
        assert r.status_code == 200, f"forgot-password body parsing broken: {r.status_code} {r.text}"
        assert r.json() == {"sent": True}

    def test_change_password_wrong_current(self, auth_headers):
        """Just verify endpoint reachable + responds 401 on wrong current pw (no real change)."""
        r = requests.post(
            f"{BASE_URL}/api/admin/change-password",
            headers=auth_headers,
            json={"current_password": "definitely-not-the-password", "new_password": "x" * 12},
        )
        assert r.status_code == 401
        assert "incorrect" in r.text.lower()


# ----------------------- ADMIN GUARDED GETs -----------------------
class TestAdminGuardedReads:
    @pytest.mark.parametrize("path", [
        "/api/admin/stats",
        "/api/admin/leads",
        "/api/admin/posts",
        "/api/admin/case-studies",
        "/api/admin/team",
        "/api/admin/videos",
        "/api/admin/invoices",
        "/api/admin/email-status",
    ])
    def test_requires_auth(self, s, path):
        r = s.get(f"{BASE_URL}{path}")
        assert r.status_code == 401, f"{path} should require auth (got {r.status_code})"

    @pytest.mark.parametrize("path", [
        "/api/admin/stats",
        "/api/admin/leads",
        "/api/admin/posts",
        "/api/admin/case-studies",
        "/api/admin/team",
        "/api/admin/videos",
        "/api/admin/invoices",
        "/api/admin/email-status",
    ])
    def test_admin_get_ok(self, auth_headers, path):
        r = requests.get(f"{BASE_URL}{path}", headers=auth_headers)
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text[:200]}"

    def test_stats_shape(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers)
        assert r.status_code == 200
        s = r.json()
        for k in (
            "total_leads", "new_leads", "leads_by_status",
            "posts_total", "posts_published",
            "case_studies_total", "case_studies_published",
            "invoices_total", "invoices_outstanding", "invoices_paid",
        ):
            assert k in s, f"missing stats key {k}"
        assert isinstance(s["leads_by_status"], dict)


# ----------------------- POSTS CRUD + slug uniqueness -----------------------
class TestPostsCRUD:
    def test_post_crud_with_slug_uniqueness_and_publish(self, auth_headers):
        title = f"TEST_Post {uuid.uuid4().hex[:6]}"
        payload = {
            "title": title,
            "excerpt": "regression excerpt for testing purposes",
            "content": "## Heading\n\nbody content here.",
            "category": "Strategy",
            "status": "draft",
        }
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=auth_headers, json=payload)
        assert r.status_code in (200, 201), r.text
        p1 = r.json()
        assert p1["title"] == title
        assert p1["status"] == "draft"
        assert "slug" in p1 and p1["slug"]

        # Create a SECOND post with the same title — slug must auto-differ
        r2 = requests.post(f"{BASE_URL}/api/admin/posts", headers=auth_headers, json=payload)
        assert r2.status_code in (200, 201), r2.text
        p2 = r2.json()
        assert p2["slug"] != p1["slug"], "Slug uniqueness not enforced"

        # Update -> publish
        upd = {**payload, "status": "published"}
        r3 = requests.put(f"{BASE_URL}/api/admin/posts/{p1['id']}", headers=auth_headers, json=upd)
        assert r3.status_code == 200, r3.text
        assert r3.json()["status"] == "published"
        assert r3.json().get("published_at") is not None

        # Now visible publicly
        r4 = requests.get(f"{BASE_URL}/api/posts/{r3.json()['slug']}")
        assert r4.status_code == 200

        # cleanup
        for pid in (p1["id"], p2["id"]):
            requests.delete(f"{BASE_URL}/api/admin/posts/{pid}", headers=auth_headers)


class TestCaseStudiesCRUD:
    def test_crud(self, auth_headers):
        payload = {
            "title": f"TEST_CS {uuid.uuid4().hex[:6]}",
            "sector": "Tech",
            "summary": "regression summary",
            "content": "regression content body",
            "outcomes": ["faster", "cheaper"],
            "status": "draft",
        }
        r = requests.post(f"{BASE_URL}/api/admin/case-studies", headers=auth_headers, json=payload)
        assert r.status_code in (200, 201), r.text
        cs = r.json()
        assert cs["title"] == payload["title"]

        upd = {**payload, "status": "published"}
        r2 = requests.put(f"{BASE_URL}/api/admin/case-studies/{cs['id']}", headers=auth_headers, json=upd)
        assert r2.status_code == 200, r2.text
        assert r2.json()["status"] == "published"

        r3 = requests.delete(f"{BASE_URL}/api/admin/case-studies/{cs['id']}", headers=auth_headers)
        assert r3.status_code == 200


class TestTeamCRUD:
    def test_crud(self, auth_headers):
        payload = {
            "name": f"TEST_Member {uuid.uuid4().hex[:6]}",
            "role": "QA Bot",
            "bio": "Automated regression-test team member.",
            "expertise": ["Testing"],
            "order": 99,
        }
        r = requests.post(f"{BASE_URL}/api/admin/team", headers=auth_headers, json=payload)
        assert r.status_code in (200, 201), r.text
        m = r.json()
        assert m["name"] == payload["name"]

        upd = {**payload, "role": "Senior QA Bot"}
        r2 = requests.put(f"{BASE_URL}/api/admin/team/{m['id']}", headers=auth_headers, json=upd)
        assert r2.status_code == 200
        assert r2.json()["role"] == "Senior QA Bot"

        r3 = requests.delete(f"{BASE_URL}/api/admin/team/{m['id']}", headers=auth_headers)
        assert r3.status_code == 200


class TestVideosCRUD:
    def test_youtube_id_extraction(self, auth_headers):
        payload = {
            "title": f"TEST_Vid {uuid.uuid4().hex[:6]}",
            "description": "regression video for ID extraction",
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "status": "draft",
        }
        r = requests.post(f"{BASE_URL}/api/admin/videos", headers=auth_headers, json=payload)
        assert r.status_code in (200, 201), r.text
        v = r.json()
        assert v["youtube_id"] == "dQw4w9WgXcQ", f"YouTube id extraction broken: {v.get('youtube_id')}"

        # cleanup
        requests.delete(f"{BASE_URL}/api/admin/videos/{v['id']}", headers=auth_headers)


# ----------------------- INVOICES -----------------------
class TestInvoicesFullFlow:
    def test_create_public_pdf_checkout(self, auth_headers):
        payload = {
            "client_name": f"TEST_Stripe Client {uuid.uuid4().hex[:6]}",
            "client_email": "client@example.com",
            "currency": "USD",
            "issue_date": "2026-01-15",
            "due_date": "2026-02-15",
            "tax_rate": 10.0,
            "line_items": [
                {"description": "Consulting", "quantity": 1, "rate": 100.0},
            ],
            "status": "draft",
        }
        r = requests.post(f"{BASE_URL}/api/admin/invoices", headers=auth_headers, json=payload)
        assert r.status_code in (200, 201), r.text
        inv = r.json()
        assert inv["subtotal"] == 100.0
        assert inv["tax_amount"] == 10.0
        assert inv["total"] == 110.0
        assert inv.get("public_token"), "missing public_token"
        invoice_id = inv["id"]
        token = inv["public_token"]

        # Public token fetch
        r2 = requests.get(f"{BASE_URL}/api/invoices/public/{token}")
        assert r2.status_code == 200
        assert r2.json()["id"] == invoice_id

        # PDF
        r3 = requests.get(f"{BASE_URL}/api/admin/invoices/{invoice_id}/pdf", headers=auth_headers)
        assert r3.status_code == 200
        assert r3.headers.get("content-type", "").startswith("application/pdf")
        assert r3.content[:4] == b"%PDF", "PDF header missing"
        assert len(r3.content) > 1000

        # Stripe checkout
        r4 = requests.post(
            f"{BASE_URL}/api/invoices/public/{token}/checkout",
            json={"origin_url": BASE_URL},
        )
        # Stripe sk_test_emergent goes through emergent proxy; iter7 confirmed 200
        assert r4.status_code == 200, f"Stripe checkout failed: {r4.status_code} {r4.text}"
        body = r4.json()
        assert "url" in body and "stripe.com" in body["url"], f"bad checkout url: {body}"
        assert body.get("session_id", "").startswith("cs_"), f"bad session_id: {body.get('session_id')}"

        # cleanup
        requests.delete(f"{BASE_URL}/api/admin/invoices/{invoice_id}", headers=auth_headers)


# ----------------------- TRANSLATE -----------------------
class TestTranslate:
    def test_translate_de(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/translate",
            headers=auth_headers,
            json={"text": "Hello world", "target_lang": "de", "source_lang": "en"},
            timeout=45,
        )
        # Accept 200 (success) or 429 (budget) — iter7 noted intermittent 429.
        assert r.status_code in (200, 429), f"{r.status_code} {r.text}"
        if r.status_code == 200:
            out = r.json().get("translated", "")
            assert isinstance(out, str) and len(out) > 0
            assert r.json().get("target_lang") == "de"

    def test_translate_requires_auth(self, s):
        r = s.post(
            f"{BASE_URL}/api/admin/translate",
            json={"text": "Hello", "target_lang": "de"},
        )
        assert r.status_code == 401


# ----------------------- MEDIA UPLOAD -----------------------
class TestMedia:
    def test_upload_and_fetch(self, admin_token):
        # 1x1 transparent PNG
        png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00"
            b"\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": (f"iter8_{uuid.uuid4().hex[:6]}.png", io.BytesIO(png), "image/png")}
        data = {"folder": "uploads"}
        r = requests.post(
            f"{BASE_URL}/api/admin/media/upload",
            headers={"Authorization": f"Bearer {admin_token}"},
            files=files,
            data=data,
            timeout=30,
        )
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        body = r.json()
        assert "path" in body and "url" in body
        assert body["path"].startswith("uploads/")
        assert body["url"].startswith("/api/media/")

        r2 = requests.get(f"{BASE_URL}{body['url']}", timeout=30)
        assert r2.status_code == 200, f"media fetch failed: {r2.status_code}"
        assert r2.content[:8] == b"\x89PNG\r\n\x1a\n", "Not a PNG body"

    def test_upload_requires_auth(self, s):
        r = s.post(f"{BASE_URL}/api/admin/media/upload")
        assert r.status_code == 401
