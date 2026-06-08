import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Section } from "@/components/sections/Section";
import CTASection from "@/components/sections/CTASection";
import Seo from "@/lib/Seo";
import { INDUSTRIES } from "@/lib/content";

const IMAGES = {
    hospitality:
        "https://images.unsplash.com/photo-1551918120-9739cb430c6d?auto=format&fit=crop&q=80&w=1600",
    retail:
        "https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&q=80&w=1600",
    logistics:
        "https://images.unsplash.com/photo-1557761469-f29c6e201784?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwbG9naXN0aWNzJTIwd2FyZWhvdXNlJTIwYWJzdHJhY3R8ZW58MHx8fHwxNzgwODQ0NTUyfDA&ixlib=rb-4.1.0&q=85",
    manufacturing:
        "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=1600",
    technology:
        "https://images.pexels.com/photos/8640331/pexels-photo-8640331.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    smes:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600",
};

export default function Industries() {
    return (
        <div data-testid="industries-page" className="bg-mir-bg">
            <Seo
                title="Industries"
                path="/industries"
                description="Operational depth across hospitality, retail, logistics, manufacturing, technology and SMEs — discover how MIR Consulting tailors strategy and intelligence to each sector."
            />
            <Section testId="industries-hero" className="relative grain-overlay bg-mir-bg">
                <div className="absolute inset-0 grid-backdrop opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,_black_30%,_transparent_70%)]" />
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full halo blur-2xl pointer-events-none" />
                <div className="relative">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                        Industries
                    </div>
                    <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.05] max-w-5xl text-mir-text">
                        Operational depth across the sectors{" "}
                        <span className="text-mir-blue">that matter most</span>.
                    </h1>
                    <p className="mt-10 text-lg sm:text-xl text-mir-muted max-w-3xl leading-relaxed">
                        MIR Consulting brings sector-specific fluency to every engagement.
                        We speak the operating language of your business — not the
                        language of generic playbooks.
                    </p>
                </div>
            </Section>

            <Section testId="industries-list" className="border-t border-mir-border !py-12 bg-mir-bg">
                <div className="space-y-px">
                    {INDUSTRIES.map((ind, i) => (
                        <motion.div
                            key={ind.slug}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5 }}
                            data-testid={`industry-detail-${ind.slug}`}
                            className="grid grid-cols-1 lg:grid-cols-12 border border-mir-border bg-white"
                        >
                            <div className="lg:col-span-5 relative min-h-[300px] overflow-hidden border-b lg:border-b-0 lg:border-r border-mir-border bg-mir-midnight">
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-70"
                                    style={{ backgroundImage: `url(${IMAGES[ind.slug]})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-mir-midnight via-mir-midnight/70 to-transparent" />
                                <div className="relative h-full p-8 md:p-12 flex flex-col justify-end">
                                    <div className="font-heading text-mir-blueSoft text-sm tracking-widest mb-4">
                                        Sector /0{i + 1}
                                    </div>
                                    <h2 className="font-heading text-3xl md:text-4xl font-light tracking-tight text-white">
                                        {ind.title}
                                    </h2>
                                    <p className="mt-4 text-white/80 text-sm max-w-md leading-relaxed">
                                        {ind.summary}
                                    </p>
                                </div>
                            </div>
                            <div className="lg:col-span-7 p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div>
                                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mb-5">
                                        Challenges
                                    </div>
                                    <ul className="space-y-3">
                                        {ind.challenges.map((c) => (
                                            <li
                                                key={c}
                                                className="flex items-start gap-3 text-sm text-mir-textSoft"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-mir-blue mt-2 shrink-0" />
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mb-5">
                                        Our solutions
                                    </div>
                                    <ul className="space-y-3">
                                        {ind.solutions.map((s) => (
                                            <li
                                                key={s}
                                                className="flex items-start gap-3 text-sm text-mir-text"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-mir-blue mt-2 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mb-5">
                                        Use cases
                                    </div>
                                    <ul className="space-y-3">
                                        {ind.useCases.map((u) => (
                                            <li
                                                key={u}
                                                className="text-sm text-mir-textSoft"
                                            >
                                                — {u}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        to="/contact"
                                        data-testid={`industry-cta-${ind.slug}`}
                                        className="mt-8 group inline-flex items-center gap-2 text-sm text-mir-blue font-medium"
                                    >
                                        Discuss {ind.title.split(/&| /)[0].toLowerCase()}
                                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            <CTASection
                title="Don't see your sector? We probably still understand it."
                subtitle="MIR Consulting routinely engages adjacent sectors. Tell us about your business and we'll respond with a tailored perspective."
            />
        </div>
    );
}
