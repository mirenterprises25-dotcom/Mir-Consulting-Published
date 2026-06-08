import React from "react";
import { motion } from "framer-motion";
import { Section, SectionHeader, StatBlock } from "@/components/sections/Section";
import CTASection from "@/components/sections/CTASection";
import { Compass, Target, Eye, HeartHandshake } from "lucide-react";
import TeamSection from "@/components/sections/TeamSection";
import Seo from "@/lib/Seo";

const PILLARS = [
    {
        icon: Target,
        title: "Our Mission",
        body: "To bridge the gap between business operations, technology and data intelligence — and engineer the next phase of operational excellence for our clients.",
    },
    {
        icon: Eye,
        title: "Our Vision",
        body: "To be the premium consulting partner of choice for operationally complex organizations modernizing how they run, scale and decide.",
    },
    {
        icon: Compass,
        title: "Our Philosophy",
        body: "Business-first, technology-aware, data-grounded. We are pragmatic builders who measure success in outcomes, not deliverables.",
    },
    {
        icon: HeartHandshake,
        title: "Our Promise",
        body: "Senior-only engagement teams. No layers of juniors. Direct partnership with leadership, end to end.",
    },
];

export default function About() {
    return (
        <div data-testid="about-page" className="bg-mir-bg">
            <Seo
                title="About"
                path="/about"
                description="Meet the senior team behind MIR Consulting — pragmatic builders bridging business operations, technology and data intelligence for ambitious enterprises."
            />
            <Section testId="about-hero" className="relative grain-overlay bg-mir-bg">
                <div className="absolute inset-0 grid-backdrop opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top_left,_black_30%,_transparent_70%)]" />
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full halo blur-2xl pointer-events-none" />
                <div className="relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                            About MIR Consulting
                        </div>
                        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.05] max-w-5xl text-mir-text">
                            A consulting practice built
                            <br />
                            for the{" "}
                            <span className="text-mir-blue">operationally complex</span>{" "}
                            era of business.
                        </h1>
                        <p className="mt-10 text-lg sm:text-xl text-mir-muted max-w-3xl leading-relaxed">
                            MIR Consulting exists because modern businesses no longer fit
                            inside legacy consulting models. Operations, technology and
                            data are now one conversation — and they deserve one partner.
                        </p>
                    </motion.div>
                </div>
            </Section>

            <Section testId="about-story" className="border-t border-mir-border bg-mir-surface">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-5">
                        <SectionHeader
                            overline="The story"
                            title={
                                <>
                                    Why <span className="text-mir-blue">MIR</span> exists.
                                </>
                            }
                        />
                    </div>
                    <div className="lg:col-span-7 space-y-6 text-mir-textSoft leading-relaxed">
                        <p>
                            MIR Consulting was founded on a simple observation: the
                            organizations driving real economic complexity — hotel groups,
                            retail chains, logistics operators, manufacturers, growth-stage
                            technology firms — were not being served well by traditional
                            consulting.
                        </p>
                        <p>
                            They didn&apos;t need slide decks. They needed clarity. They needed
                            partners who could read a P&amp;L, redesign an operating
                            model, architect a data platform and ship a dashboard —
                            without losing sight of the business outcome.
                        </p>
                        <p>
                            MIR was built to be that partner. A single, integrated practice
                            connecting{" "}
                            <span className="text-mir-blue font-medium">business strategy</span>,{" "}
                            <span className="text-mir-blue font-medium">technology</span> and{" "}
                            <span className="text-mir-blue font-medium">data intelligence</span> —
                            applied with senior craftsmanship, end to end.
                        </p>
                        <p className="text-mir-muted">
                            MIR represents reflection — a clear, intelligent mirror of how
                            a business truly performs, and a roadmap for what it can
                            become.
                        </p>
                    </div>
                </div>

                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatBlock value="6" label="Practice areas" testId="about-stat-1" />
                    <StatBlock value="7+" label="Industries served" testId="about-stat-2" />
                    <StatBlock value="100%" label="Senior-led teams" testId="about-stat-3" />
                    <StatBlock value="0" label="Templated decks" testId="about-stat-4" />
                </div>
            </Section>

            <Section testId="about-pillars" className="border-t border-mir-border bg-mir-bg">
                <SectionHeader
                    overline="What guides us"
                    title="Mission, vision and the operating principles behind every engagement."
                />
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-px bg-mir-border border border-mir-border">
                    {PILLARS.map((p) => {
                        const Icon = p.icon;
                        return (
                            <div
                                key={p.title}
                                className="bg-white p-10 hover:bg-mir-surface transition-colors"
                                data-testid={`pillar-${p.title.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                                <div className="w-12 h-12 border border-mir-blue/30 bg-mir-blue/8 flex items-center justify-center mb-6">
                                    <Icon className="w-5 h-5 text-mir-blue" />
                                </div>
                                <h3 className="font-heading text-2xl font-medium text-mir-text">
                                    {p.title}
                                </h3>
                                <p className="mt-4 text-sm text-mir-muted leading-relaxed">
                                    {p.body}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </Section>

            <TeamSection />

            <CTASection
                title="Want to talk operating models, dashboards or transformation?"
                subtitle="Reach out. The first conversation is structured, candid, and always senior-led."
            />
        </div>
    );
}
