"""GitHub Contents API storage backend.

Used as a private CDN-like storage for uploaded media (team photos,
cover images, logos, etc.). The repo is private — we never share GitHub
URLs directly; instead the backend proxies file reads with in-memory
caching and serves them under /api/media/{path}.
"""
from __future__ import annotations

import base64
import logging
import mimetypes
import os
import re
import time
import uuid
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
DEFAULT_BRANCH = "main"
CACHE_TTL_SECONDS = 60 * 60  # 1 hour read cache
MAX_CACHE_ENTRIES = 200

# Slugify-ish: keep letters, digits, dash, underscore; collapse the rest.
_FILENAME_SAFE = re.compile(r"[^A-Za-z0-9._-]+")

_read_cache: dict[str, tuple[float, bytes, str]] = {}


def _config() -> tuple[str, str, str]:
    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPO")
    branch = os.environ.get("GITHUB_BRANCH", DEFAULT_BRANCH)
    if not token or not repo:
        raise RuntimeError(
            "GitHub storage is not configured. Set GITHUB_TOKEN and GITHUB_REPO in backend/.env"
        )
    return token, repo, branch


def is_configured() -> bool:
    return bool(os.environ.get("GITHUB_TOKEN") and os.environ.get("GITHUB_REPO"))


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _safe_filename(original: str) -> str:
    name = (original or "file").strip().split("/")[-1]
    if "." in name:
        stem, ext = name.rsplit(".", 1)
        ext = _FILENAME_SAFE.sub("", ext).lower()[:8] or "bin"
    else:
        stem, ext = name, "bin"
    stem = _FILENAME_SAFE.sub("-", stem).strip("-_.")[:60] or "file"
    return f"{stem}-{uuid.uuid4().hex[:8]}.{ext}"


def _evict_cache_if_needed() -> None:
    if len(_read_cache) <= MAX_CACHE_ENTRIES:
        return
    # drop oldest
    oldest = sorted(_read_cache.items(), key=lambda kv: kv[1][0])[: len(_read_cache) // 4]
    for k, _ in oldest:
        _read_cache.pop(k, None)


async def upload_file(folder: str, filename: str, file_bytes: bytes, content_type: Optional[str] = None) -> dict:
    """Push file to GitHub via Contents API. Returns {path, url}.

    `folder` is normalised to a slash-separated path inside the repo.
    """
    token, repo, branch = _config()
    folder = (folder or "uploads").strip("/")
    safe_name = _safe_filename(filename)
    path = f"{folder}/{safe_name}"
    api_url = f"{GITHUB_API}/repos/{repo}/contents/{path}"
    payload = {
        "message": f"upload: {path}",
        "content": base64.b64encode(file_bytes).decode("ascii"),
        "branch": branch,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.put(api_url, headers=_headers(token), json=payload)
    if r.status_code not in (200, 201):
        logger.error("GitHub upload failed %s %s: %s", r.status_code, path, r.text[:300])
        raise RuntimeError(f"GitHub upload failed ({r.status_code})")
    return {"path": path, "url": f"/api/media/{path}"}


async def fetch_file(path: str) -> tuple[bytes, str]:
    """Return (bytes, content_type) for the file at `path`. Cached for 1h."""
    path = path.lstrip("/")
    now = time.time()
    cached = _read_cache.get(path)
    if cached and now - cached[0] < CACHE_TTL_SECONDS:
        return cached[1], cached[2]
    token, repo, branch = _config()
    api_url = f"{GITHUB_API}/repos/{repo}/contents/{path}?ref={branch}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Use raw media type to avoid base64 + 1MB limit on large files
        headers = _headers(token).copy()
        headers["Accept"] = "application/vnd.github.raw"
        r = await client.get(api_url, headers=headers)
    if r.status_code == 404:
        raise FileNotFoundError(path)
    if r.status_code != 200:
        logger.error("GitHub fetch failed %s %s: %s", r.status_code, path, r.text[:200])
        raise RuntimeError(f"GitHub fetch failed ({r.status_code})")
    content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
    data = r.content
    _read_cache[path] = (now, data, content_type)
    _evict_cache_if_needed()
    return data, content_type


async def delete_file(path: str) -> bool:
    """Delete a file from the repo. Returns True if deleted, False if missing."""
    token, repo, branch = _config()
    path = path.lstrip("/")
    api_url = f"{GITHUB_API}/repos/{repo}/contents/{path}?ref={branch}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        head = await client.get(api_url, headers=_headers(token))
        if head.status_code == 404:
            return False
        if head.status_code != 200:
            raise RuntimeError(f"GitHub head failed ({head.status_code})")
        sha = head.json().get("sha")
        if not sha:
            return False
        del_url = f"{GITHUB_API}/repos/{repo}/contents/{path}"
        r = await client.request(
            "DELETE",
            del_url,
            headers=_headers(token),
            json={"message": f"delete: {path}", "sha": sha, "branch": branch},
        )
    _read_cache.pop(path, None)
    return r.status_code in (200, 204)
