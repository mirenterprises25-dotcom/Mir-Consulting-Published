import React from "react";
import { motion } from "framer-motion";
import { Linkedin, ChevronLeft, ChevronRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/sections/Section";
import { fetchTeam } from "@/lib/api";

export default function TeamSection() {
    const [members, setMembers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const scrollerRef = React.useRef(null);

    React.useEffect(() => {
        fetchTeam()
            .then((data) => setMembers(data || []))
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, []);

    const scrollBy = (dir) => {
        const node = scrollerRef.current;
        if (!node) return;
        const card = node.querySelector("[data-team-card]");
        const step = (card?.clientWidth || 320) + 24;
        node.scrollBy({ left: dir * step, behavior: "smooth" });
    };

    if (loading) return null;
    if (members.length === 0) return null;

    return (
        <Section testId="about-team" className="border-t border-mir-border bg-mir-bg">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
                <SectionHeader
                    overline="The team"
                    title={
                        <>
                            Senior practitioners behind every <span className="text-mir-blue">engagement</span>.
                        </>
                    }
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => scrollBy(-1)}
                        data-testid="team-scroll-prev"
                        aria-label="Previous"
                        className="w-11 h-11 border border-mir-border bg-white hover:border-mir-blue hover:text-mir-blue transition-colors inline-flex items-center justify-center"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollBy(1)}
                        data-testid="team-scroll-next"
                        aria-label="Next"
                        className="w-11 h-11 border border-mir-border bg-white hover:border-mir-blue hover:text-mir-blue transition-colors inline-flex items-center justify-center"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollerRef}
                data-testid="team-scroller"
                className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:-mx-8 lg:px-8"
                style={{ scrollbarWidth: "none" }}
            >
                {members.map((m, i) => (
                    <motion.article
                        key={m.id}
                        data-team-card
                        data-testid={`team-card-${m.id}`}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.45, delay: i * 0.05 }}
                        className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-white border border-mir-border p-6 flex flex-col"
                    >
                        <div className="aspect-square bg-mir-surface border border-mir-border overflow-hidden mb-5">
                            {m.photo ? (
                                <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-mir-muted text-xs">
                                    {m.name?.[0] || "?"}
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-mir-blue mb-2">
                            {m.role}
                        </div>
                        <div className="font-heading text-xl font-medium text-mir-text">{m.name}</div>
                        <p className="mt-3 text-sm text-mir-muted leading-relaxed line-clamp-5">
                            {m.bio}
                        </p>
                        {m.expertise && m.expertise.length > 0 && (
                            <div className="mt-5 flex flex-wrap gap-1.5">
                                {m.expertise.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[10px] uppercase tracking-[0.15em] border border-mir-border text-mir-textSoft px-2 py-1"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        {m.linkedin && (
                            <a
                                href={m.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                data-testid={`team-linkedin-${m.id}`}
                                className="mt-auto pt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-mir-blue hover:underline"
                            >
                                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                            </a>
                        )}
                    </motion.article>
                ))}
            </div>
        </Section>
    );
}
