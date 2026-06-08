"""
Iteration 7 — backend acceptance tests:
 - Stripe Checkout creation + status polling on public invoice
 - LLM translation via /api/admin/translate (Gemini 2.5 Flash via Emergent Universal Key)
 - Regression: GitHub media upload still works
"""
import os
import io
import base64
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mir-consulting-next.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = "mir-admin-2026"

# Tiny 1x1 PNG (red)
_PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
)


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok, "no token from admin login"
    return tok


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ============ INVOICE CREATION + STRIPE CHECKOUT ============
@pytest.fixture(scope="module")
def created_invoice(auth_headers):
    payload = {
        "client_name": "TEST_Stripe Client",
        "client_email": "stripe-test@example.com",
        "currency": "USD",
        "tax_rate": 10.0,
        "issue_date": "2026-01-15",
        "due_date": "2026-02-15",
        "line_items": [
            {"description": "TEST_Service A", "quantity": 1, "rate": 100.0}
        ],
        "notes": "Iteration 7 acceptance test invoice"
    }
    r = requests.post(f"{BASE_URL}/api/admin/invoices", json=payload, headers=auth_headers, timeout=20)
    assert r.status_code == 201, f"create invoice failed: {r.status_code} {r.text}"
    inv = r.json()
    assert inv["public_token"], "missing public_token"
    assert abs(float(inv["total"]) - 110.0) < 0.01, f"total expected 110, got {inv['total']}"
    return inv


class TestPublicInvoice:
    def test_public_get_invoice_no_auth(self, created_invoice):
        token = created_invoice["public_token"]
        r = requests.get(f"{BASE_URL}/api/invoices/public/{token}", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["number"] == created_invoice["number"]
        assert abs(float(data["total"]) - 110.0) < 0.01
        assert isinstance(data.get("line_items"), list) and len(data["line_items"]) == 1

    def test_public_pdf_no_auth(self, created_invoice):
        token = created_invoice["public_token"]
        r = requests.get(f"{BASE_URL}/api/invoices/public/{token}/pdf", timeout=20)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert r.content[:4] == b"%PDF"


class TestStripeCheckout:
    def test_create_checkout_session(self, created_invoice):
        token = created_invoice["public_token"]
        payload = {"origin_url": BASE_URL}
        r = requests.post(
            f"{BASE_URL}/api/invoices/public/{token}/checkout",
            json=payload, timeout=30,
        )
        assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text}"
        data = r.json()
        assert "url" in data and data["url"].startswith("http"), f"bad url: {data}"
        assert "session_id" in data and data["session_id"]
        # Stripe checkout URLs contain 'stripe.com' or 'checkout.stripe.com'
        assert "stripe.com" in data["url"], f"expected Stripe url, got {data['url']}"
        # Store for next test
        TestStripeCheckout._session_id = data["session_id"]
        TestStripeCheckout._token = token

    def test_checkout_session_status(self):
        # depends on previous test
        token = getattr(TestStripeCheckout, "_token", None)
        sid = getattr(TestStripeCheckout, "_session_id", None)
        if not token or not sid:
            pytest.skip("session_id not set from previous test")
        r = requests.get(
            f"{BASE_URL}/api/invoices/public/{token}/checkout/{sid}",
            timeout=30,
        )
        assert r.status_code == 200, f"status failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["session_id"] == sid
        assert "status" in data
        assert "payment_status" in data
        # Customer never paid → status='open', payment_status='unpaid'
        assert data["payment_status"] in ("unpaid", "no_payment_required", "paid")

    def test_checkout_status_idempotent(self):
        token = getattr(TestStripeCheckout, "_token", None)
        sid = getattr(TestStripeCheckout, "_session_id", None)
        if not token or not sid:
            pytest.skip()
        # Call twice — must succeed both times
        for _ in range(2):
            r = requests.get(
                f"{BASE_URL}/api/invoices/public/{token}/checkout/{sid}",
                timeout=30,
            )
            assert r.status_code == 200

    def test_checkout_bad_token(self):
        r = requests.post(
            f"{BASE_URL}/api/invoices/public/does-not-exist/checkout",
            json={"origin_url": BASE_URL}, timeout=15,
        )
        assert r.status_code == 404


# ============ TRANSLATE ============
class TestAdminTranslate:
    def test_translate_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/translate",
            json={"text": "Hello", "target_lang": "de"},
            timeout=15,
        )
        # require_admin → 401 or 403
        assert r.status_code in (401, 403), f"expected auth error, got {r.status_code}"

    def test_translate_to_de(self, auth_headers):
        body = {
            "text": "## Hello\n\nThis is a test about consulting strategy.",
            "target_lang": "de",
        }
        r = requests.post(f"{BASE_URL}/api/admin/translate", json=body, headers=auth_headers, timeout=60)
        assert r.status_code == 200, f"translate de failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["translated"], "empty translation"
        assert data["target_lang"] == "de"
        # Markdown heading preserved
        assert "##" in data["translated"], f"markdown not preserved: {data['translated']!r}"

    def test_translate_to_es(self, auth_headers):
        body = {
            "text": "## Heading\n\n- bullet item one\n- bullet item two",
            "target_lang": "es",
        }
        r = requests.post(f"{BASE_URL}/api/admin/translate", json=body, headers=auth_headers, timeout=60)
        assert r.status_code == 200, f"translate es failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["translated"]
        assert data["target_lang"] == "es"
        assert "##" in data["translated"]
        # bullets preserved
        assert "- " in data["translated"] or "* " in data["translated"]

    def test_translate_to_en(self, auth_headers):
        body = {"text": "Hallo Welt", "target_lang": "en"}
        r = requests.post(f"{BASE_URL}/api/admin/translate", json=body, headers=auth_headers, timeout=60)
        assert r.status_code == 200, f"translate en failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["translated"]
        assert data["target_lang"] == "en"

    def test_translate_empty_text(self, auth_headers):
        body = {"text": "", "target_lang": "de"}
        r = requests.post(f"{BASE_URL}/api/admin/translate", json=body, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("translated") == ""


# ============ REGRESSION: GitHub media upload ============
class TestGithubMediaRegression:
    def test_upload_and_fetch_png(self, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        files = {"file": ("iter7_test.png", io.BytesIO(_PNG_BYTES), "image/png")}
        data = {"folder": "logos"}
        r = requests.post(
            f"{BASE_URL}/api/admin/media/upload",
            files=files, data=data, headers=headers, timeout=60,
        )
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("path", "").startswith("logos/")
        assert body.get("url", "").startswith("/api/media/")

        # Fetch the image back
        r2 = requests.get(f"{BASE_URL}{body['url']}", timeout=30)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        assert r2.content[:8] == b"\x89PNG\r\n\x1a\n", "PNG signature mismatch"
