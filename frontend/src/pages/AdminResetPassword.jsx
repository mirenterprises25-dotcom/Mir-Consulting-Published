/* eslint-disable */
import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateResetToken, resetPassword } from "@/lib/api";
import Seo from "@/lib/Seo";

const inputCls =
    "bg-white border-mir-border rounded-none focus-visible:ring-mir-blue focus-visible:ring-offset-0 focus-visible:border-mir-blue text-mir-text";
const btnPrimary =
    "inline-flex items-center justify-center gap-2 bg-mir-midnight hover:bg-mir-blue disabled:opacity-60 text-white px-6 py-3 text-sm font-medium transition-colors";

export default function AdminResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = React.useState("checking"); // checking | valid | invalid | done
    const [pwd, setPwd] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        validateResetToken(token)
            .then(() => setStatus("valid"))
            .catch(() => setStatus("invalid"));
    }, [token]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (pwd.length < 8) return toast.error("Password must be at least 8 characters.");
        if (pwd !== confirm) return toast.error("Passwords do not match.");
        setSaving(true);
        try {
            await resetPassword(token, pwd);
            setStatus("done");
            toast.success("Password updated. You can now sign in.");
        } catch (err) {
            const msg = err?.response?.data?.detail || "Failed to reset password.";
            toast.error(typeof msg === "string" ? msg : "Failed to reset password.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            data-testid="admin-reset-page"
            className="min-h-screen bg-mir-surface flex items-center justify-center px-6 grain-overlay relative"
        >
            <Seo title="Reset Admin Password" path="/admin/reset" noIndex />
            <div className="absolute inset-0 grid-backdrop opacity-40 [mask-image:radial-gradient(ellipse_at_center,_black_30%,_transparent_70%)] pointer-events-none" />
            <div className="absolute top-6 left-6 z-10">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 text-mir-muted hover:text-mir-text text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>
            </div>

            <div className="relative border border-mir-border bg-white p-10 w-full max-w-md shadow-[0_8px_30px_0_rgba(15,23,42,0.06)]">
                <div className="w-12 h-12 border border-mir-blue/30 bg-mir-blue/8 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-5 h-5 text-mir-blue" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-3">
                    MIR Consulting · Admin
                </div>

                {status === "checking" && (
                    <div data-testid="admin-reset-checking" className="py-10 flex items-center gap-2 text-mir-muted">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying reset link...
                    </div>
                )}

                {status === "invalid" && (
                    <div data-testid="admin-reset-invalid">
                        <div className="flex items-center gap-2 text-rose-700 mb-4">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-heading text-xl">Link invalid or expired</span>
                        </div>
                        <p className="text-sm text-mir-muted mb-6">
                            This reset link is no longer valid. Reset links expire after 15 minutes
                            and can only be used once. Please request a new one from the login page.
                        </p>
                        <button
                            onClick={() => navigate("/admin")}
                            data-testid="admin-reset-request-new"
                            className={btnPrimary}
                        >
                            Request a new link
                        </button>
                    </div>
                )}

                {status === "valid" && (
                    <form onSubmit={onSubmit} data-testid="admin-reset-form">
                        <h1 className="font-heading text-3xl font-light tracking-tight mb-2 text-mir-text">
                            Choose a new password
                        </h1>
                        <p className="text-sm text-mir-muted mb-8">
                            Minimum 8 characters. Make it strong — you'll use this to sign into the
                            admin console.
                        </p>

                        <div className="space-y-2 mb-4">
                            <Label htmlFor="new-pwd" className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                New password
                            </Label>
                            <Input
                                id="new-pwd"
                                type="password"
                                data-testid="admin-reset-new-password"
                                value={pwd}
                                onChange={(e) => setPwd(e.target.value)}
                                placeholder="At least 8 characters"
                                className={`${inputCls} h-12`}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2 mb-6">
                            <Label htmlFor="confirm-pwd" className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                Confirm password
                            </Label>
                            <Input
                                id="confirm-pwd"
                                type="password"
                                data-testid="admin-reset-confirm-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Retype to confirm"
                                className={`${inputCls} h-12`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            data-testid="admin-reset-submit"
                            className={`${btnPrimary} w-full`}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Update password
                        </button>
                    </form>
                )}

                {status === "done" && (
                    <div data-testid="admin-reset-done">
                        <div className="flex items-center gap-2 text-emerald-700 mb-4">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-heading text-xl">Password updated</span>
                        </div>
                        <p className="text-sm text-mir-muted mb-6">
                            Your new password is now active. You can sign in to the admin console.
                        </p>
                        <button
                            onClick={() => navigate("/admin")}
                            data-testid="admin-reset-go-login"
                            className={btnPrimary}
                        >
                            Go to sign in
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
