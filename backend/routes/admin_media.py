"""Media — upload to GitHub repo (admin), proxy fetch (public)."""
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile

import github_storage
from deps import require_admin

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_MEDIA_FOLDERS = ("team", "blog", "videos", "logos", "uploads")
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


@router.post("/admin/media/upload")
async def upload_media(
    file: UploadFile = File(...),
    folder: str = Form("uploads"),
    _: bool = Depends(require_admin),
):
    if folder not in ALLOWED_MEDIA_FOLDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Folder must be one of: {', '.join(ALLOWED_MEDIA_FOLDERS)}",
        )
    if not github_storage.is_configured():
        raise HTTPException(
            status_code=503,
            detail="GitHub storage is not configured. Set GITHUB_TOKEN and GITHUB_REPO.",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB)",
        )
    try:
        return await github_storage.upload_file(
            folder, file.filename or "file", data, file.content_type
        )
    except Exception as e:
        logger.exception("Media upload failed: %s", e)
        raise HTTPException(status_code=502, detail="Upload to GitHub failed")


@router.get("/media/{path:path}")
async def get_media(path: str):
    if not path or ".." in path:
        raise HTTPException(status_code=400, detail="Invalid path")
    try:
        data, content_type = await github_storage.fetch_file(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Media not found")
    except Exception as e:
        logger.exception("Media fetch failed: %s", e)
        raise HTTPException(status_code=502, detail="Media fetch failed")
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400, immutable"},
    )
