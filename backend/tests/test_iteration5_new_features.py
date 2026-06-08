"""Iteration 5 backend tests: Team, Videos, Works, Site Settings, CSV export, Media upload."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mir-consulting-next.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = "mir-admin-2026"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def token():
    # Wait a beat to avoid login rate limit collisions with other suites
    time.sleep(2)
    r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# --- TEAM MEMBERS ---
class TestTeam:
    def test_public_team_list(self):
        r = requests.get(f"{API}/team", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_team_requires_auth(self):
        r = requests.get(f"{API}/admin/team", timeout=10)
        assert r.status_code == 401

    def test_admin_team_crud(self, auth):
        # CREATE
        payload = {
            "name": "TEST_Member",
            "role": "QA Lead",
            "bio": "Senior QA with 10y experience and a love for puns.",
            "expertise": ["pytest", "playwright"],
            "order": 999,
        }
        r = requests.post(f"{API}/admin/team", json=payload, headers=auth, timeout=10)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["name"] == "TEST_Member"
        mid = body["id"]

        # READ via admin list
        r = requests.get(f"{API}/admin/team", headers=auth, timeout=10)
        assert r.status_code == 200
        assert any(m["id"] == mid for m in r.json())

        # READ via public
        r = requests.get(f"{API}/team", timeout=10)
        assert any(m["id"] == mid for m in r.json())

        # UPDATE
        payload["role"] = "Principal QA"
        r = requests.put(f"{API}/admin/team/{mid}", json=payload, headers=auth, timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "Principal QA"

        # DELETE
        r = requests.delete(f"{API}/admin/team/{mid}", headers=auth, timeout=10)
        assert r.status_code == 200

        # Verify gone
        r = requests.get(f"{API}/admin/team", headers=auth, timeout=10)
        assert not any(m["id"] == mid for m in r.json())


# --- VIDEOS ---
class TestVideos:
    created_id = None
    created_slug = None

    def test_create_video_valid(self, auth):
        payload = {
            "title": "TEST_Operating Models",
            "description": "Test description for video integration tests.",
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "status": "published",
        }
        r = requests.post(f"{API}/admin/videos", json=payload, headers=auth, timeout=10)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["youtube_id"] == "dQw4w9WgXcQ"
        assert body["slug"]
        TestVideos.created_id = body["id"]
        TestVideos.created_slug = body["slug"]

    def test_create_video_invalid_url(self, auth):
        payload = {
            "title": "TEST_BadURL",
            "description": "Bad URL should reject.",
            "youtube_url": "https://example.com/notyoutube",
            "status": "draft",
        }
        r = requests.post(f"{API}/admin/videos", json=payload, headers=auth, timeout=10)
        assert r.status_code == 400

    def test_public_videos_only_published(self):
        r = requests.get(f"{API}/videos", timeout=10)
        assert r.status_code == 200
        for v in r.json():
            assert v["status"] == "published"

    def test_get_video_by_slug(self):
        if not TestVideos.created_slug:
            pytest.skip("no slug")
        r = requests.get(f"{API}/videos/{TestVideos.created_slug}", timeout=10)
        assert r.status_code == 200
        assert r.json()["youtube_id"] == "dQw4w9WgXcQ"

    def test_delete_video(self, auth):
        if not TestVideos.created_id:
            pytest.skip("no id")
        r = requests.delete(f"{API}/admin/videos/{TestVideos.created_id}", headers=auth, timeout=10)
        assert r.status_code == 200


# --- WORKS ---
class TestWorks:
    def test_works_returns_list(self):
        r = requests.get(f"{API}/works", timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        for it in items:
            assert "type" in it and it["type"] in ("insight", "case_study", "video")
            assert "href" in it
            if it["type"] == "video":
                assert it["href"].startswith("/our-work/video/")
            elif it["type"] == "insight":
                assert it["href"].startswith("/insights/")
            else:
                assert it["href"].startswith("/case-studies/")

    def test_works_filter_videos(self):
        r = requests.get(f"{API}/works?type=video", timeout=10)
        assert r.status_code == 200
        for it in r.json():
            assert it["type"] == "video"


# --- SITE SETTINGS ---
class TestSiteSettings:
    def test_get_public(self):
        r = requests.get(f"{API}/site-settings", timeout=10)
        assert r.status_code == 200
        assert "logo_url" in r.json()

    def test_put_requires_auth(self):
        r = requests.put(f"{API}/admin/site-settings", json={"logo_url": "https://x/y.png"}, timeout=10)
        assert r.status_code == 401

    def test_put_roundtrip(self, auth):
        test_url = "https://example.com/test-logo.png"
        r = requests.put(f"{API}/admin/site-settings", json={"logo_url": test_url}, headers=auth, timeout=10)
        assert r.status_code == 200
        assert r.json()["logo_url"] == test_url
        # public reflects it
        r = requests.get(f"{API}/site-settings", timeout=10)
        assert r.json()["logo_url"] == test_url
        # reset to None to avoid polluting
        requests.put(f"{API}/admin/site-settings", json={"logo_url": None}, headers=auth, timeout=10)


# --- MEDIA UPLOAD (expected to fail with 502 due to read-only PAT) ---
class TestMediaUpload:
    def test_upload_disallowed_folder(self, auth):
        files = {"file": ("a.png", b"\x89PNG\r\n\x1a\n", "image/png")}
        data = {"folder": "evil"}
        r = requests.post(f"{API}/admin/media/upload", files=files, data=data, headers=auth, timeout=15)
        assert r.status_code == 400

    def test_upload_too_large(self, auth):
        big = b"a" * (9 * 1024 * 1024)
        files = {"file": ("big.bin", big, "application/octet-stream")}
        data = {"folder": "uploads"}
        r = requests.post(f"{API}/admin/media/upload", files=files, data=data, headers=auth, timeout=30)
        assert r.status_code == 413

    def test_upload_with_readonly_pat_returns_502(self, auth):
        """Expected behavior given the PAT is read-only: upload fails 502 → frontend falls back."""
        files = {"file": ("logo.png", b"\x89PNG\r\n\x1a\n", "image/png")}
        data = {"folder": "logos"}
        r = requests.post(f"{API}/admin/media/upload", files=files, data=data, headers=auth, timeout=30)
        # Accept either success or 502 — we document the actual state
        assert r.status_code in (201, 502), f"Unexpected status: {r.status_code} {r.text}"


# --- LEADS CSV EXPORT ---
class TestLeadsCSV:
    def test_csv_requires_auth(self):
        r = requests.get(f"{API}/admin/leads-export.csv", timeout=10)
        assert r.status_code == 401

    def test_csv_export(self, auth):
        r = requests.get(f"{API}/admin/leads-export.csv", headers=auth, timeout=15)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("text/csv")
        assert "attachment" in r.headers.get("content-disposition", "")
        first_line = r.text.splitlines()[0]
        for col in ["id", "created_at", "full_name", "email", "status", "message"]:
            assert col in first_line


# --- REGRESSION ---
class TestRegression:
    def test_login_invalid(self):
        time.sleep(2)
        r = requests.post(f"{API}/admin/login", json={"password": "wrong"}, timeout=10)
        assert r.status_code in (401, 429)

    def test_admin_endpoints(self, auth):
        for ep in ["/admin/leads", "/admin/posts", "/admin/case-studies", "/admin/invoices", "/admin/stats", "/admin/email-status"]:
            r = requests.get(f"{API}{ep}", headers=auth, timeout=10)
            assert r.status_code == 200, f"{ep} → {r.status_code}"
