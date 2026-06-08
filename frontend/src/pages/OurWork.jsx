import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Briefcase, PlayCircle } from "lucide-react";
import { Section } from "@/components/sections/Section";
import CTASection from "@/components/sections/CTASection";
import Seo from "@/lib/Seo";
import { fetchWorks } from "@/lib/api";

const TABS = [
    { key: "all", label: "All work" },
    { key: "case_study", label: "Case studies" },
    { key: "insight", label: "Insights" },
    { key: "video", label: "Videos" },
];

const TYPE_ICON = {
    insight: BookOpen,
    case_study: Briefcase,
    video: PlayCircle,
};

const TYPE_LABEL = {
    insight: "Insight",
    case_study: "Case Study",
    video: "Video",
};

export default function OurWork() {
    const [items, setItems] = React.useState(null);
    const [tab, setTab] = React.useState("all");
    const [category, setCategory] = React.useState("all");

    React.useEffect(() => {
        fetchWorks()
            .then(setItems)
            .catch(() => setItems([]));
    }, []);

    const visibleByTab = (items || []).filter((it) => tab === "all" || it.type === tab);
    const categories = React.useMemo(() => {
        const set = new Set();
        visibleByTab.forEach((it) => {
            if (it.category) set.add(it.category);
        });
        return Array.from(set).sort();
    }, [visibleByTab]);
    // Reset category when it disappears for the current tab
    React.useEffect(() => {
        if (category !== "all" && !categories.includes(category)) setCategory("all");
    }, [categories, category]);
    const filtered = visibleByTab.filter((it) => category === "all" || it.category === category);

    return (
        <div data-testid="our-work-page" className="bg-mir-bg">
            <Seo
                title="Our Work"
                description="Case studies, senior perspectives and video conversations from MIR Consulting — engagements, frameworks and operating insight in one place."
                path="/our-work"
            />
            <Section testId="our-work-hero" className="relative grain-overlay bg-mir-bg">
                <div className="absolute inset-0 grid-backdrop opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,_black_30%,_transparent_70%)]" />
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full halo blur-2xl pointer-events-none" />
                <div className="relative">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                        Our Work
                    </div>
                    <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.05] max-w-5xl text-mir-text">
                        Engagements, frameworks and{" "}
                        <span className="text-mir-blue">conversations</span> — all in one place.
                    </h1>
                    <p className="mt-10 text-lg sm:text-xl text-mir-muted max-w-3xl leading-relaxed">
                        A curated stream of what we&apos;ve done and what we think. Filter by case
                        study, insight or video conversation.
                    </p>
                </div>
            </Section>

            <Section testId="our-work-list" className="border-t border-mir-border bg-mir-surface">
                <div className="mb-6 flex flex-wrap gap-2" data-testid="our-work-tabs">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            data-testid={`our-work-tab-${t.key}`}
                            className={`px-5 py-2.5 text-xs uppercase tracking-[0.2em] border transition-colors ${
                                tab === t.key
                                    ? "border-mir-blue text-mir-blue bg-white"
                                    : "border-mir-border text-mir-textSoft hover:border-mir-text hover:text-mir-text"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {categories.length > 0 && (
                    <div
                        className="mb-10 flex flex-wrap items-center gap-2"
                        data-testid="our-work-categories"
                    >
                        <span className="text-[10px] uppercase tracking-[0.25em] text-mir-muted mr-2">
                            Topic
                        </span>
                        <button
                            onClick={() => setCategory("all")}
                            data-testid="our-work-category-all"
                            className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                                category === "all"
                                    ? "border-mir-text text-mir-text bg-white"
                                    : "border-mir-border text-mir-textSoft hover:border-mir-text hover:text-mir-text"
                            }`}
                        >
                            All
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                data-testid={`our-work-category-${c.replace(/\s+/g, "-").toLowerCase()}`}
                                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                                    category === c
                                        ? "border-mir-text text-mir-text bg-white"
                                        : "border-mir-border text-mir-textSoft hover:border-mir-text hover:text-mir-text"
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                {items === null ? (
                    <div className="py-20 text-center text-mir-muted text-sm" data-testid="our-work-loading">
                        Loading…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-mir-muted" data-testid="our-work-empty">
                        Nothing published in this category yet — check back soon.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-mir-border border border-mir-border">
                        {filtered.map((item, i) => {
                            const Icon = TYPE_ICON[item.type] || BookOpen;
                            const href =
                                item.type === "video"
                                    ? `/our-work/video/${item.slug}`
                                    : item.type === "case_study"
                                    ? `/case-studies/${item.slug}`
                                    : `/insights/${item.slug}`;
                            return (
                                <motion.article
                                    key={`${item.type}-${item.slug || item.id || i}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-80px" }}
                                    transition={{ duration: 0.5, delay: i * 0.04 }}
                                    data-testid={`work-card-${item.type}-${item.slug || i}`}
                                    className="group bg-white p-8 hover:bg-mir-surface transition-colors flex flex-col"
                                >
                                    <Link to={href} className="flex flex-col h-full">
                                        {item.cover_image && (
                                            <div className="aspect-video bg-mir-surface mb-6 overflow-hidden">
                                                <img
                                                    src={item.cover_image}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-5">
                                            <Icon className="w-3.5 h-3.5" />
                                            {TYPE_LABEL[item.type]} · {item.category}
                                        </div>
                                        <h2 className="font-heading text-xl md:text-2xl tracking-tight font-medium text-mir-text leading-snug">
                                            {item.title}
                                        </h2>
                                        <p className="mt-4 text-sm text-mir-muted leading-relaxed line-clamp-3">
                                            {item.excerpt}
                                        </p>
                                        <div className="mt-auto pt-8 flex items-center justify-between text-xs text-mir-muted tracking-wide">
                                            <span>
                                                {item.published_at
                                                    ? new Date(item.published_at).toLocaleDateString("en-US", {
                                                          month: "short",
                                                          year: "numeric",
                                                      })
                                                    : ""}
                                                {item.read_time ? ` · ${item.read_time}` : ""}
                                            </span>
                                            <span className="inline-flex items-center gap-2 text-mir-blue text-sm font-medium">
                                                Open
                                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.article>
                            );
                        })}
                    </div>
                )}
            </Section>

            <CTASection
                title="Want a similar engagement at your organization?"
                subtitle="The first conversation is always senior-led, candid, and structured."
            />
        </div>
    );
}
