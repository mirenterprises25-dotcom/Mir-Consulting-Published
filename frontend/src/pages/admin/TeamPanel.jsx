import React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, X, Linkedin } from "lucide-react";
import {
    fetchAdminTeam,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
} from "@/lib/api";
import { MediaUpload } from "@/components/admin/MediaUpload";

const emptyMember = () => ({
    name: "",
    role: "",
    bio: "",
    photo: null,
    expertise: [],
    linkedin: "",
    order: 0,
});

export default function TeamPanel({ token, onAuthExpired, onChange }) {
    const [items, setItems] = React.useState([]);
    const [editing, setEditing] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminTeam(token);
            setItems(data);
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired?.();
            else toast.error("Failed to load team.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAdminTeam(token)
            .then((data) => {
                setItems(data);
            })
            .catch((e) => {
                if (e?.response?.status === 401) onAuthExpired?.();
                else toast.error("Failed to load team.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    const save = async (payload) => {
        try {
            if (editing?.id) {
                await updateTeamMember(token, editing.id, payload);
                toast.success("Team member updated.");
            } else {
                await createTeamMember(token, payload);
                toast.success("Team member added.");
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
        if (!window.confirm("Delete this team member?")) return;
        try {
            await deleteTeamMember(token, id);
            toast.success("Removed.");
            await load();
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired?.();
            else toast.error("Delete failed.");
        }
    };

    return (
        <div data-testid="team-panel" className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-2xl text-mir-text">Team Members</h2>
                    <p className="text-sm text-mir-muted mt-1">
                        Add and manage people shown in the team carousel on the About page.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditing(emptyMember())}
                    data-testid="team-new-btn"
                    className="inline-flex items-center gap-2 bg-mir-midnight hover:bg-mir-blue text-white px-5 py-3 text-xs uppercase tracking-[0.15em] transition-colors"
                >
                    <Plus className="w-4 h-4" /> New member
                </button>
            </div>

            {loading ? (
                <div className="text-sm text-mir-muted">Loading…</div>
            ) : items.length === 0 ? (
                <div className="border border-dashed border-mir-border p-12 text-center text-mir-muted text-sm" data-testid="team-empty">
                    No team members yet — add the first one.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-mir-border border border-mir-border">
                    {items.map((m) => (
                        <div key={m.id} className="bg-white p-6 flex gap-4" data-testid={`team-row-${m.id}`}>
                            <div className="w-20 h-20 bg-mir-surface border border-mir-border shrink-0 overflow-hidden">
                                {m.photo ? (
                                    <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-mir-muted text-xs">No photo</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-mir-text truncate">{m.name}</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-mir-blue mt-1">{m.role}</div>
                                <p className="text-xs text-mir-muted mt-2 line-clamp-2">{m.bio}</p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setEditing(m)}
                                        data-testid={`team-edit-${m.id}`}
                                        className="text-xs uppercase tracking-[0.15em] text-mir-blue hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <span className="text-mir-border">|</span>
                                    <button
                                        onClick={() => remove(m.id)}
                                        data-testid={`team-delete-${m.id}`}
                                        className="text-xs uppercase tracking-[0.15em] text-red-600 hover:underline inline-flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <TeamEditor
                    initial={editing}
                    token={token}
                    onCancel={() => setEditing(null)}
                    onSave={save}
                />
            )}
        </div>
    );
}

function TeamEditor({ initial, token, onCancel, onSave }) {
    const [form, setForm] = React.useState({
        ...initial,
        expertise_text: (initial.expertise || []).join(", "),
    });

    const submit = (e) => {
        e.preventDefault();
        if (form.name.trim().length < 2 || form.role.trim().length < 2 || form.bio.trim().length < 4) {
            toast.error("Name, role and bio are required.");
            return;
        }
        const expertise = (form.expertise_text || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        onSave({
            name: form.name.trim(),
            role: form.role.trim(),
            bio: form.bio.trim(),
            photo: form.photo || null,
            expertise,
            linkedin: form.linkedin?.trim() || null,
            order: Number(form.order) || 0,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
            data-testid="team-editor-modal"
        >
            <form
                onSubmit={submit}
                className="bg-white border border-mir-border w-full max-w-2xl my-8 p-8 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl text-mir-text">
                        {initial.id ? "Edit team member" : "New team member"}
                    </h3>
                    <button type="button" onClick={onCancel} className="text-mir-muted hover:text-mir-text" data-testid="team-editor-close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <Field label="Name">
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        data-testid="team-field-name"
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        required
                    />
                </Field>
                <Field label="Role / Title">
                    <input
                        type="text"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        data-testid="team-field-role"
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        required
                    />
                </Field>
                <Field label="Short bio">
                    <textarea
                        rows={4}
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        data-testid="team-field-bio"
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                        required
                    />
                </Field>
                <Field label="Expertise (comma separated)">
                    <input
                        type="text"
                        value={form.expertise_text}
                        onChange={(e) => setForm({ ...form, expertise_text: e.target.value })}
                        placeholder="Strategy, BI, Data Engineering"
                        data-testid="team-field-expertise"
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                    />
                </Field>
                <Field label="LinkedIn URL (optional)">
                    <input
                        type="url"
                        value={form.linkedin || ""}
                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                        data-testid="team-field-linkedin"
                        className="w-full px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                    />
                </Field>
                <Field label="Display order">
                    <input
                        type="number"
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: e.target.value })}
                        data-testid="team-field-order"
                        className="w-32 px-3 py-2 border border-mir-border text-sm bg-white focus:outline-none focus:border-mir-blue"
                    />
                </Field>
                <Field label="Photo">
                    <MediaUpload
                        token={token}
                        folder="team"
                        aspect="square"
                        value={form.photo}
                        onChange={(url) => setForm({ ...form, photo: url })}
                        testIdPrefix="team-photo"
                    />
                </Field>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        data-testid="team-editor-cancel"
                        className="px-5 py-2.5 text-xs uppercase tracking-[0.15em] border border-mir-border text-mir-textSoft hover:border-mir-text hover:text-mir-text"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        data-testid="team-editor-save"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.15em] bg-mir-midnight text-white hover:bg-mir-blue transition-colors"
                    >
                        <Save className="w-3.5 h-3.5" /> Save member
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-[0.2em] text-mir-muted">
                {label}
            </label>
            {children}
        </div>
    );
}
