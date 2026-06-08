"""LLM-based translation service using LiteLLM (portable, no Emergent dependency).

LiteLLM is a thin wrapper that lets us call OpenAI, Anthropic, Gemini, or any
other provider with the same API. The function picks the first provider whose
API key is configured, so you can migrate between hosts just by changing the
``.env`` keys.

Provider priority (first match wins):
    1. ``GEMINI_API_KEY``     → google's Gemini 2.5 Flash
    2. ``OPENAI_API_KEY``     → openai's gpt-4o-mini
    3. ``ANTHROPIC_API_KEY``  → anthropic's claude-3-5-haiku
    4. ``EMERGENT_LLM_KEY``   → only used when running on the Emergent platform
                                via the proxy gateway (``api.emergent.ai/llm``).
"""
from __future__ import annotations

import logging
import os

from litellm import acompletion

logger = logging.getLogger(__name__)

LANG_NAMES = {"en": "English", "de": "German", "es": "Spanish"}


def _system_prompt(target_lang: str, source_lang: str) -> str:
    target_name = LANG_NAMES.get(target_lang, target_lang)
    source_name = (
        LANG_NAMES.get(source_lang, "the source language")
        if source_lang != "auto"
        else "the source language"
    )
    return (
        f"You are a professional translator. Translate the user's text from {source_name} into {target_name}.\n"
        "Rules:\n"
        "- Preserve all Markdown formatting (headings, bold, italics, lists, links, code blocks) exactly.\n"
        "- Preserve all URLs, email addresses, proper nouns and brand names verbatim.\n"
        "- Do NOT add any preamble, summary, footer, disclaimer or commentary.\n"
        "- Reply with ONLY the translated text, nothing else."
    )


def _resolve_provider() -> dict:
    """Return the model + api_key kwargs for the first configured provider."""
    if os.environ.get("GEMINI_API_KEY"):
        return {"model": "gemini/gemini-2.5-flash", "api_key": os.environ["GEMINI_API_KEY"]}
    if os.environ.get("OPENAI_API_KEY"):
        return {"model": "openai/gpt-4o-mini", "api_key": os.environ["OPENAI_API_KEY"]}
    if os.environ.get("ANTHROPIC_API_KEY"):
        return {"model": "anthropic/claude-3-5-haiku-latest", "api_key": os.environ["ANTHROPIC_API_KEY"]}
    if os.environ.get("EMERGENT_LLM_KEY"):
        # Emergent's universal-key gateway speaks the OpenAI protocol.
        return {
            "model": "openai/gpt-4o-mini",
            "api_key": os.environ["EMERGENT_LLM_KEY"],
            "api_base": "https://integrations.emergentagent.com/llm",
        }
    raise RuntimeError(
        "No LLM provider key configured. Set one of: "
        "GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or EMERGENT_LLM_KEY."
    )


async def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    if target_lang == source_lang and source_lang != "auto":
        return text
    if not text or not text.strip():
        return ""

    provider = _resolve_provider()
    response = await acompletion(
        messages=[
            {"role": "system", "content": _system_prompt(target_lang, source_lang)},
            {"role": "user", "content": text},
        ],
        max_tokens=4096,
        temperature=0.2,
        **provider,
    )
    out = response["choices"][0]["message"]["content"]
    return (out or "").strip()
