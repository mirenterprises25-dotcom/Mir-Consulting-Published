import React from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Briefcase, CheckCircle2, Loader2 } from "lucide-react";
import { Section } from "@/components/sections/Section";
import CTASection from "@/components/sections/CTASection";
import Seo from "@/lib/Seo";
import { fetchCaseStudy } from "@/lib/api";

export default function CaseStudyDetail() {
    const { slug } = useParams();
    const [cs, setCs] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        setLoading(true);
        fetchCaseStudy(slug)
            .then((d) => setCs(d))
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

    if (error || !cs) {
        return (
            <Section testId="case-study-not-found" className="bg-mir-bg">
                <div className="text-center max-w-xl mx-auto">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-4">
                        Case study not found
                    </div>
                    <h1 className="font-heading text-4xl text-mir-text mb-6">
                        This case study isn&apos;t available.
                    </h1>
                    <p className="text-mir-muted mb-8">
                        It may have been moved or is no longer published.
                    </p>
                    <Link
                        to="/case-studies"
                        data-testid="case-study-back-link"
                        className="inline-flex items-center gap-2 border border-mir-border hover:border-mir-blue px-6 py-3 text-sm text-mir-text"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to case studies
                    </Link>
                </div>
            </Section>
        );
    }

    return (
        <div data-testid="case-study-detail-page" className="bg-mir-bg">
            <Seo
                title={cs.title}
                description={cs.summary}
                path={`/case-studies/${cs.slug}`}
            />

            {cs.cover_image && (
                <div className="w-full h-[40vh] md:h-[55vh] bg-mir-midnight overflow-hidden relative">
                    <img
                        src={cs.cover_image}
                        alt={cs.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-mir-midnight/40 to-transparent" />
                </div>
            )}

            <Section testId="case-study-detail" className="bg-mir-bg !py-16 md:!py-24">
                <Link
                    to="/case-studies"
                    data-testid="case-study-back-link"
                    className="inline-flex items-center gap-2 text-sm text-mir-muted hover:text-mir-text mb-10"
                >
                    <ArrowLeft className="w-4 h-4" />
                    All case studies
                </Link>

                <article className="max-w-3xl">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                        <Briefcase className="w-3.5 h-3.5" />
                        {cs.sector}
                    </div>
                    <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-light tracking-tighter leading-[1.05] text-mir-text">
                        {cs.title}
                    </h1>
                    <p className="mt-8 text-lg text-mir-muted leading-relaxed">
                        {cs.summary}
                    </p>
                    {cs.client_name && (
                        <div className="mt-6 text-xs uppercase tracking-[0.2em] text-mir-muted">
                            Client · {cs.client_name}
                        </div>
                    )}

                    {cs.outcomes && cs.outcomes.length > 0 && (
                        <div className="mt-10 border border-mir-border bg-white p-6 md:p-8">
                            <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-4">
                                Outcomes delivered
                            </div>
                            <ul className="space-y-3">
                                {cs.outcomes.map((o, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-3 text-sm text-mir-textSoft"
                                        data-testid={`case-study-outcome-${i}`}
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-mir-blue shrink-0 mt-0.5" />
                                        {o}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

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
                        data-testid="case-study-content"
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {cs.content}
                        </ReactMarkdown>
                    </div>
                </article>
            </Section>

            <CTASection
                title="Curious how MIR would approach an engagement like this?"
                subtitle="A senior consultant will walk you through a comparable engagement and discuss your operating context."
                ctaLabel="Request a walkthrough"
                secondaryLabel="More case studies"
                secondaryTo="/case-studies"
            />
        </div>
    );
}
