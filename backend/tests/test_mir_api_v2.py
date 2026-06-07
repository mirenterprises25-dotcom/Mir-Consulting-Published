"""Backend tests for MIR Consulting API - iteration 2 (CMS, lead workflow, rate limits)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "mir-admin-2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ============================================================
# Health
# ============================================================
def test_health(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ============================================================
# Public lead submission
# ============================================================
def test_create_lead_valid(session):
    payload = {
        "full_name": "TEST Iteration Two",
        "email": "test_iter2@example.com",
        "company": "TEST Acme",
        "phone": "+1 555 222 3333",
        "industry": "Technology",
        "service_interest": "IT Consulting",
        "message": "Looking for help with platform modernization across 3 regions.",
    }
    r = session.post(f"{API}/leads", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "new"
    assert body["email"] == payload["email"]
    assert "id" in body and len(body["id"]) > 10
    assert "created_at" in body and "updated_at" in body
    pytest.created_lead_id = body["id"]


def test_create_lead_short_message(session):
    payload = {"full_name": "Bad", "email": "bad@example.com", "message": "short"}
    r = session.post(f"{API}/leads", json=payload)
    assert r.status_code == 422


def test_create_lead_missing_fields(session):
    r = session.post(f"{API}/leads", json={"email": "x@y.com"})
    assert r.status_code == 422


# ============================================================
# Admin auth
# ============================================================
def test_admin_login_wrong_password(session):
    r = session.post(f"{API}/admin/login", json={"password": "wrong-password"})
    assert r.status_code == 401


def test_admin_login_no_auth_leads(session):
    r = requests.get(f"{API}/admin/leads")
    assert r.status_code == 401


# ============================================================
# Admin leads list + filters
# ============================================================
def test_admin_leads_list(auth_headers):
    r = requests.get(f"{API}/admin/leads", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(l["id"] == pytest.created_lead_id for l in data)
    for l in data:
        assert "_id" not in l


def test_admin_leads_filter_status(auth_headers):
    r = requests.get(f"{API}/admin/leads?status=new", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert all(l["status"] == "new" for l in data)


def test_admin_leads_filter_q(auth_headers):
    r = requests.get(f"{API}/admin/leads?q=Iteration", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert any(l["id"] == pytest.created_lead_id for l in data)


# ============================================================
# Admin lead update (status workflow + notes)
# ============================================================
def test_admin_lead_update_status_and_notes(auth_headers):
    lid = pytest.created_lead_id
    r = requests.patch(
        f"{API}/admin/leads/{lid}",
        json={"status": "contacted", "notes": "Called on Tuesday"},
        headers=auth_headers,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "contacted"
    assert body["notes"] == "Called on Tuesday"
    assert body["updated_at"] >= body["created_at"]

    # change to qualified
    r2 = requests.patch(
        f"{API}/admin/leads/{lid}", json={"status": "qualified"}, headers=auth_headers
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "qualified"


# ============================================================
# Admin stats
# ============================================================
def test_admin_stats(auth_headers):
    r = requests.get(f"{API}/admin/stats", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    for key in [
        "total_leads", "new_leads", "leads_by_status",
        "posts_total", "posts_published",
        "case_studies_total", "case_studies_published",
    ]:
        assert key in d
    assert isinstance(d["leads_by_status"], dict)
    for s in ("new", "contacted", "qualified", "won", "lost"):
        assert s in d["leads_by_status"]


# ============================================================
# Admin POSTS CRUD
# ============================================================
def test_post_create(auth_headers):
    payload = {
        "title": "TEST Iter2 Post",
        "excerpt": "Excerpt longer than ten chars.",
        "content": "# Heading\n\nMarkdown body content here for testing.",
        "category": "Strategy",
        "read_time": "5 min",
        "status": "draft",
    }
    r = requests.post(f"{API}/admin/posts", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "draft"
    assert body["slug"] == "test-iter2-post"
    assert body["published_at"] is None
    pytest.post_id = body["id"]


def test_post_slug_uniqueness(auth_headers):
    payload = {
        "title": "TEST Iter2 Post",
        "excerpt": "Another excerpt long enough.",
        "content": "Body content here.",
        "category": "Strategy",
        "status": "draft",
    }
    r = requests.post(f"{API}/admin/posts", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    slug = r.json()["slug"]
    assert slug != "test-iter2-post"
    assert slug.startswith("test-iter2-post-")
    pytest.post_id_2 = r.json()["id"]


def test_post_publish_via_update(auth_headers):
    pid = pytest.post_id
    payload = {
        "title": "TEST Iter2 Post Updated",
        "excerpt": "Updated excerpt long enough text.",
        "content": "Updated **markdown** body.",
        "category": "Strategy",
        "status": "published",
    }
    r = requests.put(f"{API}/admin/posts/{pid}", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "published"
    assert body["published_at"] is not None


def test_public_posts_only_published(session):
    r = session.get(f"{API}/posts")
    assert r.status_code == 200
    data = r.json()
    assert all(p["status"] == "published" for p in data)
    # the draft post should NOT be there
    draft_id = pytest.post_id_2
    assert not any(p["id"] == draft_id for p in data)


def test_public_post_by_slug(session, auth_headers):
    # use the published one we just promoted
    pid = pytest.post_id
    g = requests.get(f"{API}/admin/posts/{pid}", headers=auth_headers)
    slug = g.json()["slug"]
    r = session.get(f"{API}/posts/{slug}")
    assert r.status_code == 200
    assert r.json()["status"] == "published"


def test_public_post_draft_404(session, auth_headers):
    pid = pytest.post_id_2
    g = requests.get(f"{API}/admin/posts/{pid}", headers=auth_headers)
    slug = g.json()["slug"]
    r = session.get(f"{API}/posts/{slug}")
    assert r.status_code == 404


def test_admin_posts_list_contains_drafts(auth_headers):
    r = requests.get(f"{API}/admin/posts", headers=auth_headers)
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()]
    assert pytest.post_id in ids
    assert pytest.post_id_2 in ids


def test_post_delete(auth_headers):
    for pid in (pytest.post_id, pytest.post_id_2):
        r = requests.delete(f"{API}/admin/posts/{pid}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["deleted"] is True
        r2 = requests.get(f"{API}/admin/posts/{pid}", headers=auth_headers)
        assert r2.status_code == 404


# ============================================================
# Admin CASE STUDIES CRUD
# ============================================================
def test_case_study_create_and_publish(auth_headers):
    payload = {
        "title": "TEST Iter2 Case Study",
        "sector": "Manufacturing",
        "summary": "A summary longer than ten chars.",
        "content": "## Overview\n\nFull case study body markdown.",
        "client_name": "TEST Client",
        "outcomes": ["Reduced cost 20%", "Improved throughput 35%"],
        "status": "published",
    }
    r = requests.post(f"{API}/admin/case-studies", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "published"
    assert body["published_at"] is not None
    assert body["outcomes"] == payload["outcomes"]
    pytest.cs_id = body["id"]
    pytest.cs_slug = body["slug"]


def test_public_case_studies_list(session):
    r = session.get(f"{API}/case-studies")
    assert r.status_code == 200
    data = r.json()
    assert any(c["id"] == pytest.cs_id for c in data)


def test_public_case_study_detail(session):
    r = session.get(f"{API}/case-studies/{pytest.cs_slug}")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "published"
    assert isinstance(body["outcomes"], list)


def test_case_study_update_and_delete(auth_headers):
    cs_id = pytest.cs_id
    payload = {
        "title": "TEST Iter2 Case Study v2",
        "sector": "Manufacturing",
        "summary": "Updated summary long enough.",
        "content": "Updated content body.",
        "outcomes": ["Outcome A"],
        "status": "draft",
    }
    r = requests.put(
        f"{API}/admin/case-studies/{cs_id}", json=payload, headers=auth_headers
    )
    assert r.status_code == 200
    assert r.json()["status"] == "draft"

    d = requests.delete(f"{API}/admin/case-studies/{cs_id}", headers=auth_headers)
    assert d.status_code == 200
    g = requests.get(f"{API}/admin/case-studies/{cs_id}", headers=auth_headers)
    assert g.status_code == 404


# ============================================================
# Lead delete (run after list/update tests)
# ============================================================
def test_lead_delete(auth_headers):
    lid = pytest.created_lead_id
    r = requests.delete(f"{API}/admin/leads/{lid}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["deleted"] is True
    r2 = requests.get(f"{API}/admin/leads/{lid}", headers=auth_headers)
    assert r2.status_code == 404


# ============================================================
# Rate limits (RUN LAST so previous tests don't get 429)
# ============================================================
def test_zz_rate_limit_leads(session):
    """Public /api/leads should yield 429 on the 6th hit/min from same IP."""
    payload = {
        "full_name": "TEST RL",
        "email": "rl_test@example.com",
        "message": "Rate limit test message that is plenty long.",
    }
    statuses = []
    for _ in range(7):
        r = session.post(f"{API}/leads", json=payload)
        statuses.append(r.status_code)
    assert 429 in statuses, f"Expected 429 in {statuses}"


def test_zz_rate_limit_admin_login(session):
    statuses = []
    for _ in range(7):
        r = session.post(f"{API}/admin/login", json={"password": "wrong-x"})
        statuses.append(r.status_code)
    assert 429 in statuses, f"Expected 429 in {statuses}"
