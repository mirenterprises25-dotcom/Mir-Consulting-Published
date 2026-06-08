"""Pydantic models — all request/response shapes used across the API."""
import secrets
import uuid
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from deps import utc_now_iso


# ---------------- Leads ----------------
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


# ---------------- Admin auth ----------------
class AdminLogin(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    token: str = Field(min_length=10, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# ---------------- Posts ----------------
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


# ---------------- Case studies ----------------
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


# ---------------- Team members ----------------
class TeamMemberCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=2, max_length=160)
    role: str = Field(min_length=2, max_length=160)
    bio: str = Field(min_length=4, max_length=1200)
    photo: Optional[str] = Field(default=None, max_length=600)
    expertise: List[str] = Field(default_factory=list)
    linkedin: Optional[str] = Field(default=None, max_length=400)
    order: int = Field(default=0)


class TeamMember(TeamMemberCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# ---------------- Videos ----------------
class VideoCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = Field(min_length=3, max_length=240)
    description: str = Field(min_length=10, max_length=2000)
    youtube_url: str = Field(min_length=10, max_length=600)
    category: Optional[str] = Field(default="Video", max_length=80)
    cover_image: Optional[str] = Field(default=None, max_length=600)
    status: Literal["draft", "published"] = "draft"
    slug: Optional[str] = Field(default=None, max_length=200)


class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    description: str
    youtube_url: str
    youtube_id: Optional[str] = None
    category: Optional[str] = "Video"
    cover_image: Optional[str] = None
    status: Literal["draft", "published"] = "draft"
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)
    published_at: Optional[str] = None


# ---------------- Invoices ----------------
class InvoiceLineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    description: str = Field(min_length=1, max_length=400)
    quantity: float = Field(ge=0)
    rate: float = Field(ge=0)


class InvoiceCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    client_name: str = Field(min_length=1, max_length=160)
    client_email: Optional[EmailStr] = None
    client_company: Optional[str] = Field(default=None, max_length=160)
    client_address: Optional[str] = Field(default=None, max_length=800)
    currency: Literal["EUR", "USD", "GBP", "INR", "CHF", "JPY", "AED"] = "EUR"
    issue_date: str
    due_date: str
    line_items: List[InvoiceLineItem] = Field(min_length=1)
    tax_rate: float = Field(default=0, ge=0, le=100)
    notes: Optional[str] = Field(default=None, max_length=2000)
    status: Literal["draft", "sent", "paid", "overdue", "void"] = "draft"
    lead_id: Optional[str] = None


class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: str
    public_token: str = Field(default_factory=lambda: secrets.token_urlsafe(16))
    client_name: str
    client_email: Optional[str] = None
    client_company: Optional[str] = None
    client_address: Optional[str] = None
    currency: str = "EUR"
    issue_date: str
    due_date: str
    line_items: List[dict] = Field(default_factory=list)
    subtotal: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None
    status: Literal["draft", "sent", "paid", "overdue", "void"] = "draft"
    lead_id: Optional[str] = None
    sent_at: Optional[str] = None
    paid_at: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


class CheckoutSessionPayload(BaseModel):
    origin_url: str


# ---------------- Translation ----------------
class TranslatePayload(BaseModel):
    text: str
    target_lang: Literal["en", "de", "es"]
    source_lang: Optional[Literal["en", "de", "es", "auto"]] = "auto"


# ---------------- Site settings ----------------
class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    logo_url: Optional[str] = Field(default=None, max_length=600)
