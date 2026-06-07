import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

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
