"""Iteration 3: invoices + email-status + lead background notification regression."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "mir-admin-2026"


@pytest.fixture(scope="module")
def auth_headers():
    s = requests.Session()
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"}


# ============ email-status ============
def test_email_status_unconfigured(auth_headers):
    r = requests.get(f"{API}/admin/email-status", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["smtp_configured"] is False
    assert body["from_email"] == "mirconsulting26@gmail.com"


def test_email_status_requires_auth():
    r = requests.get(f"{API}/admin/email-status")
    assert r.status_code == 401


# ============ Invoice CRUD ============
def _payload(**over):
    base = {
        "client_name": "TEST Client",
        "client_email": "test_client@example.com",
        "client_company": "TEST Acme",
        "currency": "EUR",
        "issue_date": "2026-01-15",
        "due_date": "2026-02-15",
        "line_items": [
            {"description": "Strategy workshop", "quantity": 2, "rate": 500},
            {"description": "Implementation hours", "quantity": 10, "rate": 150},
        ],
        "tax_rate": 19,
        "notes": "Thank you.",
        "status": "draft",
    }
    base.update(over)
    return base


def test_invoice_create_and_compute_totals(auth_headers):
    r = requests.post(f"{API}/admin/invoices", json=_payload(), headers=auth_headers)
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["number"].startswith("INV-2026-")
    assert b["subtotal"] == 2500.0
    assert b["tax_amount"] == 475.0
    assert b["total"] == 2975.0
    assert b["currency"] == "EUR"
    assert b["status"] == "draft"
    assert len(b["public_token"]) > 10
    assert "_id" not in b
    pytest.inv_id_1 = b["id"]
    pytest.inv_token_1 = b["public_token"]
    pytest.inv_number_1 = b["number"]


def test_invoice_number_monotonic(auth_headers):
    nums = [pytest.inv_number_1]
    for cur in ("USD", "GBP"):
        r = requests.post(
            f"{API}/admin/invoices",
            json=_payload(currency=cur, client_email=f"c_{cur}@example.com"),
            headers=auth_headers,
        )
        assert r.status_code == 201
        nums.append(r.json()["number"])
        if cur == "USD":
            pytest.inv_id_usd = r.json()["id"]
        elif cur == "GBP":
            pytest.inv_id_gbp = r.json()["id"]
    suffixes = [int(n.split("-")[-1]) for n in nums]
    assert suffixes == sorted(suffixes)
    assert len(set(nums)) == 3


def test_invoice_get_by_id(auth_headers):
    r = requests.get(f"{API}/admin/invoices/{pytest.inv_id_1}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"] == pytest.inv_id_1


def test_invoice_get_404(auth_headers):
    r = requests.get(f"{API}/admin/invoices/nonexistent-xyz", headers=auth_headers)
    assert r.status_code == 404


def test_invoice_list_filters(auth_headers):
    r = requests.get(f"{API}/admin/invoices?status=draft", headers=auth_headers)
    assert r.status_code == 200
    assert all(i["status"] == "draft" for i in r.json())

    r2 = requests.get(f"{API}/admin/invoices?q=TEST", headers=auth_headers)
    assert r2.status_code == 200
    assert any(i["id"] == pytest.inv_id_1 for i in r2.json())


def test_invoice_update_recomputes_and_paid_at(auth_headers):
    payload = _payload(tax_rate=10, status="paid")
    r = requests.put(
        f"{API}/admin/invoices/{pytest.inv_id_1}", json=payload, headers=auth_headers
    )
    assert r.status_code == 200, r.text
    b = r.json()
    assert b["tax_rate"] == 10
    assert b["tax_amount"] == 250.0
    assert b["total"] == 2750.0
    assert b["status"] == "paid"
    assert b["paid_at"] is not None


def test_invoice_pdf_download(auth_headers):
    r = requests.get(
        f"{API}/admin/invoices/{pytest.inv_id_1}/pdf", headers=auth_headers
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/pdf")
    assert "attachment" in r.headers.get("content-disposition", "").lower()
    assert len(r.content) > 1024
    assert r.content[:4] == b"%PDF"


def test_invoice_pdf_all_currencies(auth_headers):
    for inv_id in (pytest.inv_id_usd, pytest.inv_id_gbp):
        r = requests.get(f"{API}/admin/invoices/{inv_id}/pdf", headers=auth_headers)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"
        assert len(r.content) > 1024


def test_invoice_send_unconfigured_smtp(auth_headers):
    r = requests.post(
        f"{API}/admin/invoices/{pytest.inv_id_usd}/send", headers=auth_headers
    )
    assert r.status_code == 503
    assert "SMTP_APP_PASSWORD" in r.json().get("detail", "")


def test_invoice_send_missing_email(auth_headers):
    # create one without client_email
    payload = _payload()
    payload.pop("client_email")
    r = requests.post(f"{API}/admin/invoices", json=payload, headers=auth_headers)
    assert r.status_code == 201
    inv_id = r.json()["id"]
    s = requests.post(f"{API}/admin/invoices/{inv_id}/send", headers=auth_headers)
    assert s.status_code == 400
    # cleanup
    requests.delete(f"{API}/admin/invoices/{inv_id}", headers=auth_headers)


# ============ public token routes ============
def test_public_invoice_json(auth_headers):
    r = requests.get(f"{API}/invoices/public/{pytest.inv_token_1}")
    assert r.status_code == 200
    assert r.json()["id"] == pytest.inv_id_1


def test_public_invoice_unknown_token():
    r = requests.get(f"{API}/invoices/public/bad-token-xyz")
    assert r.status_code == 404


def test_public_invoice_pdf_inline():
    r = requests.get(f"{API}/invoices/public/{pytest.inv_token_1}/pdf")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/pdf")
    assert "inline" in r.headers.get("content-disposition", "").lower()
    assert r.content[:4] == b"%PDF"


# ============ Auth checks ============
def test_invoices_routes_require_auth():
    for method, path in [
        ("get", "/admin/invoices"),
        ("post", "/admin/invoices"),
        ("get", f"/admin/invoices/{pytest.inv_id_1}"),
        ("put", f"/admin/invoices/{pytest.inv_id_1}"),
        ("delete", f"/admin/invoices/{pytest.inv_id_1}"),
        ("get", f"/admin/invoices/{pytest.inv_id_1}/pdf"),
        ("post", f"/admin/invoices/{pytest.inv_id_1}/send"),
    ]:
        r = requests.request(method, f"{API}{path}", json={})
        assert r.status_code == 401, f"{method} {path} returned {r.status_code}"


# ============ Stats include invoice counters ============
def test_admin_stats_invoice_counters(auth_headers):
    r = requests.get(f"{API}/admin/stats", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    for key in ("invoices_total", "invoices_outstanding", "invoices_paid"):
        assert key in d
        assert isinstance(d[key], int)
    assert d["invoices_total"] >= 3
    assert d["invoices_paid"] >= 1


# ============ Lead creation regression (SMTP unconfigured must not fail) ============
def test_create_lead_with_smtp_unconfigured():
    payload = {
        "full_name": "TEST Iter3 Lead",
        "email": "iter3_lead@example.com",
        "message": "Iteration 3 regression message for lead BG task email.",
    }
    r = requests.post(f"{API}/leads", json=payload)
    assert r.status_code == 201, r.text
    pytest.iter3_lead_id = r.json()["id"]


# ============ Cleanup ============
def test_zz_cleanup(auth_headers):
    for attr in ("inv_id_1", "inv_id_usd", "inv_id_gbp"):
        if hasattr(pytest, attr):
            requests.delete(f"{API}/admin/invoices/{getattr(pytest, attr)}", headers=auth_headers)
    if hasattr(pytest, "iter3_lead_id"):
        requests.delete(f"{API}/admin/leads/{pytest.iter3_lead_id}", headers=auth_headers)
