"""FastAPI entrypoint for MIR Consulting API.

Modular layout:
- deps.py            : env, DB client, shared helpers, admin guard, limiter
- models.py          : Pydantic request/response shapes
- routes/*.py        : one file per logical resource (public, auth, leads, content, invoices, media, translate)
- server.py (this)   : app construction, middleware, startup/shutdown, router wiring
"""
from __future__ import annotations

import logging
import os

from fastapi import APIRouter, FastAPI, Request
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware

import auth_admin
from deps import close_db_client, db, limiter
from routes import (
    admin_auth,
    admin_content,
    admin_invoices,
    admin_leads,
    admin_media,
    admin_translate,
    public,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ====================== APP ======================
app = FastAPI(title="MIR Consulting API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Single /api parent router so every nested router auto-inherits the prefix.
api_router = APIRouter(prefix="/api")
api_router.include_router(public.router)
api_router.include_router(admin_auth.router)
api_router.include_router(admin_leads.router)
api_router.include_router(admin_content.router)
api_router.include_router(admin_invoices.router)
api_router.include_router(admin_media.router)
api_router.include_router(admin_translate.router)
app.include_router(api_router)


# Stripe webhook — kept under /api but bypasses request-body parsing on the router level.
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    return await admin_invoices.stripe_webhook_handler(request)


# ====================== MIDDLEWARE ======================
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================== LIFECYCLE ======================
@app.on_event("startup")
async def on_startup():
    try:
        await auth_admin.ensure_admin_seeded(db)
        await auth_admin.ensure_reset_indexes(db)
        await db.team_members.create_index([("order", 1), ("created_at", 1)])
        await db.videos.create_index("slug", unique=True)
        logger.info("Admin auth bootstrapped (admin seeded, indexes ensured).")
    except Exception as e:  # noqa: BLE001
        logger.exception("Auth bootstrap failed: %s", e)


@app.on_event("shutdown")
async def on_shutdown():
    close_db_client()
