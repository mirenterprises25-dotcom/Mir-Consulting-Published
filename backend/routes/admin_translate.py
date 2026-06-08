"""LLM-powered CMS translation endpoint."""
import logging

from fastapi import APIRouter, Depends, HTTPException

from deps import require_admin
from models import TranslatePayload
from translate_service import translate_text

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin")


@router.post("/translate")
async def admin_translate(payload: TranslatePayload, _: bool = Depends(require_admin)):
    if not payload.text or not payload.text.strip():
        return {"translated": ""}
    try:
        out = await translate_text(
            payload.text, payload.target_lang, payload.source_lang or "auto"
        )
    except Exception as e:
        msg = str(e)
        if "Budget has been exceeded" in msg or "budget" in msg.lower():
            logger.warning("Translation rate-limited: %s", msg)
            raise HTTPException(
                status_code=429,
                detail="Translation temporarily unavailable (LLM budget). Please retry in a moment.",
            )
        logger.exception("Translation failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Translation failed: {e}")
    return {"translated": out, "target_lang": payload.target_lang}
