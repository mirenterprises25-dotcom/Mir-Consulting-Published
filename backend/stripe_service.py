"""Stripe Checkout integration using the official `stripe` SDK.

This module is the only place we talk to Stripe. It is fully self-contained —
no Emergent-specific dependencies — so the codebase stays portable to any
hosting platform.

Public surface
--------------
- ``create_invoice_session(...)``  → create a one-time Checkout Session for an invoice.
- ``get_session_status(session_id)`` → poll the session's status (idempotent).
- ``verify_webhook(body, sig_header)`` → validate + parse a Stripe webhook payload.

All three return lightweight typed objects that mirror the previous wrapper, so
``server.py`` did not need any structural changes.
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Any, Optional

import stripe

logger = logging.getLogger(__name__)


# --- small response shapes that match what server.py expected from the old wrapper ----
@dataclass
class CheckoutSession:
    url: str
    session_id: str


@dataclass
class CheckoutStatus:
    session_id: str
    status: Optional[str]            # 'open' | 'complete' | 'expired'
    payment_status: Optional[str]    # 'paid' | 'unpaid' | 'no_payment_required'
    amount_total: Optional[int]
    currency: Optional[str]


@dataclass
class WebhookEvent:
    event_type: str                  # e.g. 'checkout.session.completed'
    session_id: Optional[str]
    payment_status: Optional[str]
    raw: Any                         # the full stripe.Event for callers that want more


# --- module setup --------------------------------------------------------------------
def _api_key() -> str:
    key = os.environ.get("STRIPE_API_KEY")
    if not key:
        raise RuntimeError("STRIPE_API_KEY missing from environment")
    return key


def _configure_stripe() -> None:
    """Apply the API key + optional gateway base URL to the stripe SDK.

    The Emergent platform issues the placeholder key ``sk_test_emergent`` which
    is routed through their proxy at ``https://integrations.emergentagent.com/stripe``.
    For any real Stripe key we use the default Stripe API base.
    """
    key = _api_key()
    stripe.api_key = key
    if "sk_test_emergent" in key:
        stripe.api_base = "https://integrations.emergentagent.com/stripe"
    else:
        # default api base — restore in case it was previously overridden
        stripe.api_base = "https://api.stripe.com"


# --- public helpers ------------------------------------------------------------------
async def create_invoice_session(
    *,
    invoice_number: str,
    amount: float,
    currency: str,
    success_url: str,
    cancel_url: str,
    metadata: Optional[dict] = None,
) -> CheckoutSession:
    """Create a Stripe Checkout Session that charges exactly ``amount`` once."""
    _configure_stripe()
    currency = (currency or "USD").lower()
    unit_amount = int(round(float(amount) * 100))  # Stripe uses smallest currency unit
    md = {"source": "mir-consulting-invoice", "invoice_number": invoice_number}
    if metadata:
        md.update({k: str(v) for k, v in metadata.items()})

    session = stripe.checkout.Session.create(
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        line_items=[
            {
                "price_data": {
                    "currency": currency,
                    "product_data": {"name": f"Invoice {invoice_number}"},
                    "unit_amount": unit_amount,
                },
                "quantity": 1,
            }
        ],
        metadata=md,
    )
    return CheckoutSession(url=session.url, session_id=session.id)


async def get_session_status(session_id: str) -> CheckoutStatus:
    _configure_stripe()
    s = stripe.checkout.Session.retrieve(session_id)
    return CheckoutStatus(
        session_id=s.id,
        status=s.get("status"),
        payment_status=s.get("payment_status"),
        amount_total=s.get("amount_total"),
        currency=s.get("currency"),
    )


def verify_webhook(body: bytes, sig_header: str) -> WebhookEvent:
    """Validate the Stripe signature and return a small event summary.

    When ``STRIPE_WEBHOOK_SECRET`` is unset (e.g. local dev) we still parse the
    JSON body so the rest of the pipeline can be exercised, but we log a
    warning so it's obvious in production.
    """
    _configure_stripe()
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if secret:
        event = stripe.Webhook.construct_event(payload=body, sig_header=sig_header, secret=secret)
    else:
        logger.warning(
            "STRIPE_WEBHOOK_SECRET not set — parsing webhook without signature verification."
        )
        import json
        event = stripe.Event.construct_from(json.loads(body or b"{}"), stripe.api_key)

    data_obj = (event.get("data") or {}).get("object") or {}
    session_id = data_obj.get("id") if event.get("type", "").startswith("checkout.session.") else None
    if not session_id:
        # payment_intent events expose the linked session via metadata; fall back to None.
        session_id = data_obj.get("metadata", {}).get("checkout_session_id")
    payment_status = data_obj.get("payment_status") or (
        "paid" if event.get("type") == "payment_intent.succeeded" else None
    )

    return WebhookEvent(
        event_type=event.get("type", ""),
        session_id=session_id,
        payment_status=payment_status,
        raw=event,
    )
