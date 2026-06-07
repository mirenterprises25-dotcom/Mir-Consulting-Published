"""Invoice PDF generator using ReportLab (no external services).

Produces a clean, light-theme branded PDF for an invoice document dict.
"""
from __future__ import annotations

import io
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

# Brand colors
MIR_TEXT = colors.HexColor("#0f172a")
MIR_MUTED = colors.HexColor("#64748b")
MIR_BLUE = colors.HexColor("#0a66ff")
MIR_BORDER = colors.HexColor("#e2e8f0")
MIR_SURFACE = colors.HexColor("#f8fafc")

# Currency display
CURRENCY_SYMBOLS = {
    "EUR": "€",
    "USD": "$",
    "GBP": "£",
    "INR": "₹",
    "CHF": "CHF ",
    "JPY": "¥",
    "AED": "AED ",
}


def fmt_money(amount: float, currency: str) -> str:
    sym = CURRENCY_SYMBOLS.get(currency.upper(), f"{currency} ")
    return f"{sym}{amount:,.2f}"


def _styles():
    base = getSampleStyleSheet()
    return {
        "label": ParagraphStyle(
            "label",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MIR_MUTED,
            spaceAfter=3,
            leading=10,
        ),
        "labelCap": ParagraphStyle(
            "labelCap",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            textColor=MIR_MUTED,
            spaceAfter=3,
            leading=10,
        ),
        "value": ParagraphStyle(
            "value",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=MIR_TEXT,
            leading=14,
        ),
        "valueBold": ParagraphStyle(
            "valueBold",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=MIR_TEXT,
            leading=14,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=24,
            textColor=MIR_TEXT,
            leading=28,
        ),
        "accent": ParagraphStyle(
            "accent",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=MIR_BLUE,
            leading=10,
            spaceAfter=4,
        ),
        "muted": ParagraphStyle(
            "muted",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            textColor=MIR_MUTED,
            leading=12,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MIR_MUTED,
            leading=11,
        ),
    }


def _format_date(s: Optional[str]) -> str:
    if not s:
        return "—"
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).strftime("%d %b %Y")
    except Exception:  # noqa: BLE001
        return s


def render_invoice_pdf(invoice: dict, *, company: Optional[dict] = None) -> bytes:
    """Render an invoice dict to a PDF byte string."""
    company = company or {
        "name": "MIR Consulting",
        "tagline": "Strategy · Technology · Intelligence",
        "email": "mirconsulting26@gmail.com",
        "footer": (
            "MIR Consulting — Business, Technology & Intelligence Advisory. "
            "This invoice was generated electronically and is valid without signature."
        ),
    }
    s = _styles()
    currency = (invoice.get("currency") or "EUR").upper()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=f"Invoice {invoice.get('number','')}",
        author=company.get("name", "MIR Consulting"),
    )

    story = []

    # Header: brand + invoice meta
    brand = [
        [Paragraph(company["name"], s["h1"])],
        [Paragraph(company.get("tagline", ""), s["accent"])],
    ]
    meta = [
        [Paragraph("INVOICE", s["accent"])],
        [Paragraph(f"<b>{invoice.get('number','—')}</b>", s["valueBold"])],
        [Spacer(1, 6)],
        [Paragraph("ISSUE DATE", s["labelCap"])],
        [Paragraph(_format_date(invoice.get("issue_date")), s["value"])],
        [Spacer(1, 4)],
        [Paragraph("DUE DATE", s["labelCap"])],
        [Paragraph(_format_date(invoice.get("due_date")), s["value"])],
    ]
    header = Table(
        [[Table(brand, colWidths=[100 * mm]), Table(meta, colWidths=[55 * mm])]],
        colWidths=[110 * mm, 60 * mm],
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )
    story.append(header)
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", color=MIR_BORDER, thickness=0.6))
    story.append(Spacer(1, 14))

    # Bill from / Bill to
    from_block = [
        [Paragraph("BILL FROM", s["labelCap"])],
        [Paragraph(f"<b>{company.get('name','')}</b>", s["valueBold"])],
        [Paragraph(company.get("email", ""), s["muted"])],
    ]
    client_lines = [
        [Paragraph("BILL TO", s["labelCap"])],
        [Paragraph(f"<b>{invoice.get('client_name','—')}</b>", s["valueBold"])],
    ]
    if invoice.get("client_company"):
        client_lines.append([Paragraph(invoice["client_company"], s["value"])])
    if invoice.get("client_email"):
        client_lines.append([Paragraph(invoice["client_email"], s["muted"])])
    if invoice.get("client_address"):
        for line in str(invoice["client_address"]).splitlines():
            client_lines.append([Paragraph(line, s["muted"])])

    parties = Table(
        [[Table(from_block, colWidths=[85 * mm]), Table(client_lines, colWidths=[85 * mm])]],
        colWidths=[85 * mm, 85 * mm],
    )
    parties.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(parties)
    story.append(Spacer(1, 20))

    # Line items table
    head = [
        Paragraph("DESCRIPTION", s["labelCap"]),
        Paragraph("QTY", s["labelCap"]),
        Paragraph("RATE", s["labelCap"]),
        Paragraph("AMOUNT", s["labelCap"]),
    ]
    rows = [head]
    for item in invoice.get("line_items", []):
        qty = float(item.get("quantity", 0))
        rate = float(item.get("rate", 0))
        amount = float(item.get("amount", qty * rate))
        rows.append(
            [
                Paragraph(str(item.get("description", "")), s["value"]),
                Paragraph(f"{qty:g}", s["value"]),
                Paragraph(fmt_money(rate, currency), s["value"]),
                Paragraph(fmt_money(amount, currency), s["value"]),
            ]
        )

    items_table = Table(
        rows,
        colWidths=[90 * mm, 18 * mm, 30 * mm, 32 * mm],
        repeatRows=1,
    )
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), MIR_SURFACE),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, MIR_BORDER),
                ("LINEBELOW", (0, 1), (-1, -1), 0.3, MIR_BORDER),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 16))

    # Totals box (right-aligned)
    subtotal = float(invoice.get("subtotal", 0))
    tax_rate = float(invoice.get("tax_rate", 0))
    tax_amount = float(invoice.get("tax_amount", 0))
    total = float(invoice.get("total", subtotal + tax_amount))

    totals_rows = [
        [Paragraph("Subtotal", s["muted"]), Paragraph(fmt_money(subtotal, currency), s["value"])],
        [
            Paragraph(f"Tax ({tax_rate:g}%)", s["muted"]),
            Paragraph(fmt_money(tax_amount, currency), s["value"]),
        ],
        [
            Paragraph("<b>Total</b>", s["valueBold"]),
            Paragraph(f"<b>{fmt_money(total, currency)}</b>", s["valueBold"]),
        ],
    ]
    totals_table = Table(totals_rows, colWidths=[40 * mm, 40 * mm])
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("LINEABOVE", (0, 2), (-1, 2), 0.6, MIR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    wrap = Table([[Spacer(1, 1), totals_table]], colWidths=[90 * mm, 80 * mm])
    wrap.setStyle(TableStyle([("ALIGN", (1, 0), (1, 0), "RIGHT")]))
    story.append(wrap)

    if invoice.get("notes"):
        story.append(Spacer(1, 22))
        story.append(Paragraph("NOTES", s["labelCap"]))
        story.append(Spacer(1, 4))
        for line in str(invoice["notes"]).splitlines():
            story.append(Paragraph(line or "&nbsp;", s["muted"]))

    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", color=MIR_BORDER, thickness=0.4))
    story.append(Spacer(1, 8))
    story.append(Paragraph(company.get("footer", ""), s["small"]))

    doc.build(story)
    return buf.getvalue()
