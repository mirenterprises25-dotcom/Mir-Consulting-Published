/* eslint-disable */
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Seo from "@/lib/Seo";
import {
    Loader2,
    LogOut,
    ShieldCheck,
    Inbox,
    Users,
    ArrowLeft,
    FileText,
    Briefcase,
    Plus,
    Pencil,
    Trash2,
    Search,
    Eye,
    Save,
    Receipt,
    KeyRound,
    Download,
    UserCircle2,
    PlayCircle,
    Settings,
    Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    adminLogin,
    fetchLeads,
    fetchStats,
    updateLead,
    deleteLead,
    fetchAdminPosts,
    createPost,
    updatePost,
    deletePost,
    fetchAdminCaseStudies,
    createCaseStudy,
    updateCaseStudy,
    deleteCaseStudy,
    forgotPassword,
    changePassword,
    downloadLeadsCsv,
    adminTranslate,
} from "@/lib/api";
import InvoicesPanel from "@/pages/admin/InvoicesPanel";
import TeamPanel from "@/pages/admin/TeamPanel";
import VideosPanel from "@/pages/admin/VideosPanel";
import SiteSettingsPanel from "@/pages/admin/SiteSettingsPanel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const TOKEN_KEY = "mir_admin_token";

const LEAD_STATUSES = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
];

const statusColor = {
    new: "bg-mir-blue/10 text-mir-blue border-mir-blue/30",
    contacted: "bg-amber-50 text-amber-700 border-amber-200",
    qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    won: "bg-emerald-100 text-emerald-800 border-emerald-300",
    lost: "bg-rose-50 text-rose-700 border-rose-200",
};

const btnPrimary =
    "inline-flex items-center justify-center gap-2 bg-mir-midnight hover:bg-mir-blue disabled:opacity-60 text-white px-5 py-2.5 text-sm font-medium transition-colors";
const btnGhost =
    "inline-flex items-center justify-center gap-2 border border-mir-border hover:border-mir-blue px-4 py-2 text-sm text-mir-text bg-white transition-colors";
const inputCls =
    "bg-white border-mir-border rounded-none focus-visible:ring-mir-blue focus-visible:ring-offset-0 focus-visible:border-mir-blue text-mir-text";

export default function Admin() {
    const [token, setToken] = React.useState(
        () => localStorage.getItem(TOKEN_KEY) || ""
    );
    const [password, setPassword] = React.useState("");
    const [loggingIn, setLoggingIn] = React.useState(false);

    const onLogin = async (e) => {
        e.preventDefault();
        if (!password) return toast.error("Enter the admin password.");
        setLoggingIn(true);
        try {
            const res = await adminLogin(password);
            localStorage.setItem(TOKEN_KEY, res.token);
            setToken(res.token);
            toast.success("Welcome back.");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Invalid credentials");
        } finally {
            setLoggingIn(false);
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
    };

    if (!token) {
        return (
            <>
                <Seo title="Admin Sign In" path="/admin" noIndex />
                <LoginScreen
                    password={password}
                    setPassword={setPassword}
                    onLogin={onLogin}
                    loading={loggingIn}
                />
            </>
        );
    }

    return (
        <>
            <Seo title="Admin Dashboard" path="/admin" noIndex />
            <Dashboard token={token} onLogout={logout} onAuthExpired={logout} />
        </>
    );
}

// -------------------------------------------------------------
function LoginScreen({ password, setPassword, onLogin, loading }) {
    const [forgotOpen, setForgotOpen] = React.useState(false);
    return (
        <div
            className="min-h-screen bg-mir-surface flex items-center justify-center px-6 grain-overlay relative"
            data-testid="admin-login-page"
        >
            <div className="absolute inset-0 grid-backdrop opacity-40 [mask-image:radial-gradient(ellipse_at_center,_black_30%,_transparent_70%)] pointer-events-none" />
            <div className="absolute top-6 left-6 z-10">
                <Link
                    to="/"
                    data-testid="admin-back-home"
                    className="inline-flex items-center gap-2 text-mir-muted hover:text-mir-text text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to site
                </Link>
            </div>
            <form
                onSubmit={onLogin}
                data-testid="admin-login-form"
                className="relative border border-mir-border bg-white p-10 w-full max-w-md shadow-[0_8px_30px_0_rgba(15,23,42,0.06)]"
            >
                <div className="w-12 h-12 border border-mir-blue/30 bg-mir-blue/8 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-5 h-5 text-mir-blue" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-3">
                    MIR Consulting · Admin
                </div>
                <h1 className="font-heading text-3xl font-light tracking-tight mb-2 text-mir-text">
                    Secure Sign In
                </h1>
                <p className="text-sm text-mir-muted mb-8">
                    Restricted access. Enter the admin password to manage leads,
                    insights and case studies.
                </p>
                <div className="space-y-2 mb-3">
                    <Label
                        htmlFor="password"
                        className="text-xs uppercase tracking-[0.2em] text-mir-muted"
                    >
                        Password
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        data-testid="admin-password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        className={`${inputCls} h-12`}
                    />
                </div>
                <div className="flex justify-end mb-6">
                    <button
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        data-testid="admin-forgot-password-link"
                        className="text-xs uppercase tracking-[0.2em] text-mir-blue hover:text-mir-midnight transition-colors"
                    >
                        Forgot password?
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    data-testid="admin-login-submit"
                    className={`${btnPrimary} w-full px-6 py-3`}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Sign in
                </button>
            </form>

            <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
        </div>
    );
}

function ForgotPasswordDialog({ open, onOpenChange }) {
    const [email, setEmail] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [sent, setSent] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setEmail("");
            setSent(false);
        }
    }, [open]);

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return toast.error("Enter the admin email.");
        setSending(true);
        try {
            await forgotPassword(email.trim());
            setSent(true);
        } catch (err) {
            const msg = err?.response?.data?.detail || "Could not send reset email.";
            if (err?.response?.status === 429) {
                toast.error("Too many attempts. Wait a few minutes and try again.");
            } else {
                toast.error(typeof msg === "string" ? msg : "Could not send reset email.");
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-white border-mir-border rounded-none max-w-md"
                data-testid="admin-forgot-dialog"
            >
                <DialogHeader>
                    <DialogTitle className="font-heading text-mir-text text-2xl font-light">
                        {sent ? "Check your inbox" : "Reset your password"}
                    </DialogTitle>
                    <DialogDescription className="text-mir-muted">
                        {sent
                            ? "If that email matches the admin account, we just sent a reset link. It expires in 15 minutes and can only be used once."
                            : "Enter the admin email. We'll send a one-time reset link there."}
                    </DialogDescription>
                </DialogHeader>

                {!sent ? (
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                Admin email
                            </Label>
                            <Input
                                type="email"
                                data-testid="admin-forgot-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className={`${inputCls} h-11`}
                                autoFocus
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className={btnGhost}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={sending}
                                data-testid="admin-forgot-submit"
                                className={btnPrimary}
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Send reset link
                            </button>
                        </DialogFooter>
                    </form>
                ) : (
                    <DialogFooter>
                        <button
                            onClick={() => onOpenChange(false)}
                            data-testid="admin-forgot-close"
                            className={btnPrimary}
                        >
                            Got it
                        </button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

// -------------------------------------------------------------
function Dashboard({ token, onLogout, onAuthExpired }) {
    const [stats, setStats] = React.useState(null);
    const [tab, setTab] = React.useState("leads");
    const [invoicePrefill, setInvoicePrefill] = React.useState(null);
    const [changeOpen, setChangeOpen] = React.useState(false);

    const loadStats = React.useCallback(async () => {
        try {
            const s = await fetchStats(token);
            setStats(s);
        } catch (e) {
            if (e?.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
                onAuthExpired();
            }
        }
    }, [token, onAuthExpired]);

    React.useEffect(() => {
        loadStats();
    }, [loadStats]);

    const triggerInvoiceFromLead = (lead) => {
        setInvoicePrefill({ ...lead, _ts: Date.now() }); // _ts forces re-trigger
        setTab("invoices");
    };

    return (
        <div className="min-h-screen bg-mir-surface" data-testid="admin-dashboard-page">
            <header className="border-b border-mir-border bg-white/85 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 border border-mir-blue/30 bg-mir-blue/8 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-mir-blue" />
                        </div>
                        <div>
                            <div className="font-heading text-lg tracking-tight text-mir-text">
                                MIR{" "}
                                <span className="text-mir-muted font-light">Admin</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-mir-blue">
                                Content & Leads Console
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            data-testid="admin-link-home"
                            className="text-sm text-mir-muted hover:text-mir-text"
                        >
                            View site
                        </Link>
                        <button
                            onClick={() => setChangeOpen(true)}
                            data-testid="admin-change-password-button"
                            className={btnGhost}
                        >
                            <KeyRound className="w-4 h-4" />
                            Change password
                        </button>
                        <button
                            onClick={onLogout}
                            data-testid="admin-logout-button"
                            className={btnGhost}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <StatsCards stats={stats} />

                <Tabs value={tab} onValueChange={setTab} className="mt-10">
                    <TabsList className="bg-white border border-mir-border rounded-none p-1 h-auto flex-wrap">
                        <TabsTrigger
                            value="leads"
                            data-testid="admin-tab-leads"
                            className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                        >
                            <Inbox className="w-4 h-4 mr-2" />
                            Leads
                        </TabsTrigger>
                        <TabsTrigger
                            value="insights"
                            data-testid="admin-tab-insights"
                            className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Insights
                        </TabsTrigger>
                        <TabsTrigger
                            value="case-studies"
                            data-testid="admin-tab-case-studies"
                            className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                        >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Case Studies
                        </TabsTrigger>
                        <TabsTrigger
                            value="invoices"
                            data-testid="admin-tab-invoices"
                            className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Invoices
                        </TabsTrigger>
                        <TabsTrigger
                            value="videos"
                            data-testid="admin-tab-videos"
                            className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                        >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Videos
                        </TabsTrigger>
                        <TabsTrigger
                            value="team"
                            data-testid="admin-tab-team"
                            className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                        >
                            <UserCircle2 className="w-4 h-4 mr-2" />
                            Team
                        </TabsTrigger>
                        <TabsTrigger
                            value="site-settings"
                            data-testid="admin-tab-site-settings"
                            className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Site
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="leads" className="mt-6">
                        <LeadsPanel
                            token={token}
                            onAuthExpired={onAuthExpired}
                            onChange={loadStats}
                            onCreateInvoice={triggerInvoiceFromLead}
                        />
                    </TabsContent>
                    <TabsContent value="insights" className="mt-6">
                        <PostsPanel
                            token={token}
                            onAuthExpired={onAuthExpired}
                            onChange={loadStats}
                        />
                    </TabsContent>
                    <TabsContent value="case-studies" className="mt-6">
                        <CaseStudiesPanel
                            token={token}
                            onAuthExpired={onAuthExpired}
                            onChange={loadStats}
                        />
                    </TabsContent>
                    <TabsContent value="invoices" className="mt-6">
                        <InvoicesPanel
                            token={token}
                            onAuthExpired={onAuthExpired}
                            onChange={loadStats}
                            prefillLead={invoicePrefill}
                        />
                    </TabsContent>
                    <TabsContent value="videos" className="mt-6">
                        <VideosPanel token={token} onAuthExpired={onAuthExpired} onChange={loadStats} />
                    </TabsContent>
                    <TabsContent value="team" className="mt-6">
                        <TeamPanel token={token} onAuthExpired={onAuthExpired} onChange={loadStats} />
                    </TabsContent>
                    <TabsContent value="site-settings" className="mt-6">
                        <SiteSettingsPanel token={token} onAuthExpired={onAuthExpired} />
                    </TabsContent>
                </Tabs>
            </main>

            <ChangePasswordDialog
                open={changeOpen}
                onOpenChange={setChangeOpen}
                token={token}
                onAuthExpired={onAuthExpired}
            />
        </div>
    );
}

// -------------------------------------------------------------
function StatsCards({ stats }) {
    const cards = [
        {
            label: "Total leads",
            value: stats?.total_leads,
            icon: Inbox,
            testId: "admin-stat-total",
        },
        {
            label: "New (unread)",
            value: stats?.new_leads,
            icon: Users,
            testId: "admin-stat-new",
        },
        {
            label: "Published posts",
            value: stats?.posts_published,
            icon: FileText,
            testId: "admin-stat-posts",
        },
        {
            label: "Outstanding invoices",
            value: stats?.invoices_outstanding,
            icon: Receipt,
            testId: "admin-stat-invoices",
        },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className="border border-mir-border bg-white p-6"
                    data-testid={c.testId}
                >
                    <div className="flex items-center gap-3 text-mir-muted text-xs uppercase tracking-[0.2em] mb-3">
                        <c.icon className="w-4 h-4 text-mir-blue" />
                        {c.label}
                    </div>
                    <div className="font-heading text-3xl text-mir-text">
                        {c.value ?? "—"}
                    </div>
                </div>
            ))}
        </div>
    );
}

// -------------------------------------------------------------
function LeadsPanel({ token, onAuthExpired, onChange, onCreateInvoice }) {
    const [leads, setLeads] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [q, setQ] = React.useState("");
    const [active, setActive] = React.useState(null);
    const [confirmDel, setConfirmDel] = React.useState(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (q.trim()) params.q = q.trim();
            const data = await fetchLeads(token, params);
            setLeads(data);
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Failed to load leads.");
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter, q, onAuthExpired]);

    React.useEffect(() => {
        const t = setTimeout(load, q ? 300 : 0);
        return () => clearTimeout(t);
    }, [load, q]);

    const changeStatus = async (lead, status) => {
        try {
            const updated = await updateLead(token, lead.id, { status });
            setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
            if (active?.id === lead.id) setActive(updated);
            toast.success(`Status updated to ${status}.`);
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Could not update status.");
        }
    };

    const saveNotes = async (lead, notes) => {
        try {
            const updated = await updateLead(token, lead.id, { notes });
            setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
            setActive(updated);
            toast.success("Notes saved.");
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Could not save notes.");
        }
    };

    const doDelete = async (id) => {
        try {
            await deleteLead(token, id);
            setLeads((prev) => prev.filter((l) => l.id !== id));
            if (active?.id === id) setActive(null);
            toast.success("Lead deleted.");
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Could not delete.");
        } finally {
            setConfirmDel(null);
        }
    };

    return (
        <div className="border border-mir-border bg-white">
            <div className="px-6 py-5 border-b border-mir-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="font-heading text-xl tracking-tight text-mir-text">
                        Consultation Requests
                    </div>
                    <div className="text-xs text-mir-muted mt-1">
                        {loading ? "Loading..." : `${leads.length} entries`}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mir-muted pointer-events-none" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search name, email, company..."
                            data-testid="admin-leads-search"
                            className={`${inputCls} h-10 pl-9 w-full sm:w-72`}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger
                            data-testid="admin-leads-status-filter"
                            className={`${inputCls} h-10 w-full sm:w-44`}
                        >
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-mir-border rounded-none">
                            <SelectItem value="all">All statuses</SelectItem>
                            {LEAD_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <button
                        onClick={load}
                        data-testid="admin-refresh-button"
                        className={btnGhost}
                    >
                        Refresh
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                await downloadLeadsCsv(token);
                                toast.success("CSV downloaded.");
                            } catch (e) {
                                if (e?.response?.status === 401) onAuthExpired?.();
                                else toast.error("Export failed.");
                            }
                        }}
                        data-testid="admin-leads-export-csv"
                        className={btnGhost}
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5 inline" /> CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table data-testid="admin-leads-table">
                    <TableHeader>
                        <TableRow className="border-mir-border hover:bg-transparent">
                            {[
                                "Date",
                                "Name",
                                "Email",
                                "Company",
                                "Status",
                                "Actions",
                            ].map((h) => (
                                <TableHead
                                    key={h}
                                    className="text-mir-muted uppercase text-[10px] tracking-[0.2em]"
                                >
                                    {h}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.length === 0 && !loading && (
                            <TableRow className="border-mir-border hover:bg-transparent">
                                <TableCell
                                    colSpan={6}
                                    className="text-center text-mir-muted py-12"
                                >
                                    No consultation requests match the current filters.
                                </TableCell>
                            </TableRow>
                        )}
                        {leads.map((l) => (
                            <TableRow
                                key={l.id}
                                data-testid={`admin-lead-row-${l.id}`}
                                className="border-mir-border hover:bg-mir-surface"
                            >
                                <TableCell className="text-xs text-mir-muted whitespace-nowrap">
                                    {new Date(l.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm text-mir-text">
                                    {l.full_name}
                                </TableCell>
                                <TableCell className="text-sm text-mir-text">
                                    <a
                                        href={`mailto:${l.email}`}
                                        className="hover:text-mir-blue"
                                    >
                                        {l.email}
                                    </a>
                                </TableCell>
                                <TableCell className="text-sm text-mir-textSoft">
                                    {l.company || "—"}
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={l.status}
                                        onValueChange={(v) => changeStatus(l, v)}
                                    >
                                        <SelectTrigger
                                            data-testid={`admin-lead-status-${l.id}`}
                                            className={`h-8 rounded-none text-xs px-3 border ${statusColor[l.status] || ""}`}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-mir-border rounded-none">
                                            {LEAD_STATUSES.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActive(l)}
                                            data-testid={`admin-lead-view-${l.id}`}
                                            className={`${btnGhost} px-3 py-1.5 text-xs`}
                                            title="View"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDel(l)}
                                            data-testid={`admin-lead-delete-${l.id}`}
                                            className={`${btnGhost} px-3 py-1.5 text-xs hover:border-rose-400 hover:text-rose-600`}
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <LeadDrawer
                lead={active}
                onClose={() => setActive(null)}
                onChangeStatus={changeStatus}
                onSaveNotes={saveNotes}
                onCreateInvoice={onCreateInvoice}
            />

            <ConfirmDialog
                open={!!confirmDel}
                onOpenChange={(v) => !v && setConfirmDel(null)}
                title="Delete this lead?"
                desc={
                    confirmDel
                        ? `This will permanently delete ${confirmDel.full_name}'s consultation request.`
                        : ""
                }
                confirmTestId="admin-lead-delete-confirm"
                onConfirm={() => confirmDel && doDelete(confirmDel.id)}
            />
        </div>
    );
}

// -------------------------------------------------------------
function LeadDrawer({ lead, onClose, onChangeStatus, onSaveNotes, onCreateInvoice }) {
    const [notes, setNotes] = React.useState("");
    React.useEffect(() => {
        setNotes(lead?.notes || "");
    }, [lead]);

    return (
        <Sheet open={!!lead} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                data-testid="admin-lead-drawer"
                className="bg-white border-l-mir-border w-full sm:max-w-xl overflow-y-auto"
            >
                {lead && (
                    <>
                        <SheetHeader>
                            <SheetTitle className="font-heading text-2xl text-mir-text">
                                {lead.full_name}
                            </SheetTitle>
                            <SheetDescription className="text-mir-muted">
                                <a
                                    href={`mailto:${lead.email}`}
                                    className="hover:text-mir-blue"
                                >
                                    {lead.email}
                                </a>
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                            <Meta label="Company" value={lead.company} />
                            <Meta label="Phone" value={lead.phone} />
                            <Meta label="Industry" value={lead.industry} />
                            <Meta label="Service" value={lead.service_interest} />
                            <Meta
                                label="Received"
                                value={new Date(lead.created_at).toLocaleString()}
                            />
                            <Meta
                                label="Updated"
                                value={new Date(lead.updated_at).toLocaleString()}
                            />
                        </div>

                        <div className="mt-6">
                            <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                Status
                            </Label>
                            <Select
                                value={lead.status}
                                onValueChange={(v) => onChangeStatus(lead, v)}
                            >
                                <SelectTrigger
                                    data-testid="admin-drawer-status"
                                    className={`${inputCls} h-10 mt-2 w-48`}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-mir-border rounded-none">
                                    {LEAD_STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-6">
                            <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                Message
                            </Label>
                            <div
                                className="mt-2 border border-mir-border bg-mir-surface p-4 text-sm text-mir-text whitespace-pre-wrap"
                                data-testid="admin-drawer-message"
                            >
                                {lead.message}
                            </div>
                        </div>

                        <div className="mt-6">
                            <Label
                                htmlFor="admin-lead-notes"
                                className="text-xs uppercase tracking-[0.2em] text-mir-muted"
                            >
                                Internal notes
                            </Label>
                            <Textarea
                                id="admin-lead-notes"
                                data-testid="admin-drawer-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={5}
                                placeholder="Capture internal context, follow-ups, next steps..."
                                className={`${inputCls} mt-2`}
                            />
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                <button
                                    onClick={() => onSaveNotes(lead, notes)}
                                    data-testid="admin-drawer-save-notes"
                                    className={btnPrimary}
                                >
                                    <Save className="w-4 h-4" />
                                    Save notes
                                </button>
                                {onCreateInvoice && (
                                    <button
                                        onClick={() => {
                                            onCreateInvoice(lead);
                                            onClose();
                                        }}
                                        data-testid="admin-drawer-create-invoice"
                                        className={btnGhost}
                                    >
                                        <Receipt className="w-4 h-4" />
                                        Create invoice for this lead
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

function Meta({ label, value }) {
    return (
        <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-mir-muted">
                {label}
            </div>
            <div className="text-mir-text mt-1">{value || "—"}</div>
        </div>
    );
}

// -------------------------------------------------------------
function ConfirmDialog({ open, onOpenChange, title, desc, onConfirm, confirmTestId }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-white border-mir-border rounded-none">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading text-mir-text">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-mir-muted">
                        {desc}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none border-mir-border">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        data-testid={confirmTestId}
                        onClick={onConfirm}
                        className="rounded-none bg-rose-600 hover:bg-rose-700 text-white"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// -------------------------------------------------------------
const EMPTY_POST = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    cover_image: "",
    read_time: "",
    status: "draft",
};

function PostsPanel({ token, onAuthExpired, onChange }) {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [editing, setEditing] = React.useState(null); // null | "new" | item
    const [confirmDel, setConfirmDel] = React.useState(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            setItems(await fetchAdminPosts(token));
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    }, [token, onAuthExpired]);

    React.useEffect(() => {
        load();
    }, [load]);

    const onSave = async (payload, id) => {
        try {
            if (id) {
                const updated = await updatePost(token, id, payload);
                setItems((p) => p.map((x) => (x.id === id ? updated : x)));
                toast.success("Post updated.");
            } else {
                const created = await createPost(token, payload);
                setItems((p) => [created, ...p]);
                toast.success("Post created.");
            }
            setEditing(null);
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else {
                const msg =
                    e?.response?.data?.detail?.[0]?.msg ||
                    e?.response?.data?.detail ||
                    "Save failed.";
                toast.error(typeof msg === "string" ? msg : "Save failed.");
            }
        }
    };

    const doDelete = async (id) => {
        try {
            await deletePost(token, id);
            setItems((p) => p.filter((x) => x.id !== id));
            toast.success("Post deleted.");
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Delete failed.");
        } finally {
            setConfirmDel(null);
        }
    };

    if (editing) {
        return (
            <PostEditor
                token={token}
                initial={editing === "new" ? EMPTY_POST : editing}
                kind="post"
                onCancel={() => setEditing(null)}
                onSave={(payload) =>
                    onSave(payload, editing === "new" ? null : editing.id)
                }
            />
        );
    }

    return (
        <ContentList
            title="Insights"
            testIdPrefix="post"
            items={items}
            loading={loading}
            columns={["Title", "Category", "Status", "Updated", "Actions"]}
            renderRow={(it) => [
                it.title,
                it.category,
                <StatusPill key="s" status={it.status} />,
                new Date(it.updated_at).toLocaleDateString(),
            ]}
            onNew={() => setEditing("new")}
            onEdit={(it) => setEditing(it)}
            onDelete={(it) => setConfirmDel(it)}
            confirmDel={confirmDel}
            setConfirmDel={setConfirmDel}
            doDelete={doDelete}
        />
    );
}

// -------------------------------------------------------------
const EMPTY_CS = {
    title: "",
    slug: "",
    sector: "",
    summary: "",
    content: "",
    cover_image: "",
    client_name: "",
    outcomes: [],
    status: "draft",
};

function CaseStudiesPanel({ token, onAuthExpired, onChange }) {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [confirmDel, setConfirmDel] = React.useState(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            setItems(await fetchAdminCaseStudies(token));
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Failed to load case studies.");
        } finally {
            setLoading(false);
        }
    }, [token, onAuthExpired]);

    React.useEffect(() => {
        load();
    }, [load]);

    const onSave = async (payload, id) => {
        try {
            if (id) {
                const updated = await updateCaseStudy(token, id, payload);
                setItems((p) => p.map((x) => (x.id === id ? updated : x)));
                toast.success("Case study updated.");
            } else {
                const created = await createCaseStudy(token, payload);
                setItems((p) => [created, ...p]);
                toast.success("Case study created.");
            }
            setEditing(null);
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else {
                const msg =
                    e?.response?.data?.detail?.[0]?.msg ||
                    e?.response?.data?.detail ||
                    "Save failed.";
                toast.error(typeof msg === "string" ? msg : "Save failed.");
            }
        }
    };

    const doDelete = async (id) => {
        try {
            await deleteCaseStudy(token, id);
            setItems((p) => p.filter((x) => x.id !== id));
            toast.success("Case study deleted.");
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Delete failed.");
        } finally {
            setConfirmDel(null);
        }
    };

    if (editing) {
        return (
            <PostEditor
                token={token}
                initial={editing === "new" ? EMPTY_CS : editing}
                kind="case_study"
                onCancel={() => setEditing(null)}
                onSave={(payload) =>
                    onSave(payload, editing === "new" ? null : editing.id)
                }
            />
        );
    }

    return (
        <ContentList
            title="Case Studies"
            testIdPrefix="case-study"
            items={items}
            loading={loading}
            columns={["Title", "Sector", "Status", "Updated", "Actions"]}
            renderRow={(it) => [
                it.title,
                it.sector,
                <StatusPill key="s" status={it.status} />,
                new Date(it.updated_at).toLocaleDateString(),
            ]}
            onNew={() => setEditing("new")}
            onEdit={(it) => setEditing(it)}
            onDelete={(it) => setConfirmDel(it)}
            confirmDel={confirmDel}
            setConfirmDel={setConfirmDel}
            doDelete={doDelete}
        />
    );
}

// -------------------------------------------------------------
function StatusPill({ status }) {
    const cls =
        status === "published"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200";
    return (
        <Badge
            className={`${cls} rounded-none border uppercase text-[10px] tracking-[0.18em]`}
        >
            {status}
        </Badge>
    );
}

function ContentList({
    title,
    singular,
    testIdPrefix,
    items,
    loading,
    columns,
    renderRow,
    onNew,
    onEdit,
    onDelete,
    confirmDel,
    setConfirmDel,
    doDelete,
}) {
    const newLabel = (
        singular ||
        (title.toLowerCase().endsWith("ies")
            ? title.slice(0, -3).toLowerCase() + "y"
            : title.replace(/s$/i, "").toLowerCase())
    );
    return (
        <div className="border border-mir-border bg-white">
            <div className="px-6 py-5 border-b border-mir-border flex items-center justify-between">
                <div>
                    <div className="font-heading text-xl tracking-tight text-mir-text">
                        {title}
                    </div>
                    <div className="text-xs text-mir-muted mt-1">
                        {loading ? "Loading..." : `${items.length} entries`}
                    </div>
                </div>
                <button
                    onClick={onNew}
                    data-testid={`admin-${testIdPrefix}-new`}
                    className={btnPrimary}
                >
                    <Plus className="w-4 h-4" />
                    New {newLabel}
                </button>
            </div>

            <div className="overflow-x-auto">
                <Table data-testid={`admin-${testIdPrefix}-table`}>
                    <TableHeader>
                        <TableRow className="border-mir-border hover:bg-transparent">
                            {columns.map((h) => (
                                <TableHead
                                    key={h}
                                    className="text-mir-muted uppercase text-[10px] tracking-[0.2em]"
                                >
                                    {h}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && !loading && (
                            <TableRow className="border-mir-border hover:bg-transparent">
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center text-mir-muted py-12"
                                >
                                    No {title.toLowerCase()} yet. Create your first one.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((it) => {
                            const cells = renderRow(it);
                            return (
                                <TableRow
                                    key={it.id}
                                    data-testid={`admin-${testIdPrefix}-row-${it.id}`}
                                    className="border-mir-border hover:bg-mir-surface"
                                >
                                    {cells.map((c, i) => (
                                        <TableCell
                                            key={i}
                                            className="text-sm text-mir-text"
                                        >
                                            {c}
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onEdit(it)}
                                                data-testid={`admin-${testIdPrefix}-edit-${it.id}`}
                                                className={`${btnGhost} px-3 py-1.5 text-xs`}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(it)}
                                                data-testid={`admin-${testIdPrefix}-delete-${it.id}`}
                                                className={`${btnGhost} px-3 py-1.5 text-xs hover:border-rose-400 hover:text-rose-600`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={!!confirmDel}
                onOpenChange={(v) => !v && setConfirmDel(null)}
                title={`Delete this ${title.slice(0, -1).toLowerCase()}?`}
                desc={
                    confirmDel
                        ? `"${confirmDel.title}" will be permanently removed.`
                        : ""
                }
                confirmTestId={`admin-${testIdPrefix}-delete-confirm`}
                onConfirm={() => confirmDel && doDelete(confirmDel.id)}
            />
        </div>
    );
}

// -------------------------------------------------------------
function PostEditor({ token, initial, kind, onCancel, onSave }) {
    const [form, setForm] = React.useState(() => ({
        ...initial,
        outcomes_text:
            kind === "case_study"
                ? (initial.outcomes || []).join("\n")
                : "",
    }));
    const [saving, setSaving] = React.useState(false);
    const [translating, setTranslating] = React.useState(false);
    const isCS = kind === "case_study";
    const isEdit = !!initial.id;

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const translateAll = async (targetLang) => {
        if (translating) return;
        setTranslating(true);
        const t = toast.loading(`Translating to ${targetLang.toUpperCase()}…`);
        try {
            const fields = isCS
                ? ["title", "sector", "summary", "content"]
                : ["title", "category", "excerpt", "content"];
            const out = {};
            for (const f of fields) {
                const v = (form[f] || "").trim();
                if (!v) continue;
                // eslint-disable-next-line no-await-in-loop
                const { translated } = await adminTranslate(token, v, targetLang, "auto");
                out[f] = translated;
            }
            setForm((p) => ({ ...p, ...out }));
            toast.success(`Translated to ${targetLang.toUpperCase()}. Review and save as a new article.`, { id: t });
        } catch (e) {
            const msg = e?.response?.data?.detail || "Translation failed.";
            toast.error(typeof msg === "string" ? msg : "Translation failed.", { id: t });
        } finally {
            setTranslating(false);
        }
    };

    const submit = async (status) => {
        const base = {
            title: form.title.trim(),
            slug: form.slug?.trim() || undefined,
            content: form.content,
            cover_image: form.cover_image?.trim() || undefined,
            status,
        };
        const payload = isCS
            ? {
                  ...base,
                  sector: form.sector.trim(),
                  summary: form.summary.trim(),
                  client_name: form.client_name?.trim() || undefined,
                  outcomes: (form.outcomes_text || "")
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
              }
            : {
                  ...base,
                  category: form.category.trim(),
                  excerpt: form.excerpt.trim(),
                  read_time: form.read_time?.trim() || undefined,
              };

        if (!payload.title || payload.title.length < 3) {
            toast.error("Title is required (min 3 chars).");
            return;
        }
        if (isCS) {
            if (!payload.sector) return toast.error("Sector is required.");
            if (!payload.summary || payload.summary.length < 10)
                return toast.error("Summary must be at least 10 chars.");
        } else {
            if (!payload.category) return toast.error("Category is required.");
            if (!payload.excerpt || payload.excerpt.length < 10)
                return toast.error("Excerpt must be at least 10 chars.");
        }
        if (!payload.content || payload.content.length < 10) {
            return toast.error("Content must be at least 10 chars.");
        }

        setSaving(true);
        try {
            await onSave(payload);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="border border-mir-border bg-white"
            data-testid={`admin-${isCS ? "case-study" : "post"}-editor`}
        >
            <div className="px-6 py-5 border-b border-mir-border flex items-center justify-between">
                <div>
                    <div className="font-heading text-xl tracking-tight text-mir-text">
                        {isEdit ? "Edit" : "New"}{" "}
                        {isCS ? "case study" : "insight"}
                    </div>
                    <div className="text-xs text-mir-muted mt-1">
                        Markdown supported. Live preview on the right.
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        data-testid="admin-editor-cancel"
                        className={btnGhost}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => submit("draft")}
                        disabled={saving}
                        data-testid="admin-editor-save-draft"
                        className={btnGhost}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save draft
                    </button>
                    <button
                        onClick={() => submit("published")}
                        disabled={saving}
                        data-testid="admin-editor-publish"
                        className={btnPrimary}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Publish
                    </button>
                </div>
            </div>

            <div
                className="px-6 py-3 border-b border-mir-border bg-mir-surface flex items-center gap-3 flex-wrap"
                data-testid="admin-editor-translate-bar"
            >
                <Sparkles className="w-4 h-4 text-mir-blue" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-mir-muted">
                    AI translate this article to
                </span>
                <button
                    type="button"
                    onClick={() => translateAll("de")}
                    disabled={translating}
                    data-testid="admin-editor-translate-de"
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-mir-border bg-white text-[11px] uppercase tracking-[0.2em] hover:border-mir-blue hover:text-mir-blue transition-colors disabled:opacity-50"
                >
                    {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Deutsch (DE)
                </button>
                <button
                    type="button"
                    onClick={() => translateAll("es")}
                    disabled={translating}
                    data-testid="admin-editor-translate-es"
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-mir-border bg-white text-[11px] uppercase tracking-[0.2em] hover:border-mir-blue hover:text-mir-blue transition-colors disabled:opacity-50"
                >
                    {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Español (ES)
                </button>
                <button
                    type="button"
                    onClick={() => translateAll("en")}
                    disabled={translating}
                    data-testid="admin-editor-translate-en"
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-mir-border bg-white text-[11px] uppercase tracking-[0.2em] hover:border-mir-blue hover:text-mir-blue transition-colors disabled:opacity-50"
                >
                    {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    English (EN)
                </button>
                <span className="text-[10px] text-mir-muted ml-2">
                    Tip: translate then change the slug and save as a new article.
                </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Field label="Title *">
                        <Input
                            data-testid="admin-editor-title"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            className={`${inputCls} h-11`}
                        />
                    </Field>

                    <Field label="Slug (optional — auto-generated)">
                        <Input
                            data-testid="admin-editor-slug"
                            value={form.slug || ""}
                            onChange={(e) => set("slug", e.target.value)}
                            placeholder="my-article-slug"
                            className={`${inputCls} h-11`}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label={isCS ? "Sector *" : "Category *"}>
                            <Input
                                data-testid="admin-editor-category"
                                value={isCS ? form.sector : form.category}
                                onChange={(e) =>
                                    set(isCS ? "sector" : "category", e.target.value)
                                }
                                className={`${inputCls} h-11`}
                            />
                        </Field>
                        {!isCS && (
                            <Field label="Read time">
                                <Input
                                    data-testid="admin-editor-read-time"
                                    value={form.read_time || ""}
                                    onChange={(e) => set("read_time", e.target.value)}
                                    placeholder="6 min read"
                                    className={`${inputCls} h-11`}
                                />
                            </Field>
                        )}
                        {isCS && (
                            <Field label="Client name">
                                <Input
                                    data-testid="admin-editor-client"
                                    value={form.client_name || ""}
                                    onChange={(e) =>
                                        set("client_name", e.target.value)
                                    }
                                    className={`${inputCls} h-11`}
                                />
                            </Field>
                        )}
                    </div>

                    <Field
                        label={isCS ? "Summary * (10+ chars)" : "Excerpt * (10+ chars)"}
                    >
                        <Textarea
                            data-testid="admin-editor-excerpt"
                            value={isCS ? form.summary : form.excerpt}
                            onChange={(e) =>
                                set(isCS ? "summary" : "excerpt", e.target.value)
                            }
                            rows={3}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Cover image URL">
                        <Input
                            data-testid="admin-editor-cover"
                            value={form.cover_image || ""}
                            onChange={(e) => set("cover_image", e.target.value)}
                            placeholder="https://..."
                            className={`${inputCls} h-11`}
                        />
                    </Field>

                    {isCS && (
                        <Field label="Outcomes (one per line)">
                            <Textarea
                                data-testid="admin-editor-outcomes"
                                value={form.outcomes_text}
                                onChange={(e) => set("outcomes_text", e.target.value)}
                                rows={4}
                                placeholder="Reduced operational overhead by 32%&#10;Unified 12 properties into one dashboard"
                                className={inputCls}
                            />
                        </Field>
                    )}

                    <Field label="Content * (Markdown)">
                        <Textarea
                            data-testid="admin-editor-content"
                            value={form.content}
                            onChange={(e) => set("content", e.target.value)}
                            rows={18}
                            placeholder={`## Heading\n\nWrite your **content** here using markdown...`}
                            className={`${inputCls} font-mono text-sm`}
                        />
                    </Field>
                </div>

                <div className="space-y-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                        Live preview
                    </div>
                    <div
                        className="border border-mir-border bg-mir-surface p-6 min-h-[400px]"
                        data-testid="admin-editor-preview"
                    >
                        {form.cover_image && (
                            <img
                                src={form.cover_image}
                                alt=""
                                className="w-full h-44 object-cover border border-mir-border mb-6"
                            />
                        )}
                        <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-3">
                            {isCS ? form.sector : form.category || "—"}
                        </div>
                        <h1 className="font-heading text-3xl font-light tracking-tight text-mir-text leading-tight">
                            {form.title || "Untitled"}
                        </h1>
                        <p className="mt-4 text-mir-muted text-sm leading-relaxed">
                            {isCS ? form.summary : form.excerpt}
                        </p>
                        {isCS && form.outcomes_text && (
                            <ul className="mt-5 space-y-2">
                                {form.outcomes_text
                                    .split("\n")
                                    .map((o) => o.trim())
                                    .filter(Boolean)
                                    .map((o, i) => (
                                        <li
                                            key={i}
                                            className="text-sm text-mir-textSoft flex items-start gap-2"
                                        >
                                            <span className="text-mir-blue">›</span> {o}
                                        </li>
                                    ))}
                            </ul>
                        )}
                        <div className="divider-line-soft my-6" />
                        <div
                            className="prose prose-slate max-w-none
                                prose-headings:font-heading prose-headings:text-mir-text
                                prose-p:text-mir-textSoft prose-p:leading-relaxed
                                prose-a:text-mir-blue
                                prose-strong:text-mir-text
                                prose-code:text-mir-blueInk prose-code:bg-white prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {form.content || "_Start typing content..._"}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                {label}
            </Label>
            {children}
        </div>
    );
}

// -------------------------------------------------------------
function ChangePasswordDialog({ open, onOpenChange, token, onAuthExpired }) {
    const [current, setCurrent] = React.useState("");
    const [next, setNext] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setCurrent("");
            setNext("");
            setConfirm("");
        }
    }, [open]);

    const submit = async (e) => {
        e.preventDefault();
        if (!current) return toast.error("Enter your current password.");
        if (next.length < 8) return toast.error("New password must be at least 8 characters.");
        if (next !== confirm) return toast.error("Passwords do not match.");
        if (next === current) return toast.error("New password must differ from the current one.");
        setSaving(true);
        try {
            await changePassword(token, current, next);
            toast.success("Password updated.");
            onOpenChange(false);
        } catch (err) {
            if (err?.response?.status === 401 && err?.response?.data?.detail?.toLowerCase?.()?.includes("current")) {
                toast.error("Current password is incorrect.");
            } else if (err?.response?.status === 401) {
                toast.error("Session expired. Please sign in again.");
                onAuthExpired();
            } else {
                const msg = err?.response?.data?.detail || "Could not update password.";
                toast.error(typeof msg === "string" ? msg : "Could not update password.");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-white border-mir-border rounded-none max-w-md"
                data-testid="admin-change-password-dialog"
            >
                <DialogHeader>
                    <DialogTitle className="font-heading text-mir-text text-2xl font-light">
                        Change password
                    </DialogTitle>
                    <DialogDescription className="text-mir-muted">
                        Pick a new strong password. Minimum 8 characters.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                            Current password
                        </Label>
                        <Input
                            type="password"
                            data-testid="admin-change-current"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className={`${inputCls} h-11`}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                            New password
                        </Label>
                        <Input
                            type="password"
                            data-testid="admin-change-new"
                            value={next}
                            onChange={(e) => setNext(e.target.value)}
                            className={`${inputCls} h-11`}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                            Confirm new password
                        </Label>
                        <Input
                            type="password"
                            data-testid="admin-change-confirm"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className={`${inputCls} h-11`}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className={btnGhost}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            data-testid="admin-change-submit"
                            className={btnPrimary}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Update password
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

