from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slugify import slugify
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
import uuid
import secrets
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'mir-admin-2025')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN') or secrets.token_urlsafe(32)
COMPANY_EMAIL = os.environ.get('COMPANY_EMAIL', 'mirconsulting26@gmail.com')

LEAD_STATUSES = ("new", "contacted", "qualified", "won", "lost")
CONTENT_STATUSES = ("draft", "published")


# ====================== APP / LIMITER ======================
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="MIR Consulting API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")


# ====================== MODELS ======================
def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=160)
    phone: Optional[str] = Field(default=None, max_length=40)
    industry: Optional[str] = Field(default=None, max_length=80)
    service_interest: Optional[str] = Field(default=None, max_length=160)
    message: str = Field(min_length=10, max_length=4000)


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: str
    company: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    service_interest: Optional[str] = None
    message: str
    status: Literal["new", "contacted", "qualified", "won", "lost"] = "new"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


class LeadUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: Optional[Literal["new", "contacted", "qualified", "won", "lost"]] = None
    notes: Optional[str] = Field(default=None, max_length=4000)


class AdminLogin(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    token: str


class PostCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = Field(min_length=3, max_length=240)
    excerpt: str = Field(min_length=10, max_length=600)
    content: str = Field(min_length=10)
    category: str = Field(min_length=2, max_length=80)
    cover_image: Optional[str] = Field(default=None, max_length=600)
    read_time: Optional[str] = Field(default=None, max_length=40)
    status: Literal["draft", "published"] = "draft"
    slug: Optional[str] = Field(default=None, max_length=200)


class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    excerpt: str
    content: str
    category: str
    cover_image: Optional[str] = None
    read_time: Optional[str] = None
    status: Literal["draft", "published"] = "draft"
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)
    published_at: Optional[str] = None


class CaseStudyCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = Field(min_length=3, max_length=240)
    sector: str = Field(min_length=2, max_length=80)
    summary: str = Field(min_length=10, max_length=600)
    content: str = Field(min_length=10)
    cover_image: Optional[str] = Field(default=None, max_length=600)
    client_name: Optional[str] = Field(default=None, max_length=160)
    outcomes: Optional[List[str]] = Field(default_factory=list)
    status: Literal["draft", "published"] = "draft"
    slug: Optional[str] = Field(default=None, max_length=200)


class CaseStudy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    sector: str
    summary: str
    content: str
    cover_image: Optional[str] = None
    client_name: Optional[str] = None
    outcomes: List[str] = Field(default_factory=list)
    status: Literal["draft", "published"] = "draft"
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)
    published_at: Optional[str] = None


# ====================== AUTH DEP ======================
def require_admin(authorization: Optional[str] = Header(default=None)) -> bool:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization.split(" ", 1)[1].strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return True


# ====================== HELPERS ======================
async def _unique_slug(collection, base_slug: str, exclude_id: Optional[str] = None) -> str:
    slug = base_slug or "untitled"
    candidate = slug
    i = 2
    while True:
        query = {"slug": candidate}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        existing = await collection.find_one(query, {"_id": 0, "id": 1})
        if not existing:
            return candidate
        candidate = f"{slug}-{i}"
        i += 1


# ====================== PUBLIC ROUTES ======================
@api_router.get("/")
async def root():
    return {"service": "MIR Consulting API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": utc_now_iso()}


@api_router.get("/company")
async def company():
    return {"email": COMPANY_EMAIL}


@api_router.post("/leads", response_model=Lead, status_code=201)
@limiter.limit("5/minute")
async def create_lead(request: Request, payload: LeadCreate):
    lead = Lead(**payload.model_dump())
    await db.leads.insert_one(lead.model_dump())
    logger.info(f"New lead: {lead.email} ({lead.full_name})")
    return lead


@api_router.get("/posts", response_model=List[Post])
async def list_posts():
    rows = (
        await db.posts.find({"status": "published"}, {"_id": 0})
        .sort("published_at", -1)
        .to_list(200)
    )
    return rows


@api_router.get("/posts/{slug}", response_model=Post)
async def get_post(slug: str):
    doc = await db.posts.find_one(
        {"slug": slug, "status": "published"}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return doc


@api_router.get("/case-studies", response_model=List[CaseStudy])
async def list_case_studies():
    rows = (
        await db.case_studies.find({"status": "published"}, {"_id": 0})
        .sort("published_at", -1)
        .to_list(200)
    )
    return rows


@api_router.get("/case-studies/{slug}", response_model=CaseStudy)
async def get_case_study(slug: str):
    doc = await db.case_studies.find_one(
        {"slug": slug, "status": "published"}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Case study not found")
    return doc


# ====================== ADMIN: AUTH ======================
@api_router.post("/admin/login", response_model=AdminLoginResponse)
@limiter.limit("5/minute")
async def admin_login(request: Request, payload: AdminLogin):
    if not secrets.compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AdminLoginResponse(token=ADMIN_TOKEN)


# ====================== ADMIN: LEADS ======================
@api_router.get("/admin/leads", response_model=List[Lead])
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
    rows = (
        await db.leads.find(query, {"_id": 0})
        .sort("created_at", -1)
        .to_list(1000)
    )
    return rows


@api_router.get("/admin/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, _: bool = Depends(require_admin)):
    doc = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    return doc


@api_router.patch("/admin/leads/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    _: bool = Depends(require_admin),
):
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
    return result


@api_router.delete("/admin/leads/{lead_id}")
async def delete_lead(lead_id: str, _: bool = Depends(require_admin)):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"deleted": True}


@api_router.get("/admin/stats")
async def admin_stats(_: bool = Depends(require_admin)):
    total = await db.leads.count_documents({})
    new_count = await db.leads.count_documents({"status": "new"})
    by_status = {}
    for s in LEAD_STATUSES:
        by_status[s] = await db.leads.count_documents({"status": s})
    posts_total = await db.posts.count_documents({})
    posts_published = await db.posts.count_documents({"status": "published"})
    cs_total = await db.case_studies.count_documents({})
    cs_published = await db.case_studies.count_documents({"status": "published"})
    return {
        "total_leads": total,
        "new_leads": new_count,
        "leads_by_status": by_status,
        "posts_total": posts_total,
        "posts_published": posts_published,
        "case_studies_total": cs_total,
        "case_studies_published": cs_published,
    }


# ====================== ADMIN: POSTS ======================
@api_router.get("/admin/posts", response_model=List[Post])
async def admin_list_posts(_: bool = Depends(require_admin)):
    rows = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows


@api_router.post("/admin/posts", response_model=Post, status_code=201)
async def admin_create_post(payload: PostCreate, _: bool = Depends(require_admin)):
    base = slugify(payload.slug or payload.title)
    slug = await _unique_slug(db.posts, base)
    now = utc_now_iso()
    post = Post(
        slug=slug,
        title=payload.title,
        excerpt=payload.excerpt,
        content=payload.content,
        category=payload.category,
        cover_image=payload.cover_image,
        read_time=payload.read_time,
        status=payload.status,
        published_at=now if payload.status == "published" else None,
    )
    await db.posts.insert_one(post.model_dump())
    return post


@api_router.get("/admin/posts/{post_id}", response_model=Post)
async def admin_get_post(post_id: str, _: bool = Depends(require_admin)):
    doc = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return doc


@api_router.put("/admin/posts/{post_id}", response_model=Post)
async def admin_update_post(
    post_id: str, payload: PostCreate, _: bool = Depends(require_admin)
):
    existing = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    base = slugify(payload.slug or payload.title)
    slug = await _unique_slug(db.posts, base, exclude_id=post_id)
    now = utc_now_iso()
    publish_now = (
        payload.status == "published"
        and existing.get("status") != "published"
    )
    updates = {
        "slug": slug,
        "title": payload.title,
        "excerpt": payload.excerpt,
        "content": payload.content,
        "category": payload.category,
        "cover_image": payload.cover_image,
        "read_time": payload.read_time,
        "status": payload.status,
        "updated_at": now,
    }
    if publish_now:
        updates["published_at"] = now
    await db.posts.update_one({"id": post_id}, {"$set": updates})
    doc = await db.posts.find_one({"id": post_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, _: bool = Depends(require_admin)):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"deleted": True}


# ====================== ADMIN: CASE STUDIES ======================
@api_router.get("/admin/case-studies", response_model=List[CaseStudy])
async def admin_list_case_studies(_: bool = Depends(require_admin)):
    rows = (
        await db.case_studies.find({}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(500)
    )
    return rows


@api_router.post(
    "/admin/case-studies", response_model=CaseStudy, status_code=201
)
async def admin_create_case_study(
    payload: CaseStudyCreate, _: bool = Depends(require_admin)
):
    base = slugify(payload.slug or payload.title)
    slug = await _unique_slug(db.case_studies, base)
    now = utc_now_iso()
    cs = CaseStudy(
        slug=slug,
        title=payload.title,
        sector=payload.sector,
        summary=payload.summary,
        content=payload.content,
        cover_image=payload.cover_image,
        client_name=payload.client_name,
        outcomes=payload.outcomes or [],
        status=payload.status,
        published_at=now if payload.status == "published" else None,
    )
    await db.case_studies.insert_one(cs.model_dump())
    return cs


@api_router.get("/admin/case-studies/{cs_id}", response_model=CaseStudy)
async def admin_get_case_study(cs_id: str, _: bool = Depends(require_admin)):
    doc = await db.case_studies.find_one({"id": cs_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Case study not found")
    return doc


@api_router.put("/admin/case-studies/{cs_id}", response_model=CaseStudy)
async def admin_update_case_study(
    cs_id: str, payload: CaseStudyCreate, _: bool = Depends(require_admin)
):
    existing = await db.case_studies.find_one({"id": cs_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Case study not found")
    base = slugify(payload.slug or payload.title)
    slug = await _unique_slug(db.case_studies, base, exclude_id=cs_id)
    now = utc_now_iso()
    publish_now = (
        payload.status == "published"
        and existing.get("status") != "published"
    )
    updates = {
        "slug": slug,
        "title": payload.title,
        "sector": payload.sector,
        "summary": payload.summary,
        "content": payload.content,
        "cover_image": payload.cover_image,
        "client_name": payload.client_name,
        "outcomes": payload.outcomes or [],
        "status": payload.status,
        "updated_at": now,
    }
    if publish_now:
        updates["published_at"] = now
    await db.case_studies.update_one({"id": cs_id}, {"$set": updates})
    doc = await db.case_studies.find_one({"id": cs_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/case-studies/{cs_id}")
async def admin_delete_case_study(
    cs_id: str, _: bool = Depends(require_admin)
):
    result = await db.case_studies.delete_one({"id": cs_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return {"deleted": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
