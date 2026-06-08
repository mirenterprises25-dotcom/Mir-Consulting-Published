"""LLM-based translation service powered by Emergent Universal Key.

Uses emergentintegrations.llm.chat with the cost-effective gemini-2.5-flash
model (per playbook). Preserves Markdown formatting and replies in the
target language only — no preambles, no chain-of-thought.
"""
from __future__ import annotations

import logging
import os
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

LANG_NAMES = {"en": "English", "de": "German", "es": "Spanish"}


def _api_key() -> str:
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise RuntimeError("EMERGENT_LLM_KEY missing from environment")
    return key


def _system_prompt(target_lang: str, source_lang: str) -> str:
    target_name = LANG_NAMES.get(target_lang, target_lang)
    source_name = LANG_NAMES.get(source_lang, "the source language") if source_lang != "auto" else "the source language"
    return (
        f"You are a professional translator. Translate the user's text from {source_name} into {target_name}.\n"
        "Rules:\n"
        "- Preserve all Markdown formatting (headings, bold, italics, lists, links, code blocks) exactly.\n"
        "- Preserve all URLs, email addresses, proper nouns and brand names verbatim.\n"
        "- Do NOT add any preamble, summary, footer, disclaimer or commentary.\n"
        "- Reply with ONLY the translated text, nothing else."
    )


async def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    if target_lang == source_lang and source_lang != "auto":
        return text
    chat = (
        LlmChat(
            api_key=_api_key(),
            session_id=f"translate-{uuid.uuid4()}",
            system_message=_system_prompt(target_lang, source_lang),
        )
        .with_model("gemini", "gemini-2.5-flash")
    )
    msg = UserMessage(text=text)
    response = await chat.send_message(msg)
    return (response or "").strip()
