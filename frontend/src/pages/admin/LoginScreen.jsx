/* eslint-disable */
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api";
import { btnGhost, btnPrimary, inputCls } from "./_shared";

export default function LoginScreen({ password, setPassword, onLogin, loading }) {
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
