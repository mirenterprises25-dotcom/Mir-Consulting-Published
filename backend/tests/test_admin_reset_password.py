"""End-to-end tests for the admin password reset / forgot-password flow.

Covers:
  - /api/admin/login (success + 401)
  - /api/admin/forgot-password (success, non-admin email, rate-limit)
  - /api/admin/reset-password/{token} GET validation (good/bad token)
  - /api/admin/reset-password POST (good token consumes & rotates password;
    same token reused -> 400)
  - Regression on protected admin endpoints with static ADMIN_TOKEN
  - Regression on public POST /api/leads (still 201)

This test rotates the admin password to a temp value and ALWAYS restores
`mir-admin-2026` at teardown, so the credential in test_credentials.md stays valid.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
import uuid

import pytest
import requests

# Make backend importable for the create_reset_token helper.
sys.path.insert(0, "/app/backend")
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402

import auth_admin  # noqa: E402

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://mir-consulting-next.preview.emergentagent.com",
).rstrip("/")
ADMIN_EMAIL = "mirconsulting26@gmail.com"
ORIGINAL_PASSWORD = "mir-admin-2026"
STATIC_ADMIN_TOKEN = "mir-admin-static-token-d7f3a91b5e6c4a8f"

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"


# ----------------------------- helpers / fixtures -----------------------------
def _db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client, client[DB_NAME]


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module", autouse=True)
def restore_original_password():
    """After all tests run, force-restore the original admin password."""
    yield
    client, db = _db()
    try:
        asyncio.get_event_loop().run_until_complete(
            auth_admin.set_admin_password(db, ORIGINAL_PASSWORD)
        )
    finally:
        client.close()


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --------------------------------- LOGIN ---------------------------------
class TestAdminLogin:
    def test_login_with_current_password(self, s):
        r = s.post(f"{BASE_URL}/api/admin/login", json={"password": ORIGINAL_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("token") == STATIC_ADMIN_TOKEN

    def test_login_with_wrong_password(self, s):
        r = s.post(f"{BASE_URL}/api/admin/login", json={"password": "definitely-wrong-xyz"})
        assert r.status_code == 401
        assert "Invalid" in r.json().get("detail", "")


# ----------------------------- FORGOT PASSWORD -----------------------------
class TestForgotPassword:
    def test_forgot_password_with_admin_email(self, s):
        r = s.post(
            f"{BASE_URL}/api/admin/forgot-password",
            json={"email": ADMIN_EMAIL},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        # Generic success — must not expose token.
        assert body == {"sent": True}
        assert "token" not in str(body).lower() or body == {"sent": True}

    def test_forgot_password_with_unknown_email_still_200(self, s):
        # Use a unique email to avoid rate-limit contamination from previous runs.
        r = s.post(
            f"{BASE_URL}/api/admin/forgot-password",
            json={"email": f"unknown_{uuid.uuid4().hex[:6]}@example.com"},
        )
        # Always 200 — no enumeration.
        assert r.status_code == 200, r.text
        assert r.json() == {"sent": True}

    def test_forgot_password_rate_limited(self, s):
        # Limit is 3/15min. We've already used 2 requests above with non-admin emails,
        # plus 1 with admin email = 3. Next request from same IP should be 429.
        # Hammer a few more to be safe.
        statuses = []
        for _ in range(5):
            r = s.post(
                f"{BASE_URL}/api/admin/forgot-password",
                json={"email": f"rl_{uuid.uuid4().hex[:6]}@example.com"},
            )
            statuses.append(r.status_code)
            time.sleep(0.1)
        # Slowapi returns 429 when over the limit
        assert 429 in statuses, f"Expected at least one 429 in {statuses}"


# --------------------------- RESET TOKEN VALIDATION ---------------------------
class TestResetTokenLifecycle:
    def test_invalid_token_get_returns_400(self, s):
        r = s.get(f"{BASE_URL}/api/admin/reset-password/{'x' * 32}")
        assert r.status_code == 400
        assert "invalid" in r.json().get("detail", "").lower()

    def test_valid_token_get_validates_then_consume_then_reused_fails(self, s):
        # Programmatically create a fresh, valid token directly in DB.
        client, db = _db()
        try:
            token = _run(auth_admin.create_reset_token(db))
        finally:
            client.close()
        assert token and len(token) > 20

        # GET should validate.
        r = s.get(f"{BASE_URL}/api/admin/reset-password/{token}")
        assert r.status_code == 200, r.text
        assert r.json().get("valid") is True

        # POST consumes it and updates password.
        new_pw = f"TEMP-pw-{uuid.uuid4().hex[:8]}"
        r2 = s.post(
            f"{BASE_URL}/api/admin/reset-password",
            json={"token": token, "new_password": new_pw},
        )
        assert r2.status_code == 200, r2.text
        assert r2.json() == {"reset": True}

        # New password works.
        login_new = s.post(
            f"{BASE_URL}/api/admin/login", json={"password": new_pw}
        )
        assert login_new.status_code == 200
        assert login_new.json().get("token") == STATIC_ADMIN_TOKEN

        # Old password no longer works.
        login_old = s.post(
            f"{BASE_URL}/api/admin/login", json={"password": ORIGINAL_PASSWORD}
        )
        assert login_old.status_code == 401

        # Reusing the same token returns 400 (single-use).
        r3 = s.post(
            f"{BASE_URL}/api/admin/reset-password",
            json={"token": token, "new_password": "ANOTHER-pw-12345"},
        )
        assert r3.status_code == 400

        # GET on a used token also returns 400.
        r4 = s.get(f"{BASE_URL}/api/admin/reset-password/{token}")
        assert r4.status_code == 400

        # Restore original password for downstream tests / future agents.
        client, db = _db()
        try:
            _run(auth_admin.set_admin_password(db, ORIGINAL_PASSWORD))
        finally:
            client.close()

        # Confirm restore.
        login_restored = s.post(
            f"{BASE_URL}/api/admin/login", json={"password": ORIGINAL_PASSWORD}
        )
        assert login_restored.status_code == 200


# --------------------------- REGRESSION: protected APIs ---------------------------
class TestAdminProtectedRegression:
    H = {"Authorization": f"Bearer {STATIC_ADMIN_TOKEN}"}

    def test_admin_leads(self):
        r = requests.get(f"{BASE_URL}/api/admin/leads", headers=self.H)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_posts(self):
        r = requests.get(f"{BASE_URL}/api/admin/posts", headers=self.H)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_case_studies(self):
        r = requests.get(f"{BASE_URL}/api/admin/case-studies", headers=self.H)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_invoices(self):
        r = requests.get(f"{BASE_URL}/api/admin/invoices", headers=self.H)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_stats(self):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.H)
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body, dict)


# --------------------------- REGRESSION: public lead ---------------------------
class TestPublicLeadRegression:
    def test_create_lead(self):
        r = requests.post(
            f"{BASE_URL}/api/leads",
            json={
                "full_name": "TEST Reset Regression",
                "email": f"TEST_reset_{uuid.uuid4().hex[:6]}@example.com",
                "company": "TEST Co",
                "message": "regression check from reset-password test suite",
                "consent": True,
            },
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body.get("email", "").startswith("TEST_reset_")
        assert "id" in body
