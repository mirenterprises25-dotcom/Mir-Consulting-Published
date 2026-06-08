import React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, X, PlayCircle } from "lucide-react";
import {
    fetchAdminVideos,
    createVideo,
    updateVideo,
    deleteVideo,
} from "@/lib/api";
import { MediaUpload } from "@/components/admin/MediaUpload";

const empty = () => ({
    title: "",
    description: "",
    youtube_url: "",
    category: "Video",
    cover_image: null,
    status: "draft",
});

function extractYoutubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
        /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

export default function VideosPanel({ token, onAuthExpired, onChange }) {
    const [items, setItems] = React.useState([]);
    const [editing, setEditing] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminVideos(token);
            setItems(data);
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired?.();
            else toast.error("Failed to load videos.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAdminVideos(token)
            .then((data) => {
                setItems(data);
            })
            .catch((e) => {
                if (e?.response?.status === 401) onAuthExpired?.();
                else toast.error("Failed to load videos.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    const save = async (payload) => {
        try {
            if (editing?.id) {
                await updateVideo(token, editing.id, payload);
                toast.success("Video updated.");
            } else {
                await createVideo(token, payload);
                toast.success("Video added.");
            }
            setEditing(null);
            await load();
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired?.();
            else toast.error(e?.response?.data?.detail || "Save failed.");
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this video entry?")) return;
        try {
            await deleteVideo(token, id);
            toast.success("Removed.");
            await load();
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired?.();
            else toast.error("Delete failed.");
        }
    };

    return (
        <div data-testid="videos-panel" className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-2xl text-mir-text">Videos</h2>
                    <p className="text-sm text-mir-muted mt-1">
                        Add YouTube videos (video blogs, conferences, recordings). The site embeds the player.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditing(empty())}
                    data-testid="video-new-btn"
                    className="inline-flex items-center gap-2 bg-mir-midnight hover:bg-mir-blue text-white px-5 py-3 text-xs uppercase tracking-[0.15em] transition-colors"
                >
                    <Plus className="w-4 h-4" /> New video
                </button>
            </div>

            {loading ? (
                <div className="text-sm text-mir-muted">Loading…</div>
            ) : items.length === 0 ? (
                <div className="border border-dashed border-mir-border p-12 text-center text-mir-muted text-sm" data-testid="videos-empty">
                    No videos yet — add the first one.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-mir-border border border-mir-border">
                    {items.map((v) => (
                        <div key={v.id} className="bg-white p-6" data-testid={`video-row-${v.id}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-32 aspect-video bg-mir-surface border border-mir-border shrink-0 overflow-hidden">
                                    {v.youtube_id ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <PlayCircle className="w-6 h-6 text-mir-muted" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 ${
                                                v.status === "published"
                                                    ? "bg-mir-blue/10 text-mir-blue"
                                                    : "bg-mir-surface text-mir-muted"
                                            }`}
                                        >
                                            {v.status}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-mir-muted">
                                            {v.category}
                                        </span>
                                    </div>
                                    <div className="font-medium text-mir-text">{v.title}</div>
                                    <p className="text-xs text-mir-muted mt-1 line-clamp-2">{v.description}</p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => setEditing(v)}
                                            data-testid={`video-edit-${v.id}`}
                                            className="text-xs uppercase tracking-[0.15em] text-mir-blue hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <span className="text-mir-border">|</span>
                                        <button
                                            onClick={() => remove(v.id)}
                                            data-testid={`video-delete-${v.id}`}
                                            className="text-xs uppercase tracking-[0.15em] text-red-600 hover:underline inline-flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <VideoEditor
                    initial={editing}
                    token={token}
                    onCancel={() => setEditing(null)}
                    onSave={save}
                />
            )}
        </div>
    );
}

function VideoEditor({ initial, token, onCancel, onSave }) {
    const [form, setForm] = React.useState({ ...initial });
    const ytPreviewId = extractYoutubeId(form.youtube_url);

    const submit = (e) => {
        e.preventDefault();
        if (!extractYoutubeId(form.youtube_url)) {
            toast.error("Enter a valid YouTube URL.");
            return;
        }
        onSave({
            title: form.title.trim(),
            description: form.description.trim(),
            youtube_url: form.youtube_url.trim(),
            category: (form.category || "Video").trim(),
            cover_image: form.cover_image || null,
            status: form.status,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
            data-testid="video-editor-modal"
        >
            <form
                onSubmit={submit}
                className="bg-white border border-mir-border w-full max-w-3xl my-8 p-8 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl text-mir-text">
                        {initial.id ? "Edit video" : "New video"}
                    </h3>
                    <button type="button" onClick={onCancel} data-testid="video-editor-close" className="text-mir-muted hover:text-mir-text">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <Field label="Title">
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        data-testid="video-field-title"
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        required
                    />
                </Field>
                <Field label="YouTube URL">
                    <input
                        type="url"
                        value={form.youtube_url}
                        onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                        data-testid="video-field-url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        required
                    />
                    {ytPreviewId && (
                        <div className="mt-3 aspect-video bg-black" data-testid="video-editor-preview">
                            <iframe
                                src={`https://www.youtube.com/embed/${ytPreviewId}?rel=0`}
                                title="preview"
                                allow="encrypted-media"
                                className="w-full h-full"
                            />
                        </div>
                    )}
                </Field>
                <Field label="Description">
                    <textarea
                        rows={5}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        data-testid="video-field-desc"
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        required
                    />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Category">
                        <input
                            type="text"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            data-testid="video-field-category"
                            placeholder="Conference, Blog, Webinar…"
                            className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        />
                    </Field>
                    <Field label="Status">
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            data-testid="video-field-status"
                            className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </Field>
                </div>
                <Field label="Custom cover image (optional — defaults to YouTube thumbnail)">
                    <MediaUpload
                        token={token}
                        folder="videos"
                        value={form.cover_image}
                        onChange={(url) => setForm({ ...form, cover_image: url })}
                        testIdPrefix="video-cover"
                    />
                </Field>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onCancel} className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] border border-mir-border text-mir-textSoft hover:border-mir-text hover:text-mir-text" data-testid="video-editor-cancel">
                        Cancel
                    </button>
                    <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.15em] bg-mir-midnight text-white hover:bg-mir-blue transition-colors" data-testid="video-editor-save">
                        <Save className="w-3.5 h-3.5" /> Save video
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-[0.2em] text-mir-muted">{label}</label>
            {children}
        </div>
    );
}
