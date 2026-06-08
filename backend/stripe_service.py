"""Stripe Checkout integration via emergentintegrations.

Exposes helpers for creating a checkout session for an invoice and reading
its current status. Uses the StripeCheckout client from emergentintegrations.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
)

logger = logging.getLogger(__name__)


def _api_key() -> str:
    key = os.environ.get("STRIPE_API_KEY")
    if not key:
        raise RuntimeError("STRIPE_API_KEY missing from environment")
    return key


def _client(webhook_url: Optional[str] = None) -> StripeCheckout:
    return StripeCheckout(api_key=_api_key(), webhook_url=webhook_url or "")


async def create_invoice_session(
    *,
    invoice_number: str,
    amount: float,
    currency: str,
    success_url: str,
    cancel_url: str,
    metadata: Optional[dict] = None,
) -> CheckoutSessionResponse:
    """Create a Stripe Checkout Session for a fixed invoice amount (server-side)."""
    req = CheckoutSessionRequest(
        amount=float(amount),
        currency=(currency or "USD").lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "source": "mir-consulting-invoice",
            "invoice_number": invoice_number,
            **(metadata or {}),
        },
    )
    return await _client().create_checkout_session(req)


async def get_session_status(session_id: str) -> CheckoutStatusResponse:
    return await _client().get_checkout_status(session_id)
