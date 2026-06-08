import React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { fetchSiteSettings, updateSiteSettings } from "@/lib/api";
import { MediaUpload } from "@/components/admin/MediaUpload";

export default function SiteSettingsPanel({ token, onAuthExpired }) {
    const [logo, setLogo] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        fetchSiteSettings()
            .then((data) => {
                setLogo(data.logo_url || null);
            })
            .catch(() => {
                toast.error("Failed to load settings.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await updateSiteSettings(token, { logo_url: logo });
            toast.success("Site settings saved.");
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired?.();
            else toast.error("Save failed.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div data-testid="site-settings-panel" className="space-y-8 max-w-2xl">
            <div>
                <h2 className="font-heading text-2xl text-mir-text">Site Settings</h2>
                <p className="text-sm text-mir-muted mt-1">
                    Branding shown across the public site.
                </p>
            </div>

            {loading ? (
                <div className="text-sm text-mir-muted">Loading…</div>
            ) : (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="block text-xs uppercase tracking-[0.2em] text-mir-muted">
                            Company logo
                        </label>
                        <p className="text-xs text-mir-muted">
                            Square or wide PNG/SVG. We render it inside a 36×36 frame next to the
                            &quot;MIR Consulting&quot; wordmark. Recommended: transparent background, dark
                            on light. Falls back to the &quot;M&quot; placeholder when empty.
                        </p>
                        <MediaUpload
                            token={token}
                            folder="logos"
                            aspect="square"
                            value={logo}
                            onChange={setLogo}
                            testIdPrefix="logo"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            data-testid="site-settings-save"
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.15em] bg-mir-midnight text-white hover:bg-mir-blue disabled:opacity-50 transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save settings"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
