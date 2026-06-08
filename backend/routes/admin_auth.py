"""Admin authentication: login, forgot-password, reset-password, change-password."""
import logging
import os
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel

import auth_admin
from deps import ADMIN_TOKEN, COMPANY_EMAIL, db, limiter, require_admin
from email_service import is_configured as smtp_is_configured
from models import (
    AdminLogin,
    AdminLoginResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin")


@router.post("/login", response_model=AdminLoginResponse)
@limiter.limit("5/minute")
async def admin_login(request: Request, payload: AdminLogin):
    ok = await auth_admin.verify_admin_password(db, payload.password)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AdminLoginResponse(token=ADMIN_TOKEN)


def _build_reset_email(token: str) -> tuple[str, str, str]:
    base = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")
    link = f"{base}/admin/reset/{token}" if base else f"/admin/reset/{token}"
    subject = "Reset your MIR Consulting admin password"
    text = (
        "A password reset was requested for the MIR Consulting admin console.\n\n"
        f"Open this link within {auth_admin.RESET_TOKEN_TTL_MIN} minutes to choose a new password:\n"
        f"{link}\n\n"
        "If you did not request this, you can safely ignore this email — your password "
        "will not be changed."
    )
    html = f"""
<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">
  <table style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #e2e8f0">
      <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#0a66ff">MIR Consulting · Admin</div>
      <h2 style="margin:8px 0 0;font-weight:300;color:#0f172a">Password reset</h2>
    </td></tr>
    <tr><td style="padding:24px 28px;font-size:14px;line-height:1.6">
      <p>A password reset was requested for the admin console.</p>
      <p style="margin:24px 0"><a href="{link}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 22px;text-decoration:none;font-weight:600">Reset password</a></p>
      <p style="color:#64748b;font-size:12px">This link expires in {auth_admin.RESET_TOKEN_TTL_MIN} minutes and can only be used once. If you didn't request a reset, ignore this email — your password will not be changed.</p>
      <p style="color:#94a3b8;font-size:11px;word-break:break-all">Or copy this URL: {link}</p>
    </td></tr>
  </table>
</body></html>
"""
    return subject, text, html


def _send_reset_email(token: str) -> bool:
    from email_service import _send
    subject, body, html = _build_reset_email(token)
    return _send(to=[COMPANY_EMAIL], subject=subject, body_text=body, body_html=html)


@router.post("/forgot-password")
@limiter.limit("3/15minutes")
async def forgot_password(
    request: Request, payload: ForgotPasswordRequest, background: BackgroundTasks
):
    if payload.email.lower() != COMPANY_EMAIL.lower():
        logger.warning("Forgot-password attempted with non-admin email: %s", payload.email)
        return {"sent": True}
    if not smtp_is_configured():
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Set SMTP_APP_PASSWORD in backend/.env to enable password reset.",
        )
    token = await auth_admin.create_reset_token(db)
    background.add_task(_send_reset_email, token)
    logger.info("Password reset link generated and queued for %s", COMPANY_EMAIL)
    return {"sent": True}


@router.get("/reset-password/{token}")
async def validate_reset(token: str):
    rec = await auth_admin.validate_reset_token(db, token)
    if not rec:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    exp = rec.get("expires_at")
    return {
        "valid": True,
        "expires_at": exp.isoformat() if isinstance(exp, datetime) else exp,
    }


@router.post("/reset-password")
@limiter.limit("5/15minutes")
async def reset_password(request: Request, payload: ResetPasswordRequest):
    rec = await auth_admin.validate_reset_token(db, payload.token)
    if not rec:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    consumed = await auth_admin.consume_reset_token(db, payload.token)
    if not consumed:
        raise HTTPException(status_code=400, detail="This reset link has already been used.")
    await auth_admin.set_admin_password(db, payload.new_password)
    logger.info("Admin password was reset via magic link.")
    return {"reset": True}


@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, _: bool = Depends(require_admin)):
    ok = await auth_admin.verify_admin_password(db, payload.current_password)
    if not ok:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from the current one.")
    await auth_admin.set_admin_password(db, payload.new_password)
    return {"changed": True}


@router.get("/email-status")
async def email_status(_: bool = Depends(require_admin)):
    return {"smtp_configured": smtp_is_configured(), "from_email": COMPANY_EMAIL}
