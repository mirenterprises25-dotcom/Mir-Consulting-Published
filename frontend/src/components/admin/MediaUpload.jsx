import React from "react";
import axios from "axios";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API } from "@/lib/api";

/**
 * Media upload widget.
 * - Tries POST /api/admin/media/upload (multipart) → returns { path, url }
 * - On failure (503 storage misconfigured or 502 upload error), falls back to a plain URL input.
 *
 * Props:
 *   value         current image URL (string) or null
 *   onChange(url) called with the new URL (always a full backend-served path or external)
 *   folder        one of "team" | "blog" | "videos" | "logos" | "uploads"
 *   token         admin bearer token
 *   testIdPrefix  for data-testid hooks
 */
export function MediaUpload({ value, onChange, folder = "uploads", token, testIdPrefix = "media", aspect = "video" }) {
    const [uploading, setUploading] = React.useState(false);
    const [showUrl, setShowUrl] = React.useState(false);
    const [urlDraft, setUrlDraft] = React.useState(value || "");
    const inputRef = React.useRef(null);

    const pickFile = () => inputRef.current?.click();

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", folder);
            const res = await axios.post(`${API}/admin/media/upload`, fd, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // backend returns { path, url }. url is already /api/media/<path>
            const fullUrl = res.data.url.startsWith("http")
                ? res.data.url
                : `${process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")}${res.data.url}`;
            onChange(fullUrl);
            toast.success("Image uploaded.");
        } catch (err) {
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail;
            if (status === 503) {
                toast.error("Image storage not configured. Paste a URL instead.");
            } else if (status === 413) {
                toast.error("File too large (max 8 MB).");
            } else {
                toast.error(detail || "Upload failed. Paste a URL instead.");
            }
            setShowUrl(true);
        } finally {
            setUploading(false);
        }
    };

    const saveUrl = () => {
        onChange(urlDraft.trim() || null);
        if (urlDraft.trim()) toast.success("Image URL saved.");
    };

    const aspectClass = aspect === "square" ? "aspect-square" : "aspect-video";

    return (
        <div className="space-y-3" data-testid={`${testIdPrefix}-wrapper`}>
            {value ? (
                <div className={`relative ${aspectClass} bg-mir-surface border border-mir-border overflow-hidden`}>
                    <img src={value} alt="" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                            setUrlDraft("");
                        }}
                        data-testid={`${testIdPrefix}-clear`}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white border border-mir-border p-1.5"
                        aria-label="Remove image"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    className={`${aspectClass} border border-dashed border-mir-border bg-mir-surface flex items-center justify-center text-mir-muted text-xs`}
                    data-testid={`${testIdPrefix}-placeholder`}
                >
                    No image
                </div>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={pickFile}
                    disabled={uploading}
                    data-testid={`${testIdPrefix}-upload-btn`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.15em] bg-mir-midnight text-white hover:bg-mir-blue disabled:opacity-50 transition-colors"
                >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? "Uploading..." : "Upload"}
                </button>
                <button
                    type="button"
                    onClick={() => setShowUrl((v) => !v)}
                    data-testid={`${testIdPrefix}-url-toggle`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.15em] border border-mir-border text-mir-textSoft hover:text-mir-text hover:border-mir-blue transition-colors"
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Paste URL
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onFile}
                className="hidden"
                data-testid={`${testIdPrefix}-file-input`}
            />

            {showUrl && (
                <div className="flex gap-2" data-testid={`${testIdPrefix}-url-row`}>
                    <input
                        type="url"
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        data-testid={`${testIdPrefix}-url-input`}
                    />
                    <button
                        type="button"
                        onClick={saveUrl}
                        data-testid={`${testIdPrefix}-url-save`}
                        className="px-4 py-2 text-xs uppercase tracking-[0.15em] bg-mir-text text-white hover:bg-mir-blue transition-colors"
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}

export default MediaUpload;
