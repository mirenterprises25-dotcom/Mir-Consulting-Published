/* eslint-disable */
import React from "react";
import { toast } from "sonner";
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Search,
    Download,
    Send,
    Link as LinkIcon,
    X,
    Save,
    FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    fetchAdminInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoiceEmail,
    downloadInvoicePdf,
    publicInvoiceUrl,
    fetchEmailStatus,
} from "@/lib/api";

const CURRENCIES = [
    { code: "EUR", symbol: "€" },
    { code: "USD", symbol: "$" },
    { code: "GBP", symbol: "£" },
    { code: "CHF", symbol: "CHF " },
    { code: "INR", symbol: "₹" },
    { code: "JPY", symbol: "¥" },
    { code: "AED", symbol: "AED " },
];

const STATUSES = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
    { value: "void", label: "Void" },
];

const statusBadge = {
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    sent: "bg-mir-blue/10 text-mir-blue border-mir-blue/30",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    overdue: "bg-rose-50 text-rose-700 border-rose-200",
    void: "bg-slate-100 text-slate-600 border-slate-200",
};

const btnPrimary =
    "inline-flex items-center justify-center gap-2 bg-mir-midnight hover:bg-mir-blue disabled:opacity-60 text-white px-5 py-2.5 text-sm font-medium transition-colors";
const btnGhost =
    "inline-flex items-center justify-center gap-2 border border-mir-border hover:border-mir-blue px-4 py-2 text-sm text-mir-text bg-white transition-colors";
const inputCls =
    "bg-white border-mir-border rounded-none focus-visible:ring-mir-blue focus-visible:ring-offset-0 focus-visible:border-mir-blue text-mir-text";

const fmt = (n, currency) => {
    const c = CURRENCIES.find((x) => x.code === currency) || CURRENCIES[0];
    return `${c.symbol}${Number(n || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, days) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

const EMPTY = (preset = {}) => ({
    client_name: "",
    client_email: "",
    client_company: "",
    client_address: "",
    currency: "EUR",
    issue_date: today(),
    due_date: addDays(today(), 14),
    tax_rate: 0,
    notes: "",
    status: "draft",
    lead_id: null,
    line_items: [{ description: "", quantity: 1, rate: 0 }],
    ...preset,
});

export default function InvoicesPanel({ token, onAuthExpired, onChange, prefillLead }) {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [q, setQ] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [editing, setEditing] = React.useState(null);
    const [confirmDel, setConfirmDel] = React.useState(null);
    const [smtp, setSmtp] = React.useState(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (q.trim()) params.q = q.trim();
            setItems(await fetchAdminInvoices(token, params));
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Failed to load invoices.");
        } finally {
            setLoading(false);
        }
    }, [token, q, statusFilter, onAuthExpired]);

    React.useEffect(() => {
        const t = setTimeout(load, q ? 300 : 0);
        return () => clearTimeout(t);
    }, [load, q]);

    React.useEffect(() => {
        fetchEmailStatus(token).then(setSmtp).catch(() => {});
    }, [token]);

    // Prefill triggered from outside (e.g. lead drawer "Create invoice")
    React.useEffect(() => {
        if (prefillLead) {
            setEditing(
                EMPTY({
                    client_name: prefillLead.full_name || "",
                    client_email: prefillLead.email || "",
                    client_company: prefillLead.company || "",
                    lead_id: prefillLead.id || null,
                })
            );
        }
    }, [prefillLead]);

    const onSave = async (payload, id) => {
        try {
            if (id) {
                const updated = await updateInvoice(token, id, payload);
                setItems((p) => p.map((x) => (x.id === id ? updated : x)));
                toast.success("Invoice updated.");
            } else {
                const created = await createInvoice(token, payload);
                setItems((p) => [created, ...p]);
                toast.success(`Invoice ${created.number} created.`);
            }
            setEditing(null);
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) return onAuthExpired();
            const d = e?.response?.data?.detail;
            const msg = Array.isArray(d) ? d[0]?.msg : d || "Save failed.";
            toast.error(typeof msg === "string" ? msg : "Save failed.");
        }
    };

    const doDelete = async (id) => {
        try {
            await deleteInvoice(token, id);
            setItems((p) => p.filter((x) => x.id !== id));
            toast.success("Invoice deleted.");
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Delete failed.");
        } finally {
            setConfirmDel(null);
        }
    };

    const onDownload = async (inv) => {
        try {
            await downloadInvoicePdf(token, inv.id, inv.number);
        } catch {
            toast.error("Could not download PDF.");
        }
    };

    const onSend = async (inv) => {
        if (!inv.client_email) return toast.error("Client email required.");
        try {
            await sendInvoiceEmail(token, inv.id);
            toast.success(`Invoice emailed to ${inv.client_email}.`);
            load();
        } catch (e) {
            const msg = e?.response?.data?.detail || "Send failed.";
            toast.error(typeof msg === "string" ? msg : "Send failed.");
        }
    };

    const onCopyLink = (inv) => {
        const url = publicInvoiceUrl(inv.public_token);
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        toast.success("Public link copied to clipboard.");
    };

    if (editing) {
        return (
            <InvoiceEditor
                initial={editing.id ? editing : editing}
                onCancel={() => setEditing(null)}
                onSave={(p) => onSave(p, editing.id || null)}
            />
        );
    }

    return (
        <div className="border border-mir-border bg-white">
            <div className="px-6 py-5 border-b border-mir-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="font-heading text-xl tracking-tight text-mir-text">
                        Invoices
                    </div>
                    <div className="text-xs text-mir-muted mt-1">
                        {loading ? "Loading..." : `${items.length} entries`}
                        {smtp && !smtp.smtp_configured && (
                            <span className="ml-3 text-amber-700">
                                · Email not configured (set SMTP_APP_PASSWORD)
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mir-muted pointer-events-none" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search number, client..."
                            data-testid="admin-invoices-search"
                            className={`${inputCls} h-10 pl-9 w-full sm:w-72`}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger
                            data-testid="admin-invoices-status-filter"
                            className={`${inputCls} h-10 w-full sm:w-44`}
                        >
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-mir-border rounded-none">
                            <SelectItem value="all">All statuses</SelectItem>
                            {STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <button
                        onClick={() => setEditing(EMPTY())}
                        data-testid="admin-invoice-new"
                        className={btnPrimary}
                    >
                        <Plus className="w-4 h-4" />
                        New invoice
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table data-testid="admin-invoices-table">
                    <TableHeader>
                        <TableRow className="border-mir-border hover:bg-transparent">
                            {["Number", "Client", "Total", "Status", "Issued", "Due", "Actions"].map(
                                (h) => (
                                    <TableHead
                                        key={h}
                                        className="text-mir-muted uppercase text-[10px] tracking-[0.2em]"
                                    >
                                        {h}
                                    </TableHead>
                                )
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && !loading && (
                            <TableRow className="border-mir-border hover:bg-transparent">
                                <TableCell colSpan={7} className="text-center text-mir-muted py-12">
                                    No invoices yet. Click "New invoice" to create the first one.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((inv) => (
                            <TableRow
                                key={inv.id}
                                data-testid={`admin-invoice-row-${inv.id}`}
                                className="border-mir-border hover:bg-mir-surface"
                            >
                                <TableCell className="text-sm font-medium text-mir-text">
                                    {inv.number}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <div className="text-mir-text">{inv.client_name}</div>
                                    {inv.client_company && (
                                        <div className="text-xs text-mir-muted">
                                            {inv.client_company}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-mir-text whitespace-nowrap">
                                    {fmt(inv.total, inv.currency)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={`${statusBadge[inv.status]} rounded-none border uppercase text-[10px] tracking-[0.18em]`}
                                    >
                                        {inv.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-mir-muted">
                                    {inv.issue_date}
                                </TableCell>
                                <TableCell className="text-xs text-mir-muted">
                                    {inv.due_date}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onDownload(inv)}
                                            data-testid={`admin-invoice-download-${inv.id}`}
                                            className={`${btnGhost} px-3 py-1.5 text-xs`}
                                            title="Download PDF"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onSend(inv)}
                                            data-testid={`admin-invoice-send-${inv.id}`}
                                            className={`${btnGhost} px-3 py-1.5 text-xs`}
                                            title="Email PDF to client"
                                            disabled={!inv.client_email}
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onCopyLink(inv)}
                                            data-testid={`admin-invoice-copy-link-${inv.id}`}
                                            className={`${btnGhost} px-3 py-1.5 text-xs`}
                                            title="Copy public link"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setEditing(inv)}
                                            data-testid={`admin-invoice-edit-${inv.id}`}
                                            className={`${btnGhost} px-3 py-1.5 text-xs`}
                                            title="Edit"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDel(inv)}
                                            data-testid={`admin-invoice-delete-${inv.id}`}
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

            <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
                <AlertDialogContent className="bg-white border-mir-border rounded-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading text-mir-text">
                            Delete invoice {confirmDel?.number}?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-mir-muted">
                            This permanently removes the invoice and revokes the public link.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none border-mir-border">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            data-testid="admin-invoice-delete-confirm"
                            onClick={() => confirmDel && doDelete(confirmDel.id)}
                            className="rounded-none bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// -------------------------------------------------------------
function InvoiceEditor({ initial, onCancel, onSave }) {
    const [form, setForm] = React.useState(() => ({
        ...EMPTY(),
        ...initial,
        line_items:
            initial.line_items && initial.line_items.length
                ? initial.line_items.map((li) => ({
                      description: li.description || "",
                      quantity: li.quantity ?? 1,
                      rate: li.rate ?? 0,
                  }))
                : [{ description: "", quantity: 1, rate: 0 }],
    }));
    const [saving, setSaving] = React.useState(false);
    const isEdit = !!initial.id;

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const setItem = (i, k, v) =>
        setForm((p) => ({
            ...p,
            line_items: p.line_items.map((it, idx) =>
                idx === i ? { ...it, [k]: v } : it
            ),
        }));
    const addItem = () =>
        setForm((p) => ({
            ...p,
            line_items: [...p.line_items, { description: "", quantity: 1, rate: 0 }],
        }));
    const removeItem = (i) =>
        setForm((p) => ({
            ...p,
            line_items:
                p.line_items.length === 1
                    ? p.line_items
                    : p.line_items.filter((_, idx) => idx !== i),
        }));

    const subtotal = form.line_items.reduce(
        (s, li) => s + Number(li.quantity || 0) * Number(li.rate || 0),
        0
    );
    const tax = subtotal * (Number(form.tax_rate || 0) / 100);
    const total = subtotal + tax;

    const submit = async (status) => {
        const payload = {
            client_name: form.client_name.trim(),
            client_email: form.client_email?.trim() || null,
            client_company: form.client_company?.trim() || null,
            client_address: form.client_address?.trim() || null,
            currency: form.currency,
            issue_date: form.issue_date,
            due_date: form.due_date,
            tax_rate: Number(form.tax_rate || 0),
            notes: form.notes?.trim() || null,
            status,
            lead_id: form.lead_id || null,
            line_items: form.line_items
                .filter(
                    (li) =>
                        (li.description || "").trim() ||
                        Number(li.quantity) > 0 ||
                        Number(li.rate) > 0
                )
                .map((li) => ({
                    description: (li.description || "").trim() || "Service",
                    quantity: Number(li.quantity || 0),
                    rate: Number(li.rate || 0),
                })),
        };
        if (!payload.client_name) return toast.error("Client name is required.");
        if (!payload.line_items.length)
            return toast.error("Add at least one line item.");

        setSaving(true);
        try {
            await onSave(payload);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="border border-mir-border bg-white" data-testid="admin-invoice-editor">
            <div className="px-6 py-5 border-b border-mir-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <div className="font-heading text-xl tracking-tight text-mir-text flex items-center gap-2">
                        <FileText className="w-5 h-5 text-mir-blue" />
                        {isEdit ? `Edit invoice ${initial.number}` : "New invoice"}
                    </div>
                    <div className="text-xs text-mir-muted mt-1">
                        Auto-numbered on save. Currency picker per invoice.
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} data-testid="admin-invoice-cancel" className={btnGhost}>
                        Cancel
                    </button>
                    <button
                        onClick={() => submit("draft")}
                        disabled={saving}
                        data-testid="admin-invoice-save-draft"
                        className={btnGhost}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save draft
                    </button>
                    <button
                        onClick={() => submit(form.status === "draft" ? "sent" : form.status)}
                        disabled={saving}
                        data-testid="admin-invoice-save-finalize"
                        className={btnPrimary}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isEdit ? "Save" : "Save & Finalize"}
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4 lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Client name *">
                            <Input
                                data-testid="admin-invoice-client-name"
                                value={form.client_name}
                                onChange={(e) => set("client_name", e.target.value)}
                                className={`${inputCls} h-11`}
                            />
                        </Field>
                        <Field label="Client email">
                            <Input
                                data-testid="admin-invoice-client-email"
                                type="email"
                                value={form.client_email || ""}
                                onChange={(e) => set("client_email", e.target.value)}
                                placeholder="client@example.com"
                                className={`${inputCls} h-11`}
                            />
                        </Field>
                        <Field label="Client company">
                            <Input
                                data-testid="admin-invoice-client-company"
                                value={form.client_company || ""}
                                onChange={(e) => set("client_company", e.target.value)}
                                className={`${inputCls} h-11`}
                            />
                        </Field>
                        <Field label="Currency">
                            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                                <SelectTrigger
                                    data-testid="admin-invoice-currency"
                                    className={`${inputCls} h-11`}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-mir-border rounded-none">
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.symbol} {c.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <Field label="Client address">
                        <Textarea
                            data-testid="admin-invoice-client-address"
                            value={form.client_address || ""}
                            onChange={(e) => set("client_address", e.target.value)}
                            rows={3}
                            placeholder="Street, city, postal code, country..."
                            className={inputCls}
                        />
                    </Field>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Field label="Issue date">
                            <DatePicker
                                testId="admin-invoice-issue-date"
                                value={form.issue_date}
                                onChange={(v) => set("issue_date", v)}
                            />
                        </Field>
                        <Field label="Due date">
                            <DatePicker
                                testId="admin-invoice-due-date"
                                value={form.due_date}
                                onChange={(v) => set("due_date", v)}
                            />
                        </Field>
                        <Field label="Tax rate (%)">
                            <Input
                                data-testid="admin-invoice-tax-rate"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={form.tax_rate}
                                onChange={(e) => set("tax_rate", e.target.value)}
                                className={`${inputCls} h-11`}
                            />
                        </Field>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                Line items
                            </Label>
                            <button
                                onClick={addItem}
                                data-testid="admin-invoice-add-line"
                                className={`${btnGhost} px-3 py-1.5 text-xs`}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add line
                            </button>
                        </div>
                        <div className="border border-mir-border">
                            <Table data-testid="admin-invoice-line-table">
                                <TableHeader>
                                    <TableRow className="border-mir-border hover:bg-transparent">
                                        <TableHead className="text-mir-muted uppercase text-[10px] tracking-[0.2em]">
                                            Description
                                        </TableHead>
                                        <TableHead className="text-mir-muted uppercase text-[10px] tracking-[0.2em] w-24 text-right">
                                            Qty
                                        </TableHead>
                                        <TableHead className="text-mir-muted uppercase text-[10px] tracking-[0.2em] w-32 text-right">
                                            Rate
                                        </TableHead>
                                        <TableHead className="text-mir-muted uppercase text-[10px] tracking-[0.2em] w-32 text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.line_items.map((li, i) => {
                                        const amount =
                                            Number(li.quantity || 0) * Number(li.rate || 0);
                                        return (
                                            <TableRow
                                                key={i}
                                                className="border-mir-border hover:bg-transparent"
                                            >
                                                <TableCell>
                                                    <Input
                                                        data-testid={`admin-invoice-line-desc-${i}`}
                                                        value={li.description}
                                                        onChange={(e) =>
                                                            setItem(i, "description", e.target.value)
                                                        }
                                                        placeholder="Service or product"
                                                        className={`${inputCls} h-9`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        data-testid={`admin-invoice-line-qty-${i}`}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={li.quantity}
                                                        onChange={(e) =>
                                                            setItem(i, "quantity", e.target.value)
                                                        }
                                                        className={`${inputCls} h-9 text-right`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        data-testid={`admin-invoice-line-rate-${i}`}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={li.rate}
                                                        onChange={(e) =>
                                                            setItem(i, "rate", e.target.value)
                                                        }
                                                        className={`${inputCls} h-9 text-right`}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-mir-text whitespace-nowrap">
                                                    {fmt(amount, form.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() => removeItem(i)}
                                                        data-testid={`admin-invoice-line-remove-${i}`}
                                                        className="text-mir-muted hover:text-rose-600 transition-colors"
                                                        disabled={form.line_items.length === 1}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <Field label="Notes / Terms">
                        <Textarea
                            data-testid="admin-invoice-notes"
                            value={form.notes || ""}
                            onChange={(e) => set("notes", e.target.value)}
                            rows={3}
                            placeholder="Payment terms, bank details, thank-you note..."
                            className={inputCls}
                        />
                    </Field>
                </div>

                <div className="space-y-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                        Summary
                    </div>
                    <div
                        className="border border-mir-border bg-mir-surface p-6 space-y-3"
                        data-testid="admin-invoice-summary"
                    >
                        <div className="flex justify-between text-sm">
                            <span className="text-mir-muted">Subtotal</span>
                            <span
                                data-testid="admin-invoice-subtotal"
                                className="text-mir-text"
                            >
                                {fmt(subtotal, form.currency)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-mir-muted">
                                Tax ({Number(form.tax_rate || 0)}%)
                            </span>
                            <span className="text-mir-text">{fmt(tax, form.currency)}</span>
                        </div>
                        <div className="border-t border-mir-border pt-3 flex justify-between">
                            <span className="font-heading text-mir-text text-lg">Total</span>
                            <span
                                data-testid="admin-invoice-total"
                                className="font-heading text-mir-text text-lg"
                            >
                                {fmt(total, form.currency)}
                            </span>
                        </div>
                    </div>

                    {isEdit && (
                        <div className="border border-mir-border bg-white p-5 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-mir-blue">
                                Status
                            </div>
                            <Select value={form.status} onValueChange={(v) => set("status", v)}>
                                <SelectTrigger
                                    data-testid="admin-invoice-status"
                                    className={`${inputCls} h-10`}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-mir-border rounded-none">
                                    {STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
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
