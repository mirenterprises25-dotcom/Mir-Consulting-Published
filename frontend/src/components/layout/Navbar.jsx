import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ArrowUpRight, Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
    { code: "en", label: "English", short: "EN" },
    { code: "de", label: "Deutsch", short: "DE" },
    { code: "es", label: "Español", short: "ES" },
];

export default function Navbar() {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [langOpen, setLangOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);
    const langRef = React.useRef(null);

    React.useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    React.useEffect(() => {
        const onClick = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) {
                setLangOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const LINKS = [
        { to: "/", label: t("nav.home"), key: "home" },
        { to: "/about", label: t("nav.about"), key: "about" },
        { to: "/services", label: t("nav.services"), key: "services" },
        { to: "/industries", label: t("nav.industries"), key: "industries" },
        { to: "/insights", label: t("nav.insights"), key: "insights" },
        { to: "/case-studies", label: t("nav.case_studies"), key: "case-studies" },
        { to: "/contact", label: t("nav.contact"), key: "contact" },
    ];

    const current =
        LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ||
        LANGUAGES.find((l) => l.code === (i18n.language || "").slice(0, 2)) ||
        LANGUAGES[0];

    const setLang = (code) => {
        i18n.changeLanguage(code);
        setLangOpen(false);
    };

    return (
        <header
            data-testid="site-navbar"
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "backdrop-blur-xl bg-white/85 border-b border-mir-border shadow-[0_1px_0_0_rgba(15,23,42,0.04)]"
                    : "bg-transparent"
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
                <Link
                    to="/"
                    data-testid="navbar-logo-link"
                    className="flex items-center gap-3 group"
                    onClick={() => setOpen(false)}
                >
                    <div className="w-9 h-9 border border-mir-blue/40 flex items-center justify-center bg-mir-blue/8 group-hover:bg-mir-blue/15 transition-colors">
                        <span className="font-heading font-bold text-mir-blue text-sm tracking-tighter">
                            M
                        </span>
                    </div>
                    <div className="leading-none">
                        <div className="font-heading text-lg font-semibold text-mir-text tracking-tight">
                            MIR <span className="text-mir-muted font-light">Consulting</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-mir-blue mt-1">
                            {t("home.kicker")}
                        </div>
                    </div>
                </Link>

                <nav className="hidden lg:flex items-center gap-1" data-testid="navbar-desktop-nav">
                    {LINKS.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            end={l.to === "/"}
                            data-testid={`nav-link-${l.key}`}
                            className={({ isActive }) =>
                                `px-4 py-2 text-sm tracking-wide transition-colors ${
                                    isActive
                                        ? "text-mir-blue"
                                        : "text-mir-textSoft/85 hover:text-mir-text"
                                }`
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden lg:flex items-center gap-3">
                    <div className="relative" ref={langRef}>
                        <button
                            onClick={() => setLangOpen((v) => !v)}
                            data-testid="navbar-language-toggle"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-mir-textSoft hover:text-mir-text border border-transparent hover:border-mir-border transition-colors"
                            aria-haspopup="listbox"
                            aria-expanded={langOpen}
                        >
                            <Globe className="w-3.5 h-3.5 text-mir-blue" />
                            {current.short}
                        </button>
                        {langOpen && (
                            <div
                                data-testid="navbar-language-menu"
                                className="absolute right-0 mt-2 w-48 bg-white border border-mir-border shadow-[0_8px_30px_0_rgba(15,23,42,0.08)] py-2"
                                role="listbox"
                            >
                                {LANGUAGES.map((l) => {
                                    const active = l.code === current.code;
                                    return (
                                        <button
                                            key={l.code}
                                            onClick={() => setLang(l.code)}
                                            data-testid={`navbar-language-${l.code}`}
                                            className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                                                active
                                                    ? "text-mir-blue bg-mir-blue/5"
                                                    : "text-mir-text hover:bg-mir-surface"
                                            }`}
                                            role="option"
                                            aria-selected={active}
                                        >
                                            <span>{l.label}</span>
                                            {active && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <Link
                        to="/contact"
                        data-testid="navbar-cta-book"
                        className="group inline-flex items-center gap-2 bg-mir-midnight hover:bg-mir-blue text-white px-5 py-3 text-sm font-medium transition-colors"
                    >
                        {t("nav.book")}
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>

                <button
                    data-testid="navbar-mobile-toggle"
                    className="lg:hidden text-mir-text p-2"
                    onClick={() => setOpen((o) => !o)}
                    aria-label="Toggle menu"
                >
                    {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {open && (
                <div
                    data-testid="navbar-mobile-menu"
                    className="lg:hidden border-t border-mir-border bg-white/95 backdrop-blur-xl"
                >
                    <div className="px-6 py-6 flex flex-col gap-1">
                        {LINKS.map((l) => (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                end={l.to === "/"}
                                onClick={() => setOpen(false)}
                                data-testid={`mobile-nav-link-${l.key}`}
                                className={({ isActive }) =>
                                    `px-2 py-3 text-base tracking-wide border-b border-mir-border ${
                                        isActive
                                            ? "text-mir-blue"
                                            : "text-mir-textSoft"
                                    }`
                                }
                            >
                                {l.label}
                            </NavLink>
                        ))}
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-mir-muted">
                                <Globe className="w-3.5 h-3.5 inline mr-1 text-mir-blue" />
                                {t("language.label")}
                            </span>
                            {LANGUAGES.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => setLang(l.code)}
                                    data-testid={`mobile-language-${l.code}`}
                                    className={`px-3 py-1.5 text-xs border ${
                                        l.code === current.code
                                            ? "border-mir-blue text-mir-blue"
                                            : "border-mir-border text-mir-textSoft"
                                    }`}
                                >
                                    {l.short}
                                </button>
                            ))}
                        </div>
                        <Link
                            to="/contact"
                            onClick={() => setOpen(false)}
                            data-testid="mobile-cta-book"
                            className="mt-4 inline-flex items-center justify-center gap-2 bg-mir-midnight text-white px-5 py-3 text-sm font-medium"
                        >
                            {t("nav.book")}
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
