"""Public, unauthenticated endpoints: health, leads create, posts, case studies, works feed,
team (read), videos (read), site-settings (read)."""
import logging
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from deps import COMPANY_EMAIL, db, limiter, utc_now_iso
from email_service import send_new_lead_notification
from models import CaseStudy, Lead, LeadCreate, Post, SiteSettings, TeamMember, Video

logger = logging.getLogger(__name__)
router = APIRouter()

SITE_SETTINGS_KEY = "site"


@router.get("/")
async def root():
    return {"service": "MIR Consulting API", "status": "ok"}


@router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": utc_now_iso()}


@router.get("/company")
async def company():
    return {"email": COMPANY_EMAIL}


@router.post("/leads", response_model=Lead, status_code=201)
@limiter.limit("5/minute")
async def create_lead(request: Request, payload: LeadCreate, background: BackgroundTasks):
    lead = Lead(**payload.model_dump())
    await db.leads.insert_one(lead.model_dump())
    logger.info(f"New lead: {lead.email} ({lead.full_name})")
    background.add_task(send_new_lead_notification, lead.model_dump())
    return lead


@router.get("/posts", response_model=List[Post])
async def list_posts():
    return await (
        db.posts.find({"status": "published"}, {"_id": 0})
        .sort("published_at", -1)
        .to_list(200)
    )


@router.get("/posts/{slug}", response_model=Post)
async def get_post(slug: str):
    doc = await db.posts.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return doc


@router.get("/case-studies", response_model=List[CaseStudy])
async def list_case_studies():
    return await (
        db.case_studies.find({"status": "published"}, {"_id": 0})
        .sort("published_at", -1)
        .to_list(200)
    )


@router.get("/case-studies/{slug}", response_model=CaseStudy)
async def get_case_study(slug: str):
    doc = await db.case_studies.find_one(
        {"slug": slug, "status": "published"}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Case study not found")
    return doc


@router.get("/team", response_model=List[TeamMember])
async def list_team_public():
    return await (
        db.team_members.find({}, {"_id": 0})
        .sort([("order", 1), ("created_at", 1)])
        .to_list(200)
    )


@router.get("/videos", response_model=List[Video])
async def list_videos_public():
    return await (
        db.videos.find({"status": "published"}, {"_id": 0})
        .sort("published_at", -1)
        .to_list(200)
    )


@router.get("/videos/{slug}", response_model=Video)
async def get_video_public(slug: str):
    doc = await db.videos.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Video not found")
    return doc


@router.get("/works")
async def list_works(type: Optional[str] = None):
    """Unified feed of published insights + case studies + videos."""
    items: list[dict] = []

    if not type or type == "insight":
        for p in await db.posts.find({"status": "published"}, {"_id": 0}).sort("published_at", -1).to_list(200):
            items.append({
                "type": "insight",
                "id": p.get("id"),
                "slug": p.get("slug"),
                "title": p.get("title"),
                "excerpt": p.get("excerpt"),
                "category": p.get("category"),
                "cover_image": p.get("cover_image"),
                "read_time": p.get("read_time"),
                "published_at": p.get("published_at"),
                "href": f"/insights/{p.get('slug')}",
            })

    if not type or type == "case_study":
        for c in await db.case_studies.find({"status": "published"}, {"_id": 0}).sort("published_at", -1).to_list(200):
            items.append({
                "type": "case_study",
                "id": c.get("id"),
                "slug": c.get("slug"),
                "title": c.get("title"),
                "excerpt": c.get("summary"),
                "category": c.get("sector"),
                "cover_image": c.get("cover_image"),
                "client_name": c.get("client_name"),
                "published_at": c.get("published_at"),
                "href": f"/case-studies/{c.get('slug')}",
            })

    if not type or type == "video":
        for v in await db.videos.find({"status": "published"}, {"_id": 0}).sort("published_at", -1).to_list(200):
            items.append({
                "type": "video",
                "id": v.get("id"),
                "slug": v.get("slug"),
                "title": v.get("title"),
                "excerpt": v.get("description")[:300] if v.get("description") else "",
                "category": v.get("category") or "Video",
                "cover_image": v.get("cover_image") or (
                    f"https://img.youtube.com/vi/{v.get('youtube_id')}/maxresdefault.jpg"
                    if v.get("youtube_id") else None
                ),
                "youtube_id": v.get("youtube_id"),
                "youtube_url": v.get("youtube_url"),
                "published_at": v.get("published_at"),
                "href": f"/our-work/video/{v.get('slug')}",
            })

    items.sort(key=lambda x: x.get("published_at") or "", reverse=True)
    return items


@router.get("/site-settings", response_model=SiteSettings)
async def get_site_settings_public():
    doc = await db.site_settings.find_one({"key": SITE_SETTINGS_KEY}, {"_id": 0, "key": 0}) or {}
    return SiteSettings(**doc)
