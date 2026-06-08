import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowUpRight, Sparkles, ShieldCheck, BrainCircuit, Gauge } from "lucide-react";
import Hero from "@/components/sections/Hero";
import ServicesPreview from "@/components/sections/ServicesPreview";
import IndustriesPreview from "@/components/sections/IndustriesPreview";
import CTASection from "@/components/sections/CTASection";
import { Section, SectionHeader, StatBlock } from "@/components/sections/Section";
import { INDUSTRY_TAGS } from "@/lib/content";
import { Link } from "react-router-dom";
import Seo from "@/lib/Seo";

const ABOUT_IMAGE =
    "https://images.pexels.com/photos/7108269/pexels-photo-7108269.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const WHY = [
    {
        icon: BrainCircuit,
        title: "Data-driven decisions",
        body: "Every recommendation is grounded in evidence — from operational data, financial signals and live business telemetry.",
    },
    {
        icon: ShieldCheck,
        title: "Business-first mindset",
        body: "Technology serves the business — not the other way around. We design programs around measurable operating outcomes.",
    },
    {
        icon: Gauge,
        title: "Operational depth",
        body: "Hospitality, retail, logistics, manufacturing — we bring sector-specific operational fluency, not generic playbooks.",
    },
    {
        icon: Sparkles,
        title: "Customized solutions",
        body: "No two engagements look alike. We build tailored tools, dashboards and automations that fit how your business actually runs.",
    },
];

export default function Home() {
    return (
        <div data-testid="home-page" className="bg-mir-bg">
            <Seo
                path="/"
                description="MIR Consulting delivers premium strategy, technology and intelligence services — building tailored automations, analytics and digital transformation programmes for enterprises across finance, energy, healthcare and the public sector."
                schema={{
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    name: "MIR Consulting",
                    url: typeof window !== "undefined" ? window.location.origin : "",
                    logo: "/og-cover.jpg",
                    sameAs: [],
                }}
            />
            <Hero />

            <Section testId="trust-indicators-section" className="!py-16 border-t border-mir-border bg-mir-bg">
                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mb-8">
                    Operationally fluent across
                </div>
                <div className="flex flex-wrap gap-x-12 gap-y-6">
                    {INDUSTRY_TAGS.map((t) => (
                        <div
                            key={t}
                            data-testid={`trust-tag-${t.toLowerCase().replace(/\s+/g, "-")}`}
                            className="font-heading text-xl md:text-2xl text-mir-textSoft/50 hover:text-mir-text transition-colors tracking-tight"
                        >
                            {t}
                        </div>
                    ))}
                </div>
            </Section>

            <Section testId="home-about-section" className="border-t border-mir-border bg-mir-surface">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-6 relative"
                    >
                        <div className="relative aspect-[4/5] border border-mir-border overflow-hidden bg-mir-midnight">
                            <img
                                src={ABOUT_IMAGE}
                                alt="Consulting session at MIR Consulting"
                                className="absolute inset-0 w-full h-full object-cover opacity-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-mir-midnight/85 via-mir-midnight/20 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 border border-mir-blue/50 bg-white/90 backdrop-blur-md p-5">
                                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-2">
                                    Operating philosophy
                                </div>
                                <div className="font-heading text-lg text-mir-text leading-snug">
                                    Bridge business operations, technology and data — in one
                                    coherent practice.
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="lg:col-span-6">
                        <SectionHeader
                            overline="About MIR Consulting"
                            title={
                                <>
                                    Where{" "}
                                    <span className="text-mir-blue">business operations</span>,
                                    technology and data intelligence converge.
                                </>
                            }
                            subtitle="MIR Consulting partners with leadership teams to optimize systems, scale intelligently and improve operational efficiency. We bring strategic clarity and a builder's mindset to every engagement."
                        />
                        <div className="mt-10 grid grid-cols-3 gap-6">
                            <StatBlock value="6+" label="Practice areas" testId="stat-practice-areas" />
                            <StatBlock value="7+" label="Industries served" testId="stat-industries" />
                            <StatBlock value="100%" label="Tailored engagements" testId="stat-tailored" />
                        </div>
                        <div className="mt-10">
                            <Link
                                to="/about"
                                data-testid="home-about-cta"
                                className="group inline-flex items-center gap-3 border border-mir-text/15 hover:border-mir-blue px-6 py-3 text-sm text-mir-text transition-colors"
                            >
                                Read our story
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </Section>

            <ServicesPreview />
            <IndustriesPreview />

            <Section testId="why-mir-section" className="border-t border-mir-border bg-mir-bg">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    <div className="lg:col-span-7">
                        <SectionHeader
                            overline="Why MIR Consulting"
                            title={
                                <>
                                    Trusted by leadership teams that{" "}
                                    <span className="text-mir-blue">refuse to settle</span>{" "}
                                    for generic consulting.
                                </>
                            }
                            subtitle="A premium consulting practice that combines executive-level strategic depth with hands-on technical execution."
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-mir-border border border-mir-border">
                    {WHY.map((w) => {
                        const Icon = w.icon;
                        return (
                            <motion.div
                                key={w.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.5 }}
                                className="bg-white p-10 hover:bg-mir-surface transition-colors"
                                data-testid={`why-card-${w.title.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                                <div className="flex items-start gap-6">
                                    <div className="w-12 h-12 border border-mir-blue/30 bg-mir-blue/8 flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-mir-blue" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading text-xl md:text-2xl font-medium text-mir-text">
                                            {w.title}
                                        </h3>
                                        <p className="mt-3 text-sm text-mir-muted leading-relaxed">
                                            {w.body}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        "Scalable consulting engagements",
                        "Senior-only delivery teams",
                        "Executive-grade documentation",
                    ].map((t) => (
                        <div
                            key={t}
                            className="flex items-start gap-3 p-6 border border-mir-border bg-white"
                            data-testid={`promise-${t.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                            <CheckCircle2 className="w-5 h-5 text-mir-blue mt-0.5" />
                            <span className="text-sm text-mir-textSoft">{t}</span>
                        </div>
                    ))}
                </div>
            </Section>

            <CTASection />
        </div>
    );
}
