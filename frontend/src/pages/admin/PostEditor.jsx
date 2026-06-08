import React from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminTranslate } from "@/lib/api";
import { btnGhost, btnPrimary, inputCls } from "./_shared";

export default function PostEditor({ token, initial, kind, onCancel, onSave }) {
    const [form, setForm] = React.useState(() => ({
        ...initial,
        outcomes_text:
            kind === "case_study" ? (initial.outcomes || []).join("\n") : "",
    }));
    const [saving, setSaving] = React.useState(false);
    const [translating, setTranslating] = React.useState(false);
    const isCS = kind === "case_study";
    const isEdit = !!initial.id;

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const translateAll = async (targetLang) => {
        if (translating) return;
        setTranslating(true);
        const t = toast.loading(`Translating to ${targetLang.toUpperCase()}…`);
        try {
            const fields = isCS
                ? ["title", "sector", "summary", "content"]
                : ["title", "category", "excerpt", "content"];
            const out = {};
            for (const f of fields) {
                const v = (form[f] || "").trim();
                if (!v) continue;
                const { translated } = await adminTranslate(token, v, targetLang, "auto");
                out[f] = translated;
            }
            setForm((p) => ({ ...p, ...out }));
            toast.success(`Translated to ${targetLang.toUpperCase()}. Review and save as a new article.`, { id: t });
        } catch (e) {
            const msg = e?.response?.data?.detail || "Translation failed.";
            toast.error(typeof msg === "string" ? msg : "Translation failed.", { id: t });
        } finally {
            setTranslating(false);
        }
    };

    const submit = async (status) => {
        const base = {
            title: form.title.trim(),
            slug: form.slug?.trim() || undefined,
            content: form.content,
            cover_image: form.cover_image?.trim() || undefined,
            status,
        };
        const payload = isCS
            ? {
                  ...base,
                  sector: form.sector.trim(),
                  summary: form.summary.trim(),
                  client_name: form.client_name?.trim() || undefined,
                  outcomes: (form.outcomes_text || "")
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
              }
            : {
                  ...base,
                  category: form.category.trim(),
                  excerpt: form.excerpt.trim(),
                  read_time: form.read_time?.trim() || undefined,
              };

        if (!payload.title || payload.title.length < 3) {
            toast.error("Title is required (min 3 chars).");
            return;
        }
        if (isCS) {
            if (!payload.sector) return toast.error("Sector is required.");
            if (!payload.summary || payload.summary.length < 10)
                return toast.error("Summary must be at least 10 chars.");
        } else {
            if (!payload.category) return toast.error("Category is required.");
            if (!payload.excerpt || payload.excerpt.length < 10)
                return toast.error("Excerpt must be at least 10 chars.");
        }
        if (!payload.content || payload.content.length < 10) {
            return toast.error("Content must be at least 10 chars.");
        }

        setSaving(true);
        try {
            await onSave(payload);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="border border-mir-border bg-white"
            data-testid={`admin-${isCS ? "case-study" : "post"}-editor`}
        >
            <div className="px-6 py-5 border-b border-mir-border flex items-center justify-between">
                <div>
                    <div className="font-heading text-xl tracking-tight text-mir-text">
                        {isEdit ? "Edit" : "New"} {isCS ? "case study" : "insight"}
                    </div>
                    <div className="text-xs text-mir-muted mt-1">
                        Markdown supported. Live preview on the right.
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        data-testid="admin-editor-cancel"
                        className={btnGhost}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => submit("draft")}
                        disabled={saving}
                        data-testid="admin-editor-save-draft"
                        className={btnGhost}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save draft
                    </button>
                    <button
                        onClick={() => submit("published")}
                        disabled={saving}
                        data-testid="admin-editor-publish"
                        className={btnPrimary}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Publish
                    </button>
                </div>
            </div>

            <div
                className="px-6 py-3 border-b border-mir-border bg-mir-surface flex items-center gap-3 flex-wrap"
                data-testid="admin-editor-translate-bar"
            >
                <Sparkles className="w-4 h-4 text-mir-blue" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-mir-muted">
                    AI translate this article to
                </span>
                {["de", "es", "en"].map((lang) => (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => translateAll(lang)}
                        disabled={translating}
                        data-testid={`admin-editor-translate-${lang}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-mir-border bg-white text-[11px] uppercase tracking-[0.2em] hover:border-mir-blue hover:text-mir-blue transition-colors disabled:opacity-50"
                    >
                        {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {lang === "de" ? "Deutsch (DE)" : lang === "es" ? "Español (ES)" : "English (EN)"}
                    </button>
                ))}
                <span className="text-[10px] text-mir-muted ml-2">
                    Tip: translate then change the slug and save as a new article.
                </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Field label="Title *">
                        <Input
                            data-testid="admin-editor-title"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            className={`${inputCls} h-11`}
                        />
                    </Field>

                    <Field label="Slug (optional — auto-generated)">
                        <Input
                            data-testid="admin-editor-slug"
                            value={form.slug || ""}
                            onChange={(e) => set("slug", e.target.value)}
                            placeholder="my-article-slug"
                            className={`${inputCls} h-11`}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label={isCS ? "Sector *" : "Category *"}>
                            <Input
                                data-testid="admin-editor-category"
                                value={isCS ? form.sector : form.category}
                                onChange={(e) =>
                                    set(isCS ? "sector" : "category", e.target.value)
                                }
                                className={`${inputCls} h-11`}
                            />
                        </Field>
                        {!isCS && (
                            <Field label="Read time">
                                <Input
                                    data-testid="admin-editor-read-time"
                                    value={form.read_time || ""}
                                    onChange={(e) => set("read_time", e.target.value)}
                                    placeholder="6 min read"
                                    className={`${inputCls} h-11`}
                                />
                            </Field>
                        )}
                        {isCS && (
                            <Field label="Client name">
                                <Input
                                    data-testid="admin-editor-client"
                                    value={form.client_name || ""}
                                    onChange={(e) => set("client_name", e.target.value)}
                                    className={`${inputCls} h-11`}
                                />
                            </Field>
                        )}
                    </div>

                    <Field
                        label={isCS ? "Summary * (10+ chars)" : "Excerpt * (10+ chars)"}
                    >
                        <Textarea
                            data-testid="admin-editor-excerpt"
                            value={isCS ? form.summary : form.excerpt}
                            onChange={(e) =>
                                set(isCS ? "summary" : "excerpt", e.target.value)
                            }
                            rows={3}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Cover image URL">
                        <Input
                            data-testid="admin-editor-cover"
                            value={form.cover_image || ""}
                            onChange={(e) => set("cover_image", e.target.value)}
                            placeholder="https://..."
                            className={`${inputCls} h-11`}
                        />
                    </Field>

                    {isCS && (
                        <Field label="Outcomes (one per line)">
                            <Textarea
                                data-testid="admin-editor-outcomes"
                                value={form.outcomes_text}
                                onChange={(e) => set("outcomes_text", e.target.value)}
                                rows={4}
                                placeholder={"Reduced operational overhead by 32%\nUnified 12 properties into one dashboard"}
                                className={inputCls}
                            />
                        </Field>
                    )}

                    <Field label="Content * (Markdown)">
                        <Textarea
                            data-testid="admin-editor-content"
                            value={form.content}
                            onChange={(e) => set("content", e.target.value)}
                            rows={18}
                            placeholder={"## Heading\n\nWrite your **content** here using markdown..."}
                            className={`${inputCls} font-mono text-sm`}
                        />
                    </Field>
                </div>

                <div className="space-y-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                        Live preview
                    </div>
                    <div
                        className="border border-mir-border bg-mir-surface p-6 min-h-[400px]"
                        data-testid="admin-editor-preview"
                    >
                        {form.cover_image && (
                            <img
                                src={form.cover_image}
                                alt=""
                                className="w-full h-44 object-cover border border-mir-border mb-6"
                            />
                        )}
                        <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-3">
                            {isCS ? form.sector : form.category || "—"}
                        </div>
                        <h1 className="font-heading text-3xl font-light tracking-tight text-mir-text leading-tight">
                            {form.title || "Untitled"}
                        </h1>
                        <p className="mt-4 text-mir-muted text-sm leading-relaxed">
                            {isCS ? form.summary : form.excerpt}
                        </p>
                        {isCS && form.outcomes_text && (
                            <ul className="mt-5 space-y-2">
                                {form.outcomes_text
                                    .split("\n")
                                    .map((o) => o.trim())
                                    .filter(Boolean)
                                    .map((o, i) => (
                                        <li
                                            key={i}
                                            className="text-sm text-mir-textSoft flex items-start gap-2"
                                        >
                                            <span className="text-mir-blue">›</span> {o}
                                        </li>
                                    ))}
                            </ul>
                        )}
                        <div className="divider-line-soft my-6" />
                        <div
                            className="prose prose-slate max-w-none
                                prose-headings:font-heading prose-headings:text-mir-text
                                prose-p:text-mir-textSoft prose-p:leading-relaxed
                                prose-a:text-mir-blue
                                prose-strong:text-mir-text
                                prose-code:text-mir-blueInk prose-code:bg-white prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {form.content || "_Start typing content..._"}
                            </ReactMarkdown>
                        </div>
                    </div>
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
