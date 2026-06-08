import React from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Loader2, Download, CreditCard, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Seo from "@/lib/Seo";
import {
    API,
    fetchPublicInvoice,
    createInvoiceCheckout,
    invoiceCheckoutStatus,
} from "@/lib/api";

const fmt = (amount, currency) => {
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount || 0);
    } catch {
        return `${(amount || 0).toFixed(2)} ${currency || ""}`.trim();
    }
};

const STATUS_BADGE = {
    draft: { label: "Draft", cls: "bg-mir-surface text-mir-textSoft border-mir-border" },
    sent: { label: "Awaiting payment", cls: "bg-blue-50 text-mir-blue border-blue-200" },
    paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    overdue: { label: "Overdue", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    void: { label: "Void", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function PublicInvoice() {
    const { token } = useParams();
    const [search, setSearch] = useSearchParams();
    const [invoice, setInvoice] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [paying, setPaying] = React.useState(false);
    const [polling, setPolling] = React.useState(false);

    const load = React.useCallback(() => {
        fetchPublicInvoice(token)
            .then(setInvoice)
            .catch((e) => setError(e?.response?.data?.detail || "Invoice not found."));
    }, [token]);

    React.useEffect(() => {
        load();
    }, [load]);

    // Poll status after returning from Stripe
    React.useEffect(() => {
        const paymentParam = search.get("payment");
        const sessionId = search.get("session_id");
        if (paymentParam === "success" && sessionId && !polling) {
            setPolling(true);
            let attempts = 0;
            const tick = async () => {
                attempts += 1;
                try {
                    const status = await invoiceCheckoutStatus(token, sessionId);
                    if (status.payment_status === "paid") {
                        toast.success("Payment received. Thank you!");
                        setPolling(false);
                        // strip query params after success
                        search.delete("payment");
                        search.delete("session_id");
                        setSearch(search, { replace: true });
                        load();
                        return;
                    }
                    if (status.status === "expired" || attempts > 30) {
                        toast.error("Payment status check timed out. Please contact us.");
                        setPolling(false);
                        return;
                    }
                    setTimeout(tick, 2000);
                } catch {
                    setPolling(false);
                }
            };
            tick();
        } else if (paymentParam === "cancelled") {
            toast.info("Payment cancelled.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search.get("payment"), search.get("session_id")]);

    const onPay = async () => {
        if (paying) return;
        setPaying(true);
        try {
            const { url } = await createInvoiceCheckout(token, window.location.origin);
            window.location.href = url;
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Could not start checkout.");
            setPaying(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-mir-bg px-6" data-testid="public-invoice-error">
                <Seo title="Invoice not found" noIndex />
                <div className="max-w-md text-center">
                    <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                    <h1 className="font-heading text-2xl text-mir-text mb-2">Invoice unavailable</h1>
                    <p className="text-mir-muted text-sm mb-6">{error}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center px-5 py-2.5 border border-mir-text text-mir-text text-xs uppercase tracking-[0.2em] hover:bg-mir-text hover:text-white transition-colors"
                    >
                        Back to MIR Consulting
                    </Link>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-mir-bg" data-testid="public-invoice-loading">
                <Loader2 className="w-6 h-6 animate-spin text-mir-blue" />
            </div>
        );
    }

    const isPaid = invoice.status === "paid";
    const status = STATUS_BADGE[invoice.status] || STATUS_BADGE.sent;
    const pdfUrl = `${API}/invoices/public/${token}/pdf`;

    return (
        <div className="min-h-screen bg-mir-bg" data-testid="public-invoice-page">
            <Seo title={`Invoice ${invoice.number}`} description={`MIR Consulting invoice ${invoice.number}`} noIndex />

            <div className="max-w-3xl mx-auto px-6 py-16">
                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-3">
                    MIR Consulting
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
                    <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tighter text-mir-text">
                        Invoice {invoice.number}
                    </h1>
                    <span
                        data-testid="public-invoice-status"
                        className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border ${status.cls}`}
                    >
                        {status.label}
                    </span>
                </div>

                <div className="bg-white border border-mir-border p-8 sm:p-10 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-mir-muted mb-2">
                                Billed to
                            </div>
                            <div className="font-heading text-lg text-mir-text">
                                {invoice.client_name}
                            </div>
                            {invoice.client_company && (
                                <div className="text-sm text-mir-textSoft">{invoice.client_company}</div>
                            )}
                            {invoice.client_address && (
                                <div className="text-sm text-mir-textSoft whitespace-pre-line mt-1">
                                    {invoice.client_address}
                                </div>
                            )}
                        </div>
                        <div className="sm:text-right">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-mir-muted mb-2">
                                Dates
                            </div>
                            <div className="text-sm text-mir-text">
                                <span className="text-mir-muted">Issued:</span> {invoice.issue_date}
                            </div>
                            <div className="text-sm text-mir-text">
                                <span className="text-mir-muted">Due:</span> {invoice.due_date}
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-sm border-t border-mir-border">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-mir-muted">
                                <th className="py-3">Description</th>
                                <th className="py-3 text-right w-20">Qty</th>
                                <th className="py-3 text-right w-28">Rate</th>
                                <th className="py-3 text-right w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invoice.line_items || []).map((li, i) => (
                                <tr key={i} className="border-t border-mir-border">
                                    <td className="py-4 pr-4 text-mir-text">{li.description}</td>
                                    <td className="py-4 text-right text-mir-textSoft">{li.quantity}</td>
                                    <td className="py-4 text-right text-mir-textSoft">
                                        {fmt(li.rate, invoice.currency)}
                                    </td>
                                    <td className="py-4 text-right text-mir-text font-medium">
                                        {fmt(li.amount, invoice.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-mir-border">
                            <tr>
                                <td colSpan={3} className="py-2 text-right text-mir-muted text-sm">
                                    Subtotal
                                </td>
                                <td className="py-2 text-right text-mir-text">
                                    {fmt(invoice.subtotal, invoice.currency)}
                                </td>
                            </tr>
                            {invoice.tax_rate > 0 && (
                                <tr>
                                    <td colSpan={3} className="py-2 text-right text-mir-muted text-sm">
                                        Tax ({invoice.tax_rate}%)
                                    </td>
                                    <td className="py-2 text-right text-mir-text">
                                        {fmt(invoice.tax_amount, invoice.currency)}
                                    </td>
                                </tr>
                            )}
                            <tr className="border-t border-mir-border">
                                <td colSpan={3} className="py-3 text-right text-[10px] uppercase tracking-[0.25em] text-mir-muted">
                                    Total due
                                </td>
                                <td
                                    data-testid="public-invoice-total"
                                    className="py-3 text-right font-heading text-2xl text-mir-blue"
                                >
                                    {fmt(invoice.total, invoice.currency)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {invoice.notes && (
                        <div className="mt-8 pt-6 border-t border-mir-border">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-mir-muted mb-2">
                                Notes
                            </div>
                            <p className="text-sm text-mir-textSoft whitespace-pre-line">
                                {invoice.notes}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="public-invoice-download"
                        className="inline-flex items-center gap-2 px-5 py-3 border border-mir-text text-mir-text text-xs uppercase tracking-[0.2em] hover:bg-mir-text hover:text-white transition-colors"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </a>

                    {isPaid ? (
                        <span
                            data-testid="public-invoice-paid"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs uppercase tracking-[0.2em]"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Payment received — thank you
                        </span>
                    ) : (
                        <button
                            onClick={onPay}
                            disabled={paying || polling}
                            data-testid="public-invoice-pay"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-mir-blue text-white text-xs uppercase tracking-[0.2em] hover:bg-mir-blueDark transition-colors disabled:opacity-60"
                        >
                            {paying || polling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CreditCard className="w-4 h-4" />
                            )}
                            {polling ? "Confirming payment…" : `Pay ${fmt(invoice.total, invoice.currency)} online`}
                        </button>
                    )}
                </div>

                <p className="text-xs text-mir-muted mt-6">
                    Secure payment processed by Stripe. We never see or store your card details.
                </p>
            </div>
        </div>
    );
}
