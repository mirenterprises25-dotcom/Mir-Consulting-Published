"""Iteration 6 tests: verifies (1) GitHub-backed media upload now works
end-to-end with the new PAT that has Contents:Write on the new repo,
and (2) the public media proxy serves the uploaded PNG back."""

import io
import os
import struct
import zlib

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://mir-consulting-next.preview.emergentagent.com"
ADMIN_PASSWORD = "mir-admin-2026"


def _make_png(size: int = 1) -> bytes:
    """Build a minimal valid PNG (1x1 pixel red) without Pillow."""
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    raw = b"".join(b"\x00" + b"\xff\x00\x00" * size for _ in range(size))
    idat = zlib.compress(raw, 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    tok = r.json().get("token")
    assert tok
    return tok


class TestGitHubUpload:
    def test_upload_png_and_fetch_via_proxy(self, admin_token):
        png = _make_png()
        assert png[:8] == b"\x89PNG\r\n\x1a\n"
        files = {"file": ("test-logo.png", png, "image/png")}
        data = {"folder": "logos"}
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.post(
            f"{BASE_URL}/api/admin/media/upload",
            files=files,
            data=data,
            headers=headers,
            timeout=45,
        )
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text[:500]}"
        body = r.json()
        assert "path" in body and "url" in body
        assert body["path"].startswith("logos/")
        assert body["url"].startswith("/api/media/logos/")

        # Now fetch via proxy
        proxy_url = f"{BASE_URL}{body['url']}"
        # GitHub raw fetch may need a moment for the new commit
        import time as _t
        last = None
        for _ in range(5):
            g = requests.get(proxy_url, timeout=30)
            last = g
            if g.status_code == 200:
                break
            _t.sleep(2)
        assert last.status_code == 200, f"media fetch failed: {last.status_code} {last.text[:200]}"
        assert last.headers.get("content-type", "").startswith("image/png")
        assert len(last.content) >= len(png) - 10  # bytes preserved (allow tiny variation if any)
        assert last.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_upload_requires_auth(self):
        files = {"file": ("x.png", _make_png(), "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/admin/media/upload",
            files=files,
            data={"folder": "logos"},
            timeout=15,
        )
        assert r.status_code in (401, 403)

    def test_upload_rejects_bad_folder(self, admin_token):
        files = {"file": ("x.png", _make_png(), "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/admin/media/upload",
            files=files,
            data={"folder": "evil"},
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_media_path_traversal_blocked(self):
        r = requests.get(f"{BASE_URL}/api/media/../etc/passwd", timeout=10, allow_redirects=False)
        assert r.status_code in (400, 404)
