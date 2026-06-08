import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

// ====== Global 401 interceptor (admin only) ======
const TOKEN_KEY = "mir_admin_token";
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const config = error?.config || {};
        const url = (config.url || "").toString();
        // Only auto-logout if the failing request was a /admin/* call.
        const isAdminRoute = url.includes("/admin/") && !url.includes("/admin/login");
        if (status === 401 && isAdminRoute && typeof window !== "undefined") {
            try {
                localStorage.removeItem(TOKEN_KEY);
            } catch (_e) {
                /* noop */
            }
            if (!window.location.pathname.startsWith("/admin")) {
                window.location.assign("/admin");
            } else {
                // already on /admin — soft-reload so the login screen renders again
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ====== PUBLIC ======
export const submitLead = (data) => api.post("/leads", data).then((r) => r.data);
export const fetchPosts = () => api.get("/posts").then((r) => r.data);
export const fetchPost = (slug) => api.get(`/posts/${slug}`).then((r) => r.data);
export const fetchCaseStudies = () =>
    api.get("/case-studies").then((r) => r.data);
export const fetchCaseStudy = (slug) =>
    api.get(`/case-studies/${slug}`).then((r) => r.data);
export const fetchCompany = () => api.get("/company").then((r) => r.data);

// ====== AUTH ======
export const adminLogin = (password) =>
    api.post("/admin/login", { password }).then((r) => r.data);

export const forgotPassword = (email) =>
    api.post("/admin/forgot-password", { email }).then((r) => r.data);

export const validateResetToken = (token) =>
    api.get(`/admin/reset-password/${token}`).then((r) => r.data);

export const resetPassword = (token, new_password) =>
    api.post("/admin/reset-password", { token, new_password }).then((r) => r.data);

export const changePassword = (token, current_password, new_password) =>
    api
        .post(
            "/admin/change-password",
            { current_password, new_password },
            { headers: authHeader(token) }
        )
        .then((r) => r.data);

// ====== ADMIN: LEADS ======
export const fetchLeads = (token, params = {}) =>
    api
        .get("/admin/leads", { headers: authHeader(token), params })
        .then((r) => r.data);

export const fetchStats = (token) =>
    api.get("/admin/stats", { headers: authHeader(token) }).then((r) => r.data);

export const updateLead = (token, id, payload) =>
    api
        .patch(`/admin/leads/${id}`, payload, { headers: authHeader(token) })
        .then((r) => r.data);

export const deleteLead = (token, id) =>
    api
        .delete(`/admin/leads/${id}`, { headers: authHeader(token) })
        .then((r) => r.data);

// ====== ADMIN: POSTS ======
export const fetchAdminPosts = (token) =>
    api.get("/admin/posts", { headers: authHeader(token) }).then((r) => r.data);

export const createPost = (token, payload) =>
    api
        .post("/admin/posts", payload, { headers: authHeader(token) })
        .then((r) => r.data);

export const updatePost = (token, id, payload) =>
    api
        .put(`/admin/posts/${id}`, payload, { headers: authHeader(token) })
        .then((r) => r.data);

export const deletePost = (token, id) =>
    api
        .delete(`/admin/posts/${id}`, { headers: authHeader(token) })
        .then((r) => r.data);

// ====== ADMIN: CASE STUDIES ======
export const fetchAdminCaseStudies = (token) =>
    api
        .get("/admin/case-studies", { headers: authHeader(token) })
        .then((r) => r.data);

export const createCaseStudy = (token, payload) =>
    api
        .post("/admin/case-studies", payload, { headers: authHeader(token) })
        .then((r) => r.data);

export const updateCaseStudy = (token, id, payload) =>
    api
        .put(`/admin/case-studies/${id}`, payload, {
            headers: authHeader(token),
        })
        .then((r) => r.data);

export const deleteCaseStudy = (token, id) =>
    api
        .delete(`/admin/case-studies/${id}`, { headers: authHeader(token) })
        .then((r) => r.data);

// ====== ADMIN: INVOICES ======
export const fetchAdminInvoices = (token, params = {}) =>
    api
        .get("/admin/invoices", { headers: authHeader(token), params })
        .then((r) => r.data);

export const createInvoice = (token, payload) =>
    api
        .post("/admin/invoices", payload, { headers: authHeader(token) })
        .then((r) => r.data);

export const updateInvoice = (token, id, payload) =>
    api
        .put(`/admin/invoices/${id}`, payload, { headers: authHeader(token) })
        .then((r) => r.data);

export const deleteInvoice = (token, id) =>
    api
        .delete(`/admin/invoices/${id}`, { headers: authHeader(token) })
        .then((r) => r.data);

export const sendInvoiceEmail = (token, id) =>
    api
        .post(`/admin/invoices/${id}/send`, {}, { headers: authHeader(token) })
        .then((r) => r.data);

export const invoicePdfUrl = (id, token) =>
    `${API}/admin/invoices/${id}/pdf?_t=${encodeURIComponent(token)}`;

export const downloadInvoicePdf = async (token, id, number) => {
    const res = await api.get(`/admin/invoices/${id}/pdf`, {
        headers: authHeader(token),
        responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${number || "invoice"}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

export const publicInvoiceUrl = (token) =>
    `${BACKEND_URL.replace(/\/$/, "")}/api/invoices/public/${token}/pdf`;

export const fetchEmailStatus = (token) =>
    api.get("/admin/email-status", { headers: authHeader(token) }).then((r) => r.data);

// ====== PUBLIC: TEAM / VIDEOS / WORKS / SITE SETTINGS ======
export const fetchTeam = () => api.get("/team").then((r) => r.data);
export const fetchVideos = () => api.get("/videos").then((r) => r.data);
export const fetchVideo = (slug) => api.get(`/videos/${slug}`).then((r) => r.data);
export const fetchWorks = (type) =>
    api.get("/works", { params: type ? { type } : {} }).then((r) => r.data);
export const fetchSiteSettings = () => api.get("/site-settings").then((r) => r.data);

// ====== ADMIN: TEAM ======
export const fetchAdminTeam = (token) =>
    api.get("/admin/team", { headers: authHeader(token) }).then((r) => r.data);
export const createTeamMember = (token, payload) =>
    api.post("/admin/team", payload, { headers: authHeader(token) }).then((r) => r.data);
export const updateTeamMember = (token, id, payload) =>
    api.put(`/admin/team/${id}`, payload, { headers: authHeader(token) }).then((r) => r.data);
export const deleteTeamMember = (token, id) =>
    api.delete(`/admin/team/${id}`, { headers: authHeader(token) }).then((r) => r.data);

// ====== ADMIN: VIDEOS ======
export const fetchAdminVideos = (token) =>
    api.get("/admin/videos", { headers: authHeader(token) }).then((r) => r.data);
export const createVideo = (token, payload) =>
    api.post("/admin/videos", payload, { headers: authHeader(token) }).then((r) => r.data);
export const updateVideo = (token, id, payload) =>
    api.put(`/admin/videos/${id}`, payload, { headers: authHeader(token) }).then((r) => r.data);
export const deleteVideo = (token, id) =>
    api.delete(`/admin/videos/${id}`, { headers: authHeader(token) }).then((r) => r.data);

// ====== ADMIN: SITE SETTINGS ======
export const updateSiteSettings = (token, payload) =>
    api.put("/admin/site-settings", payload, { headers: authHeader(token) }).then((r) => r.data);

// ====== ADMIN: LEADS CSV EXPORT ======
export const downloadLeadsCsv = async (token) => {
    const res = await api.get("/admin/leads-export.csv", {
        headers: authHeader(token),
        responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mir-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

// ====== PUBLIC INVOICE + STRIPE CHECKOUT ======
export const fetchPublicInvoice = (publicToken) =>
    api.get(`/invoices/public/${publicToken}`).then((r) => r.data);
export const createInvoiceCheckout = (publicToken, originUrl) =>
    api
        .post(`/invoices/public/${publicToken}/checkout`, { origin_url: originUrl })
        .then((r) => r.data);
export const invoiceCheckoutStatus = (publicToken, sessionId) =>
    api
        .get(`/invoices/public/${publicToken}/checkout/${sessionId}`)
        .then((r) => r.data);

// ====== ADMIN: TRANSLATE ======
export const adminTranslate = (token, text, target_lang, source_lang = "auto") =>
    api
        .post(
            "/admin/translate",
            { text, target_lang, source_lang },
            { headers: authHeader(token) },
        )
        .then((r) => r.data);

