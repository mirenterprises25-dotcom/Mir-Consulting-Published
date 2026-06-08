import React from "react";
import { toast } from "sonner";
import Seo from "@/lib/Seo";
import { adminLogin } from "@/lib/api";
import LoginScreen from "@/pages/admin/LoginScreen";
import Dashboard from "@/pages/admin/Dashboard";
import { TOKEN_KEY } from "@/pages/admin/_shared";

export default function Admin() {
    const [token, setToken] = React.useState(
        () => localStorage.getItem(TOKEN_KEY) || ""
    );
    const [password, setPassword] = React.useState("");
    const [loggingIn, setLoggingIn] = React.useState(false);

    const onLogin = async (e) => {
        e.preventDefault();
        if (!password) return toast.error("Enter the admin password.");
        setLoggingIn(true);
        try {
            const res = await adminLogin(password);
            localStorage.setItem(TOKEN_KEY, res.token);
            setToken(res.token);
            toast.success("Welcome back.");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Invalid credentials");
        } finally {
            setLoggingIn(false);
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
    };

    if (!token) {
        return (
            <>
                <Seo title="Admin Sign In" path="/admin" noIndex />
                <LoginScreen
                    password={password}
                    setPassword={setPassword}
                    onLogin={onLogin}
                    loading={loggingIn}
                />
            </>
        );
    }

    return (
        <>
            <Seo title="Admin Dashboard" path="/admin" noIndex />
            <Dashboard token={token} onLogout={logout} onAuthExpired={logout} />
        </>
    );
}
