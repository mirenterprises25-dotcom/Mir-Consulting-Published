"""Email service for MIR Consulting.

Uses Gmail SMTP (or any SMTP server) via stdlib smtplib.
Configuration via .env:
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=mirconsulting26@gmail.com
  SMTP_APP_PASSWORD=<16-char Google App Password>
  COMPANY_EMAIL=mirconsulting26@gmail.com    # default recipient for new-lead alerts

If SMTP_APP_PASSWORD is empty the service is disabled and calls become no-ops
(returning False) so request handlers never break.
"""
from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage
from typing import Optional, Iterable

logger = logging.getLogger(__name__)


def _cfg() -> Optional[dict]:
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER") or os.environ.get("COMPANY_EMAIL")
    password = os.environ.get("SMTP_APP_PASSWORD", "").replace(" ", "").strip()
    if not user or not password:
        return None
    return {"host": host, "port": port, "user": user, "password": password}


def is_configured() -> bool:
    return _cfg() is not None


def _send(
    *,
    to: Iterable[str],
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    attachments: Optional[list[tuple[str, bytes, str]]] = None,
) -> bool:
    cfg = _cfg()
    if not cfg:
        logger.info("SMTP not configured — skipping email (%s)", subject)
        return False

    to_list = [t for t in to if t]
    if not to_list:
        return False

    msg = EmailMessage()
    msg["From"] = cfg["user"]
    msg["To"] = ", ".join(to_list)
    msg["Subject"] = subject
    msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    for name, data, mime in attachments or []:
        maintype, _, subtype = mime.partition("/")
        msg.add_attachment(
            data, maintype=maintype or "application", subtype=subtype or "octet-stream", filename=name
        )

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as s:
            s.starttls()
            s.login(cfg["user"], cfg["password"])
            s.send_message(msg)
        logger.info("Email sent: %s -> %s", subject, to_list)
        return True
    except Exception as e:  # noqa: BLE001
        logger.exception("Email send failed: %s", e)
        return False


def send_new_lead_notification(lead: dict) -> bool:
    """Notify the company that a new consultation request arrived."""
    recipient = os.environ.get("COMPANY_EMAIL", "")
    if not recipient:
        return False
    subject = f"New consultation request — {lead.get('full_name', 'Unknown')}"
    lines = [
        f"A new consultation request was submitted on the MIR Consulting website.",
        "",
        f"Name:     {lead.get('full_name', '—')}",
        f"Email:    {lead.get('email', '—')}",
        f"Company:  {lead.get('company') or '—'}",
        f"Phone:    {lead.get('phone') or '—'}",
        f"Industry: {lead.get('industry') or '—'}",
        f"Service:  {lead.get('service_interest') or '—'}",
        f"Received: {lead.get('created_at', '—')}",
        "",
        "Message:",
        lead.get("message", ""),
        "",
        "— Sign in to the admin console to manage this lead.",
    ]
    body = "\n".join(lines)
    html = f"""
<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">
  <table style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #e2e8f0">
      <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#0a66ff">MIR Consulting</div>
      <h2 style="margin:8px 0 0;font-weight:300;color:#0f172a">New consultation request</h2>
    </td></tr>
    <tr><td style="padding:24px 28px">
      <table style="width:100%;font-size:14px;color:#0f172a">
        <tr><td style="color:#64748b;padding:4px 0;width:120px">Name</td><td>{lead.get('full_name','—')}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Email</td><td><a href="mailto:{lead.get('email','')}" style="color:#0a66ff">{lead.get('email','—')}</a></td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Company</td><td>{lead.get('company') or '—'}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Phone</td><td>{lead.get('phone') or '—'}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Industry</td><td>{lead.get('industry') or '—'}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0">Service</td><td>{lead.get('service_interest') or '—'}</td></tr>
      </table>
      <div style="margin-top:18px;padding:14px;border:1px solid #e2e8f0;background:#f8fafc;white-space:pre-wrap;font-size:14px">{(lead.get('message') or '').replace('<','&lt;').replace('>','&gt;')}</div>
    </td></tr>
  </table>
</body></html>
"""
    return _send(to=[recipient], subject=subject, body_text=body, body_html=html)


def send_invoice_email(
    *,
    recipient: str,
    invoice_number: str,
    client_name: str,
    total_display: str,
    due_date: str,
    pdf_bytes: bytes,
    public_url: Optional[str] = None,
) -> bool:
    """Send an invoice PDF to a client."""
    subject = f"Invoice {invoice_number} from MIR Consulting"
    link_line = f"\n\nOnline view: {public_url}" if public_url else ""
    body = (
        f"Dear {client_name},\n\n"
        f"Please find attached invoice {invoice_number} for {total_display}, "
        f"due on {due_date}.{link_line}\n\n"
        "Thank you for working with MIR Consulting.\n\n"
        "Kind regards,\n"
        "MIR Consulting"
    )
    html = f"""
<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">
  <table style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #e2e8f0">
      <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#0a66ff">MIR Consulting</div>
      <h2 style="margin:8px 0 0;font-weight:300">Invoice {invoice_number}</h2>
    </td></tr>
    <tr><td style="padding:24px 28px;font-size:14px;line-height:1.6">
      <p>Dear {client_name},</p>
      <p>Please find attached invoice <strong>{invoice_number}</strong> for <strong>{total_display}</strong>, due on <strong>{due_date}</strong>.</p>
      {f'<p>You can also view it online: <a href="{public_url}" style="color:#0a66ff">{public_url}</a></p>' if public_url else ''}
      <p style="margin-top:20px">Thank you for working with MIR Consulting.</p>
      <p>Kind regards,<br/>MIR Consulting</p>
    </td></tr>
  </table>
</body></html>
"""
    return _send(
        to=[recipient],
        subject=subject,
        body_text=body,
        body_html=html,
        attachments=[(f"{invoice_number}.pdf", pdf_bytes, "application/pdf")],
    )
