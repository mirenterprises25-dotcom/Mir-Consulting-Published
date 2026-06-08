"""Shared backend dependencies: DB connection, auth guard, helpers, constants.

Centralising these here lets every router import from one place and keeps
`server.py` thin (just the FastAPI app + middleware + startup wiring).
"""
from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter
from slowapi.util import get_remote_address


# .env is loaded once, the first time any router imports `deps`.
load_dotenv(Path(__file__).parent / ".env")


# ---- env / constants ----
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "mir-admin-2025")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN") or secrets.token_urlsafe(32)
COMPANY_EMAIL = os.environ.get("COMPANY_EMAIL", "mirconsulting26@gmail.com")

LEAD_STATUSES = ("new", "contacted", "qualified", "won", "lost")
CONTENT_STATUSES = ("draft", "published")
SUPPORTED_CURRENCIES = ("EUR", "USD", "GBP", "INR", "CHF", "JPY", "AED")
INVOICE_STATUSES = ("draft", "sent", "paid", "overdue", "void")


# ---- DB ----
_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = _client[os.environ["DB_NAME"]]


def close_db_client() -> None:
    _client.close()


# ---- rate limiter (shared across routers) ----
limiter = Limiter(key_func=get_remote_address)


# ---- helpers ----
def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def require_admin(authorization: Optional[str] = Header(default=None)) -> bool:
    """Static-Bearer admin guard."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization.split(" ", 1)[1].strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return True


async def unique_slug(collection, base_slug: str, exclude_id: Optional[str] = None) -> str:
    """Return a slug guaranteed to be unique in the given Mongo collection."""
    slug = base_slug or "untitled"
    candidate = slug
    i = 2
    while True:
        query: dict = {"slug": candidate}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        existing = await collection.find_one(query, {"_id": 0, "id": 1})
        if not existing:
            return candidate
        candidate = f"{slug}-{i}"
        i += 1


def public_invoice_url(token: str) -> Optional[str]:
    base = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")
    if not base:
        return None
    return f"{base}/invoice/{token}"
