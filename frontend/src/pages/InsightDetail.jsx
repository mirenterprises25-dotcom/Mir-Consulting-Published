import React from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Section } from "@/components/sections/Section";
import CTASection from "@/components/sections/CTASection";
import Seo from "@/lib/Seo";
import { fetchPost } from "@/lib/api";

export default function InsightDetail() {
    const { slug } = useParams();
    const [post, setPost] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        setLoading(true);
        fetchPost(slug)
            .then((p) => setPost(p))
            .catch((e) =>
                setError(e?.response?.status === 404 ? "not-found" : "error")
            )
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-mir-bg">
                <Loader2 className="w-6 h-6 animate-spin text-mir-blue" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <Section testId="insight-not-found" className="bg-mir-bg">
                <div className="text-center max-w-xl mx-auto">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-4">
                        Insight not found
                    </div>
                    <h1 className="font-heading text-4xl text-mir-text mb-6">
                        This article isn&apos;t available.
                    </h1>
                    <p className="text-mir-muted mb-8">
                        It may have been moved or is no longer published.
                    </p>
                    <Link
                        to="/insights"
                        data-testid="insight-back-link"
                        className="inline-flex items-center gap-2 border border-mir-border hover:border-mir-blue px-6 py-3 text-sm text-mir-text"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to insights
                    </Link>
                </div>
            </Section>
        );
    }

    return (
        <div data-testid="insight-detail-page" className="bg-mir-bg">
            <Seo
                title={post.title}
                description={post.excerpt}
                path={`/insights/${post.slug}`}
            />

            {post.cover_image && (
                <div className="w-full h-[40vh] md:h-[55vh] bg-mir-midnight overflow-hidden relative">
                    <img
                        src={post.cover_image}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-mir-midnight/40 to-transparent" />
                </div>
            )}

            <Section testId="insight-detail" className="bg-mir-bg !py-16 md:!py-24">
                <Link
                    to="/insights"
                    data-testid="insight-back-link"
                    className="inline-flex items-center gap-2 text-sm text-mir-muted hover:text-mir-text mb-10"
                >
                    <ArrowLeft className="w-4 h-4" />
                    All insights
                </Link>

                <article className="max-w-3xl">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                        <BookOpen className="w-3.5 h-3.5" />
                        {post.category}
                    </div>
                    <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-light tracking-tighter leading-[1.05] text-mir-text">
                        {post.title}
                    </h1>
                    <p className="mt-8 text-lg text-mir-muted leading-relaxed">
                        {post.excerpt}
                    </p>
                    <div className="mt-6 text-xs uppercase tracking-[0.2em] text-mir-muted">
                        {post.published_at
                            ? new Date(post.published_at).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                              })
                            : ""}
                        {post.read_time ? ` · ${post.read_time}` : ""}
                    </div>
                    <div className="divider-line-soft my-12" />
                    <div
                        className="prose prose-slate max-w-none
                            prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-mir-text
                            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:font-light
                            prose-h3:text-2xl prose-h3:mt-10 prose-h3:font-medium
                            prose-p:text-mir-textSoft prose-p:leading-relaxed
                            prose-a:text-mir-blue prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-mir-text
                            prose-ul:text-mir-textSoft prose-ol:text-mir-textSoft
                            prose-li:my-1
                            prose-blockquote:border-l-mir-blue prose-blockquote:text-mir-text prose-blockquote:not-italic
                            prose-code:text-mir-blueInk prose-code:bg-mir-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none
                            prose-img:border prose-img:border-mir-border"
                        data-testid="insight-content"
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {post.content}
                        </ReactMarkdown>
                    </div>
                </article>
            </Section>

            <CTASection
                title="Want to discuss the ideas in this article?"
                subtitle="Reach out — a senior MIR consultant will engage directly with your context."
                ctaLabel="Start a conversation"
                secondaryLabel="More insights"
                secondaryTo="/insights"
            />
        </div>
    );
}
