"""Admin leads management + stats + CSV export."""
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response

from deps import LEAD_STATUSES, db, require_admin, utc_now_iso
from models import Lead, LeadUpdate

router = APIRouter(prefix="/admin")


@router.get("/leads", response_model=List[Lead])
async def list_leads(
    status: Optional[str] = None,
    q: Optional[str] = None,
    _: bool = Depends(require_admin),
):
    query: dict = {}
    if status and status in LEAD_STATUSES:
        query["status"] = status
    if q:
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [
            {"full_name": regex},
            {"email": regex},
            {"company": regex},
            {"message": regex},
        ]
    return await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)


@router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, _: bool = Depends(require_admin)):
    doc = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    return doc


@router.patch("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, payload: LeadUpdate, _: bool = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = utc_now_iso()
    result = await db.leads.find_one_and_update(
        {"id": lead_id},
        {"$set": updates},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Lead not found")
    return Lead(**result)


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, _: bool = Depends(require_admin)):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"deleted": True}


@router.get("/stats")
async def admin_stats(_: bool = Depends(require_admin)):
    total = await db.leads.count_documents({})
    new_count = await db.leads.count_documents({"status": "new"})
    by_status = {s: await db.leads.count_documents({"status": s}) for s in LEAD_STATUSES}
    posts_total = await db.posts.count_documents({})
    posts_published = await db.posts.count_documents({"status": "published"})
    cs_total = await db.case_studies.count_documents({})
    cs_published = await db.case_studies.count_documents({"status": "published"})
    invoices_total = await db.invoices.count_documents({})
    invoices_outstanding = await db.invoices.count_documents(
        {"status": {"$in": ["sent", "overdue"]}}
    )
    invoices_paid = await db.invoices.count_documents({"status": "paid"})
    return {
        "total_leads": total,
        "new_leads": new_count,
        "leads_by_status": by_status,
        "posts_total": posts_total,
        "posts_published": posts_published,
        "case_studies_total": cs_total,
        "case_studies_published": cs_published,
        "invoices_total": invoices_total,
        "invoices_outstanding": invoices_outstanding,
        "invoices_paid": invoices_paid,
    }


@router.get("/leads-export.csv")
async def export_leads_csv(_: bool = Depends(require_admin)):
    rows = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "created_at", "full_name", "email", "company", "phone",
        "industry", "service_interest", "status", "message", "notes",
    ])
    for r in rows:
        writer.writerow([
            r.get("id", ""), r.get("created_at", ""), r.get("full_name", ""),
            r.get("email", ""), r.get("company", "") or "", r.get("phone", "") or "",
            r.get("industry", "") or "", r.get("service_interest", "") or "",
            r.get("status", ""), (r.get("message") or "").replace("\n", " ").strip(),
            (r.get("notes") or "").replace("\n", " ").strip(),
        ])
    csv_bytes = buf.getvalue().encode("utf-8-sig")
    filename = f"mir-leads-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
