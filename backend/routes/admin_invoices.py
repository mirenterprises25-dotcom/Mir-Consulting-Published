"""Invoices — admin CRUD, PDF, email, public token view + Stripe Checkout."""
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response

import stripe_service
from deps import (
    COMPANY_EMAIL,
    INVOICE_STATUSES,
    db,
    public_invoice_url,
    require_admin,
    utc_now_iso,
)
from email_service import is_configured as smtp_is_configured
from email_service import send_invoice_email
from invoice_pdf import fmt_money, render_invoice_pdf
from models import CheckoutSessionPayload, Invoice, InvoiceCreate

logger = logging.getLogger(__name__)
router = APIRouter()  # mixes /admin/invoices and /invoices/public paths

_COMPANY = {
    "name": "MIR Consulting",
    "tagline": "Strategy · Technology · Intelligence",
    "email": COMPANY_EMAIL,
    "footer": "MIR Consulting — generated electronically. Valid without signature.",
}


async def _next_invoice_number() -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"INV-{year}-"
    last = await db.invoices.find_one(
        {"number": {"$regex": f"^{prefix}"}},
        sort=[("number", -1)],
        projection={"_id": 0, "number": 1},
    )
    n = 1
    if last:
        try:
            n = int(last["number"].split("-")[-1]) + 1
        except (ValueError, IndexError):
            n = 1
    return f"{prefix}{n:04d}"


def _compute_totals(line_items: List[dict], tax_rate: float):
    enriched = []
    subtotal = 0.0
    for it in line_items:
        qty = float(it.get("quantity", 0))
        rate = float(it.get("rate", 0))
        amount = round(qty * rate, 2)
        enriched.append({
            "description": it.get("description", ""),
            "quantity": qty,
            "rate": rate,
            "amount": amount,
        })
        subtotal += amount
    subtotal = round(subtotal, 2)
    tax_amount = round(subtotal * (tax_rate / 100.0), 2)
    total = round(subtotal + tax_amount, 2)
    return enriched, subtotal, tax_amount, total


# -------------------- ADMIN --------------------
@router.get("/admin/invoices", response_model=List[Invoice])
async def list_invoices(
    status: Optional[str] = None,
    q: Optional[str] = None,
    _: bool = Depends(require_admin),
):
    query: dict = {}
    if status and status in INVOICE_STATUSES:
        query["status"] = status
    if q:
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [
            {"number": regex},
            {"client_name": regex},
            {"client_email": regex},
            {"client_company": regex},
        ]
    return await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.post("/admin/invoices", response_model=Invoice, status_code=201)
async def create_invoice(payload: InvoiceCreate, _: bool = Depends(require_admin)):
    line_items, subtotal, tax_amount, total = _compute_totals(
        [li.model_dump() for li in payload.line_items], payload.tax_rate
    )
    number = await _next_invoice_number()
    inv = Invoice(
        number=number,
        client_name=payload.client_name,
        client_email=payload.client_email,
        client_company=payload.client_company,
        client_address=payload.client_address,
        currency=payload.currency,
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        line_items=line_items,
        subtotal=subtotal,
        tax_rate=payload.tax_rate,
        tax_amount=tax_amount,
        total=total,
        notes=payload.notes,
        status=payload.status,
        lead_id=payload.lead_id,
    )
    await db.invoices.insert_one(inv.model_dump())
    return inv


@router.get("/admin/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, _: bool = Depends(require_admin)):
    doc = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return doc


@router.put("/admin/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(
    invoice_id: str, payload: InvoiceCreate, _: bool = Depends(require_admin)
):
    existing = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    line_items, subtotal, tax_amount, total = _compute_totals(
        [li.model_dump() for li in payload.line_items], payload.tax_rate
    )
    updates = {
        "client_name": payload.client_name,
        "client_email": payload.client_email,
        "client_company": payload.client_company,
        "client_address": payload.client_address,
        "currency": payload.currency,
        "issue_date": payload.issue_date,
        "due_date": payload.due_date,
        "line_items": line_items,
        "subtotal": subtotal,
        "tax_rate": payload.tax_rate,
        "tax_amount": tax_amount,
        "total": total,
        "notes": payload.notes,
        "status": payload.status,
        "lead_id": payload.lead_id,
        "updated_at": utc_now_iso(),
    }
    if payload.status == "paid" and existing.get("status") != "paid":
        updates["paid_at"] = utc_now_iso()
    await db.invoices.update_one({"id": invoice_id}, {"$set": updates})
    return await db.invoices.find_one({"id": invoice_id}, {"_id": 0})


@router.delete("/admin/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, _: bool = Depends(require_admin)):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"deleted": True}


@router.get("/admin/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(invoice_id: str, _: bool = Depends(require_admin)):
    doc = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    pdf = render_invoice_pdf(doc, company=_COMPANY)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc["number"]}.pdf"'},
    )


@router.post("/admin/invoices/{invoice_id}/send")
async def send_invoice(invoice_id: str, _: bool = Depends(require_admin)):
    doc = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not doc.get("client_email"):
        raise HTTPException(status_code=400, detail="Client email is required to send")
    if not smtp_is_configured():
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Add SMTP_USER and SMTP_APP_PASSWORD to backend/.env",
        )
    pdf = render_invoice_pdf(doc, company=_COMPANY)
    ok = send_invoice_email(
        recipient=doc["client_email"],
        invoice_number=doc["number"],
        client_name=doc["client_name"],
        total_display=fmt_money(doc.get("total", 0), doc.get("currency", "EUR")),
        due_date=doc.get("due_date", ""),
        pdf_bytes=pdf,
        public_url=public_invoice_url(doc["public_token"]),
    )
    if not ok:
        raise HTTPException(status_code=502, detail="Failed to send email (check SMTP credentials)")
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {"status": "sent", "sent_at": utc_now_iso(), "updated_at": utc_now_iso()}},
    )
    return {"sent": True}


# -------------------- PUBLIC INVOICE VIEW --------------------
@router.get("/invoices/public/{token}")
async def public_invoice(token: str):
    doc = await db.invoices.find_one({"public_token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return doc


@router.get("/invoices/public/{token}/pdf")
async def public_invoice_pdf(token: str):
    doc = await db.invoices.find_one({"public_token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    pdf = render_invoice_pdf(doc, company=_COMPANY)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc["number"]}.pdf"'},
    )


# -------------------- STRIPE CHECKOUT --------------------
@router.post("/invoices/public/{token}/checkout")
async def create_invoice_checkout(token: str, payload: CheckoutSessionPayload):
    doc = await db.invoices.find_one({"public_token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if doc.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")
    if doc.get("status") == "void":
        raise HTTPException(status_code=400, detail="Invoice is void")
    amount = float(doc.get("total", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invoice total is zero — nothing to charge")
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/invoice/{token}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/invoice/{token}?payment=cancelled"
    try:
        session = await stripe_service.create_invoice_session(
            invoice_number=doc["number"],
            amount=amount,
            currency=doc.get("currency", "USD"),
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"public_token": token, "invoice_id": doc["id"]},
        )
    except Exception as e:
        logger.exception("Stripe checkout creation failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}")

    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "invoice_id": doc["id"],
        "invoice_number": doc["number"],
        "public_token": token,
        "amount": amount,
        "currency": doc.get("currency", "USD"),
        "payment_status": "initiated",
        "status": "open",
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    })
    return {"url": session.url, "session_id": session.session_id}


@router.get("/invoices/public/{token}/checkout/{session_id}")
async def invoice_checkout_status(token: str, session_id: str):
    doc = await db.invoices.find_one({"public_token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        status = await stripe_service.get_session_status(session_id)
    except Exception as e:
        logger.exception("Stripe status check failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}")

    update = {
        "status": status.status,
        "payment_status": status.payment_status,
        "updated_at": utc_now_iso(),
    }
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if txn and txn.get("payment_status") != "paid" and status.payment_status == "paid":
        await db.invoices.update_one(
            {"public_token": token, "status": {"$ne": "paid"}},
            {"$set": {"status": "paid", "paid_at": utc_now_iso(), "updated_at": utc_now_iso()}},
        )
    await db.payment_transactions.update_one(
        {"session_id": session_id}, {"$set": update}
    )
    return {
        "session_id": session_id,
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }


# -------------------- STRIPE WEBHOOK (NB: NOT under /api prefix in original; preserved) --------------------
async def stripe_webhook_handler(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        evt = stripe_service.verify_webhook(body, sig)
    except Exception as e:
        logger.warning("Stripe webhook validation failed: %s", e)
        raise HTTPException(status_code=400, detail="Invalid signature")
    if (
        evt.event_type in ("checkout.session.completed", "payment_intent.succeeded")
        and evt.payment_status == "paid"
    ):
        sid = evt.session_id
        txn = await db.payment_transactions.find_one({"session_id": sid}) if sid else None
        if txn and txn.get("payment_status") != "paid":
            await db.invoices.update_one(
                {"id": txn["invoice_id"], "status": {"$ne": "paid"}},
                {"$set": {"status": "paid", "paid_at": utc_now_iso(), "updated_at": utc_now_iso()}},
            )
            await db.payment_transactions.update_one(
                {"session_id": sid},
                {"$set": {"payment_status": "paid", "status": "complete", "updated_at": utc_now_iso()}},
            )
    return {"received": True}
