import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { Section } from "@/components/sections/Section";
import CTASection from "@/components/sections/CTASection";
import Seo from "@/lib/Seo";
import { SERVICES } from "@/lib/content";

export default function Services() {
    return (
        <div data-testid="services-page" className="bg-mir-bg">
            <Seo
                title="Services"
                path="/services"
                description="Six integrated MIR Consulting practices: strategy, technology, data & analytics, automation, transformation and intelligence — delivered by senior-only engagement teams."
            />
            <Section testId="services-hero" className="relative grain-overlay bg-mir-bg">
                <div className="absolute inset-0 grid-backdrop opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,_black_30%,_transparent_70%)]" />
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full halo blur-2xl pointer-events-none" />
                <div className="relative">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                        Services
                    </div>
                    <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.05] max-w-5xl text-mir-text">
                        Six integrated practices.
                        <br />
                        <span className="text-mir-blue">One operating partner.</span>
                    </h1>
                    <p className="mt-10 text-lg sm:text-xl text-mir-muted max-w-3xl leading-relaxed">
                        Every MIR Consulting engagement is sized to the business
                        problem — from focused dashboard programs to full
                        operating-model transformation.
                    </p>
                </div>
            </Section>

            <Section testId="services-list" className="border-t border-mir-border !py-12 bg-mir-bg">
                <div className="divide-y divide-mir-border border-y border-mir-border">
                    {SERVICES.map((s, i) => (
                        <motion.div
                            key={s.slug}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5 }}
                            data-testid={`service-detail-${s.slug}`}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-14"
                        >
                            <div className="lg:col-span-4">
                                <div className="font-heading text-mir-blue/70 text-sm tracking-widest mb-4">
                                    /0{i + 1}
                                </div>
                                <h2 className="font-heading text-3xl md:text-4xl font-light tracking-tight text-mir-text">
                                    {s.title}
                                </h2>
                                <p className="mt-3 text-mir-blueInk text-sm tracking-wide font-medium">
                                    {s.tagline}
                                </p>
                                <p className="mt-6 text-mir-muted text-sm leading-relaxed">
                                    {s.summary}
                                </p>
                                <div className="mt-8 flex flex-wrap gap-2">
                                    {s.industries.map((ind) => (
                                        <span
                                            key={ind}
                                            className="text-[11px] uppercase tracking-[0.15em] text-mir-textSoft border border-mir-border px-3 py-1.5 bg-mir-surface"
                                        >
                                            {ind}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-4">
                                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mb-5">
                                    Problems we solve
                                </div>
                                <ul className="space-y-3">
                                    {s.problems.map((p) => (
                                        <li
                                            key={p}
                                            className="flex items-start gap-3 text-sm text-mir-textSoft"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-mir-blue mt-2 shrink-0" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mt-10 mb-5">
                                    Offerings
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {s.offerings.map((o) => (
                                        <span
                                            key={o}
                                            className="text-xs text-mir-textSoft border border-mir-border bg-white px-3 py-1.5"
                                        >
                                            {o}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-4">
                                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mb-5">
                                    Outcomes
                                </div>
                                <ul className="space-y-4">
                                    {s.outcomes.map((o) => (
                                        <li
                                            key={o}
                                            className="flex items-start gap-3 text-sm text-mir-text"
                                        >
                                            <Check className="w-4 h-4 text-mir-blue mt-0.5 shrink-0" />
                                            {o}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/contact"
                                    data-testid={`service-cta-${s.slug}`}
                                    className="mt-10 group inline-flex items-center gap-2 border border-mir-text/15 hover:border-mir-blue px-5 py-3 text-sm text-mir-text transition-colors"
                                >
                                    Discuss this practice
                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            <CTASection
                title="Need a sharper view of which practice fits?"
                subtitle="Send a brief description of your operating context. We'll respond with a tailored, senior-led path forward."
                ctaLabel="Start the conversation"
                secondaryLabel="See industries"
                secondaryTo="/industries"
            />
        </div>
    );
}
