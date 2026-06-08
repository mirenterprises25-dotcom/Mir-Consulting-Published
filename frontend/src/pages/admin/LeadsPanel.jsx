/* eslint-disable */
import React from "react";
import { toast } from "sonner";
import {
    Inbox,
    Eye,
    Trash2,
    Search,
    Save,
    Receipt,
    Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    fetchLeads,
    updateLead,
    deleteLead,
    downloadLeadsCsv,
} from "@/lib/api";
import { LEAD_STATUSES, btnGhost, btnPrimary, inputCls, statusColor } from "./_shared";
import ConfirmDialog from "./ConfirmDialog";

export default function LeadsPanel({ token, onAuthExpired, onChange, onCreateInvoice }) {
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
                            {["Date", "Name", "Email", "Company", "Status", "Actions"].map((h) => (
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
