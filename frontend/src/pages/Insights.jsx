import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Section } from "@/components/sections/Section";
import CTASection from "@/components/sections/CTASection";
import Seo from "@/lib/Seo";
import { INSIGHTS as FALLBACK } from "@/lib/content";
import { fetchPosts } from "@/lib/api";

export default function Insights() {
    const [posts, setPosts] = React.useState(null);
    const [usingFallback, setUsingFallback] = React.useState(false);

    React.useEffect(() => {
        fetchPosts()
            .then((data) => {
                if (data && data.length > 0) {
                    setPosts(data);
                } else {
                    setPosts(FALLBACK);
                    setUsingFallback(true);
                }
            })
            .catch(() => {
                setPosts(FALLBACK);
                setUsingFallback(true);
            });
    }, []);

    const items = posts || [];

    return (
        <div data-testid="insights-page" className="bg-mir-bg">
            <Seo
                title="Insights"
                description="Senior perspectives from MIR Consulting on strategy, data, dashboards, automation and digital transformation."
                path="/insights"
            />
            <Section testId="insights-hero" className="relative grain-overlay bg-mir-bg">
                <div className="absolute inset-0 grid-backdrop opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,_black_30%,_transparent_70%)]" />
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full halo blur-2xl pointer-events-none" />
                <div className="relative">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                        Insights
                    </div>
                    <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.05] max-w-5xl text-mir-text">
                        Perspectives from MIR Consulting on{" "}
                        <span className="text-mir-blue">strategy, data and operations</span>.
                    </h1>
                    <p className="mt-10 text-lg sm:text-xl text-mir-muted max-w-3xl leading-relaxed">
                        Pragmatic, senior-authored writing on dashboards, automation,
                        business intelligence, digital transformation and operational
                        excellence — written for operators, not buzzword chasers.
                    </p>
                </div>
            </Section>

            <Section testId="insights-list" className="border-t border-mir-border bg-mir-surface">
                {items.length === 0 && posts !== null ? (
                    <div className="text-mir-muted text-center py-20" data-testid="insights-empty">
                        No published articles yet — check back soon.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-mir-border border border-mir-border">
                        {items.map((post, i) => {
                            const featured = i === 0;
                            const isFallback = usingFallback || !post.slug;
                            const inner = (
                                <>
                                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        {post.category}
                                    </div>
                                    <h2
                                        className={`font-heading font-medium text-mir-text leading-tight ${
                                            featured
                                                ? "text-3xl md:text-4xl lg:text-5xl tracking-tighter font-light"
                                                : "text-xl md:text-2xl tracking-tight"
                                        }`}
                                    >
                                        {post.title}
                                    </h2>
                                    <p
                                        className={`mt-5 text-mir-muted leading-relaxed ${
                                            featured ? "text-base max-w-2xl" : "text-sm"
                                        }`}
                                    >
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-auto pt-8 flex items-center justify-between text-xs text-mir-muted tracking-wide">
                                        <span>
                                            {post.date ||
                                                (post.published_at
                                                    ? new Date(post.published_at).toLocaleDateString(
                                                          "en-US",
                                                          {
                                                              month: "short",
                                                              year: "numeric",
                                                          }
                                                      )
                                                    : "")}
                                            {post.read_time || post.readTime
                                                ? ` · ${post.read_time || post.readTime}`
                                                : ""}
                                        </span>
                                        <span className="inline-flex items-center gap-2 text-mir-blue text-sm font-medium">
                                            Read article
                                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </span>
                                    </div>
                                </>
                            );
                            const cls = `group bg-white p-8 md:p-10 hover:bg-mir-surface transition-colors flex flex-col ${
                                featured
                                    ? "md:col-span-12 lg:col-span-8 md:row-span-2 min-h-[420px]"
                                    : "md:col-span-12 lg:col-span-4"
                            }`;
                            return (
                                <motion.article
                                    key={post.slug || post.id || i}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-80px" }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    data-testid={`insight-card-${post.slug || i}`}
                                    className={cls}
                                >
                                    {isFallback ? (
                                        inner
                                    ) : (
                                        <Link to={`/insights/${post.slug}`} className="flex flex-col h-full">
                                            {inner}
                                        </Link>
                                    )}
                                </motion.article>
                            );
                        })}
                    </div>
                )}
            </Section>

            <CTASection
                title="Want our perspective on your specific operating challenge?"
                subtitle="Send context. We'll respond with a written, senior point of view — even before any engagement begins."
                ctaLabel="Request a perspective"
                secondaryLabel="See services"
                secondaryTo="/services"
            />
        </div>
    );
}
