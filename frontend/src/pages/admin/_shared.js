/* Shared admin constants and tailwind class strings. */
export const TOKEN_KEY = "mir_admin_token";

export const LEAD_STATUSES = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
];

export const statusColor = {
    new: "bg-mir-blue/10 text-mir-blue border-mir-blue/30",
    contacted: "bg-amber-50 text-amber-700 border-amber-200",
    qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    won: "bg-emerald-100 text-emerald-800 border-emerald-300",
    lost: "bg-rose-50 text-rose-700 border-rose-200",
};

export const btnPrimary =
    "inline-flex items-center justify-center gap-2 bg-mir-midnight hover:bg-mir-blue disabled:opacity-60 text-white px-5 py-2.5 text-sm font-medium transition-colors";
export const btnGhost =
    "inline-flex items-center justify-center gap-2 border border-mir-border hover:border-mir-blue px-4 py-2 text-sm text-mir-text bg-white transition-colors";
export const inputCls =
    "bg-white border-mir-border rounded-none focus-visible:ring-mir-blue focus-visible:ring-offset-0 focus-visible:border-mir-blue text-mir-text";
