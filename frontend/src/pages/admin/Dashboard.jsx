/* eslint-disable */
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
    LogOut,
    ShieldCheck,
    Inbox,
    Users,
    FileText,
    Briefcase,
    Receipt,
    KeyRound,
    UserCircle2,
    PlayCircle,
    Settings,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchStats } from "@/lib/api";
import InvoicesPanel from "./InvoicesPanel";
import TeamPanel from "./TeamPanel";
import VideosPanel from "./VideosPanel";
import SiteSettingsPanel from "./SiteSettingsPanel";
import LeadsPanel from "./LeadsPanel";
import { PostsPanel, CaseStudiesPanel } from "./PostsPanel";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { btnGhost } from "./_shared";

export default function Dashboard({ token, onLogout, onAuthExpired }) {
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
        setInvoicePrefill({ ...lead, _ts: Date.now() });
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
                                MIR <span className="text-mir-muted font-light">Admin</span>
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
                        {[
                            { v: "leads", label: "Leads", icon: Inbox },
                            { v: "insights", label: "Insights", icon: FileText },
                            { v: "case-studies", label: "Case Studies", icon: Briefcase },
                            { v: "invoices", label: "Invoices", icon: Receipt },
                            { v: "videos", label: "Videos", icon: PlayCircle },
                            { v: "team", label: "Team", icon: UserCircle2 },
                            { v: "site-settings", label: "Site", icon: Settings },
                        ].map(({ v, label, icon: Icon }) => (
                            <TabsTrigger
                                key={v}
                                value={v}
                                data-testid={`admin-tab-${v}`}
                                className="rounded-none data-[state=active]:bg-mir-midnight data-[state=active]:text-white text-mir-text px-5 py-2.5 text-sm"
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {label}
                            </TabsTrigger>
                        ))}
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

function StatsCards({ stats }) {
    const cards = [
        { label: "Total leads", value: stats?.total_leads, icon: Inbox, testId: "admin-stat-total" },
        { label: "New (unread)", value: stats?.new_leads, icon: Users, testId: "admin-stat-new" },
        { label: "Published posts", value: stats?.posts_published, icon: FileText, testId: "admin-stat-posts" },
        { label: "Outstanding invoices", value: stats?.invoices_outstanding, icon: Receipt, testId: "admin-stat-invoices" },
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
