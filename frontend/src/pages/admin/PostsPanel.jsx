/* eslint-disable */
import React from "react";
import { toast } from "sonner";
import {
    fetchAdminPosts,
    createPost,
    updatePost,
    deletePost,
    fetchAdminCaseStudies,
    createCaseStudy,
    updateCaseStudy,
    deleteCaseStudy,
} from "@/lib/api";
import ContentList, { StatusPill } from "./ContentList";
import PostEditor from "./PostEditor";

const EMPTY_POST = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    cover_image: "",
    read_time: "",
    status: "draft",
};

const EMPTY_CS = {
    title: "",
    slug: "",
    sector: "",
    summary: "",
    content: "",
    cover_image: "",
    client_name: "",
    outcomes: [],
    status: "draft",
};

export function PostsPanel({ token, onAuthExpired, onChange }) {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [confirmDel, setConfirmDel] = React.useState(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            setItems(await fetchAdminPosts(token));
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    }, [token, onAuthExpired]);

    React.useEffect(() => {
        load();
    }, [load]);

    const onSave = async (payload, id) => {
        try {
            if (id) {
                const updated = await updatePost(token, id, payload);
                setItems((p) => p.map((x) => (x.id === id ? updated : x)));
                toast.success("Post updated.");
            } else {
                const created = await createPost(token, payload);
                setItems((p) => [created, ...p]);
                toast.success("Post created.");
            }
            setEditing(null);
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else {
                const msg =
                    e?.response?.data?.detail?.[0]?.msg ||
                    e?.response?.data?.detail ||
                    "Save failed.";
                toast.error(typeof msg === "string" ? msg : "Save failed.");
            }
        }
    };

    const doDelete = async (id) => {
        try {
            await deletePost(token, id);
            setItems((p) => p.filter((x) => x.id !== id));
            toast.success("Post deleted.");
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Delete failed.");
        } finally {
            setConfirmDel(null);
        }
    };

    if (editing) {
        return (
            <PostEditor
                token={token}
                initial={editing === "new" ? EMPTY_POST : editing}
                kind="post"
                onCancel={() => setEditing(null)}
                onSave={(payload) =>
                    onSave(payload, editing === "new" ? null : editing.id)
                }
            />
        );
    }

    return (
        <ContentList
            title="Insights"
            testIdPrefix="post"
            items={items}
            loading={loading}
            columns={["Title", "Category", "Status", "Updated", "Actions"]}
            renderRow={(it) => [
                it.title,
                it.category,
                <StatusPill key="s" status={it.status} />,
                new Date(it.updated_at).toLocaleDateString(),
            ]}
            onNew={() => setEditing("new")}
            onEdit={(it) => setEditing(it)}
            onDelete={(it) => setConfirmDel(it)}
            confirmDel={confirmDel}
            setConfirmDel={setConfirmDel}
            doDelete={doDelete}
        />
    );
}

export function CaseStudiesPanel({ token, onAuthExpired, onChange }) {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [confirmDel, setConfirmDel] = React.useState(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            setItems(await fetchAdminCaseStudies(token));
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Failed to load case studies.");
        } finally {
            setLoading(false);
        }
    }, [token, onAuthExpired]);

    React.useEffect(() => {
        load();
    }, [load]);

    const onSave = async (payload, id) => {
        try {
            if (id) {
                const updated = await updateCaseStudy(token, id, payload);
                setItems((p) => p.map((x) => (x.id === id ? updated : x)));
                toast.success("Case study updated.");
            } else {
                const created = await createCaseStudy(token, payload);
                setItems((p) => [created, ...p]);
                toast.success("Case study created.");
            }
            setEditing(null);
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else {
                const msg =
                    e?.response?.data?.detail?.[0]?.msg ||
                    e?.response?.data?.detail ||
                    "Save failed.";
                toast.error(typeof msg === "string" ? msg : "Save failed.");
            }
        }
    };

    const doDelete = async (id) => {
        try {
            await deleteCaseStudy(token, id);
            setItems((p) => p.filter((x) => x.id !== id));
            toast.success("Case study deleted.");
            onChange?.();
        } catch (e) {
            if (e?.response?.status === 401) onAuthExpired();
            else toast.error("Delete failed.");
        } finally {
            setConfirmDel(null);
        }
    };

    if (editing) {
        return (
            <PostEditor
                token={token}
                initial={editing === "new" ? EMPTY_CS : editing}
                kind="case_study"
                onCancel={() => setEditing(null)}
                onSave={(payload) =>
                    onSave(payload, editing === "new" ? null : editing.id)
                }
            />
        );
    }

    return (
        <ContentList
            title="Case Studies"
            testIdPrefix="case-study"
            items={items}
            loading={loading}
            columns={["Title", "Sector", "Status", "Updated", "Actions"]}
            renderRow={(it) => [
                it.title,
                it.sector,
                <StatusPill key="s" status={it.status} />,
                new Date(it.updated_at).toLocaleDateString(),
            ]}
            onNew={() => setEditing("new")}
            onEdit={(it) => setEditing(it)}
            onDelete={(it) => setConfirmDel(it)}
            confirmDel={confirmDel}
            setConfirmDel={setConfirmDel}
            doDelete={doDelete}
        />
    );
}
