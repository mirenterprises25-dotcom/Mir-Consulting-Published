/* eslint-disable */
import React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { changePassword } from "@/lib/api";
import { btnGhost, btnPrimary, inputCls } from "./_shared";

export default function ChangePasswordDialog({ open, onOpenChange, token, onAuthExpired }) {
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
