"""Backend tests for MIR Consulting API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mir-consulting-next.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "mir-admin-2026"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


# ---------- Health ----------
def test_health(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


# ---------- Lead creation ----------
def test_create_lead_valid(session):
    payload = {
        "full_name": "TEST Jane Doe",
        "email": "test_jane@example.com",
        "company": "TEST Co",
        "phone": "+1 555 555 5555",
        "industry": "Technology",
        "service_interest": "IT Consulting",
        "message": "We need help re-architecting our platform for scale and reliability.",
    }
    r = session.post(f"{API}/leads", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["full_name"] == payload["full_name"]
    assert body["email"] == payload["email"]
    assert body["message"] == payload["message"]
    assert body["status"] == "new"
    assert isinstance(body["id"], str) and len(body["id"]) > 10
    assert "created_at" in body
    pytest.created_lead_id = body["id"]
    pytest.created_lead_email = body["email"]


def test_create_lead_invalid_email(session):
    payload = {
        "full_name": "Bad Email",
        "email": "not-an-email",
        "message": "This is a valid length message for testing.",
    }
    r = session.post(f"{API}/leads", json=payload)
    assert r.status_code == 422


def test_create_lead_short_message(session):
    payload = {
        "full_name": "Short Message",
        "email": "shortmsg@example.com",
        "message": "short",
    }
    r = session.post(f"{API}/leads", json=payload)
    assert r.status_code == 422


# ---------- Admin auth ----------
def test_admin_leads_no_auth(session):
    r = requests.get(f"{API}/admin/leads")
    assert r.status_code == 401


def test_admin_leads_wrong_token(session):
    r = requests.get(f"{API}/admin/leads", headers={"Authorization": "Bearer wrong-token"})
    assert r.status_code == 401


def test_admin_login_wrong_password(session):
    r = session.post(f"{API}/admin/login", json={"password": "wrong-password"})
    assert r.status_code == 401


def test_admin_login_correct_password(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert isinstance(data["token"], str) and len(data["token"]) > 10


# ---------- Admin protected endpoints ----------
def test_admin_leads_with_token(session, admin_token):
    r = requests.get(f"{API}/admin/leads", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    leads = r.json()
    assert isinstance(leads, list)
    # the lead we just created should be present
    ids = [l["id"] for l in leads]
    if hasattr(pytest, "created_lead_id"):
        assert pytest.created_lead_id in ids
    # most recent first
    if len(leads) >= 2:
        assert leads[0]["created_at"] >= leads[-1]["created_at"]
    # ensure no mongo _id leaks
    for l in leads:
        assert "_id" not in l


def test_admin_stats_with_token(session, admin_token):
    r = requests.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "total_leads" in data
    assert "new_leads" in data
    assert isinstance(data["total_leads"], int)
    assert isinstance(data["new_leads"], int)
    assert data["total_leads"] >= 1
