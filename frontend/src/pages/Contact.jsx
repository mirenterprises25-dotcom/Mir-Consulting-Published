import React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, MapPin, Phone, ArrowRight, Loader2 } from "lucide-react";
import { Section } from "@/components/sections/Section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { submitLead } from "@/lib/api";
import Seo from "@/lib/Seo";

const INDUSTRIES = [
    "Hospitality",
    "Retail / E-commerce",
    "Logistics",
    "Supply Chain",
    "Manufacturing",
    "Technology",
    "SME / Growing business",
    "Other",
];

const SERVICES = [
    "Business Consulting",
    "Analytics & Business Intelligence",
    "IT Consulting",
    "Process Automation",
    "Software Architecture",
    "Digital Transformation",
    "Not sure yet",
];

export default function Contact() {
    const [loading, setLoading] = React.useState(false);
    const [form, setForm] = React.useState({
        full_name: "",
        email: "",
        company: "",
        phone: "",
        industry: "",
        service_interest: "",
        message: "",
    });

    const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.message) {
            toast.error("Please fill in your name, email and message.");
            return;
        }
        if (form.message.length < 10) {
            toast.error("Message should be at least 10 characters.");
            return;
        }
        setLoading(true);
        try {
            await submitLead(form);
            toast.success("Consultation request received. We'll be in touch shortly.");
            setForm({
                full_name: "",
                email: "",
                company: "",
                phone: "",
                industry: "",
                service_interest: "",
                message: "",
            });
        } catch (err) {
            const msg =
                err?.response?.data?.detail?.[0]?.msg ||
                err?.response?.data?.detail ||
                "Something went wrong. Please try again.";
            toast.error(typeof msg === "string" ? msg : "Unable to submit form.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        "bg-white border-mir-border rounded-none h-12 focus-visible:ring-mir-blue focus-visible:ring-offset-0 focus-visible:border-mir-blue text-mir-text placeholder:text-mir-muted/70";

    return (
        <div data-testid="contact-page" className="bg-mir-bg">
            <Seo
                title="Contact"
                path="/contact"
                description="Tell us about your operating challenge. A senior MIR Consulting partner will respond — usually within one business day."
            />
            <Section testId="contact-hero" className="relative grain-overlay bg-mir-bg">
                <div className="absolute inset-0 grid-backdrop opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_top_right,_black_30%,_transparent_70%)]" />
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full halo blur-2xl pointer-events-none" />
                <div className="relative">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                        Contact
                    </div>
                    <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.05] max-w-5xl text-mir-text">
                        Let&apos;s talk about your{" "}
                        <span className="text-mir-blue">operating challenge</span>.
                    </h1>
                    <p className="mt-10 text-lg sm:text-xl text-mir-muted max-w-3xl leading-relaxed">
                        Share a brief outline of your business context. A senior MIR
                        Consulting partner will respond — usually within one business
                        day — with a structured next step.
                    </p>
                </div>
            </Section>

            <Section testId="contact-form-section" className="border-t border-mir-border bg-mir-surface">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <motion.form
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        onSubmit={onSubmit}
                        data-testid="contact-form"
                        className="lg:col-span-7 border border-mir-border bg-white p-8 md:p-10 space-y-6 shadow-[0_1px_0_0_rgba(15,23,42,0.04)]"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name" className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                    Full name *
                                </Label>
                                <Input
                                    id="full_name"
                                    data-testid="contact-input-name"
                                    value={form.full_name}
                                    onChange={(e) => update("full_name", e.target.value)}
                                    placeholder="Jane Doe"
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                    Work email *
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    data-testid="contact-input-email"
                                    value={form.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    placeholder="jane@company.com"
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                    Company
                                </Label>
                                <Input
                                    id="company"
                                    data-testid="contact-input-company"
                                    value={form.company}
                                    onChange={(e) => update("company", e.target.value)}
                                    placeholder="Acme Corp"
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    data-testid="contact-input-phone"
                                    value={form.phone}
                                    onChange={(e) => update("phone", e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                    Industry
                                </Label>
                                <Select
                                    value={form.industry}
                                    onValueChange={(v) => update("industry", v)}
                                >
                                    <SelectTrigger
                                        data-testid="contact-select-industry"
                                        className="bg-white border-mir-border rounded-none h-12 focus:ring-mir-blue text-mir-text"
                                    >
                                        <SelectValue placeholder="Select an industry" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-mir-border rounded-none">
                                        {INDUSTRIES.map((i) => (
                                            <SelectItem
                                                key={i}
                                                value={i}
                                                data-testid={`industry-option-${i.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                            >
                                                {i}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                    Service interest
                                </Label>
                                <Select
                                    value={form.service_interest}
                                    onValueChange={(v) => update("service_interest", v)}
                                >
                                    <SelectTrigger
                                        data-testid="contact-select-service"
                                        className="bg-white border-mir-border rounded-none h-12 focus:ring-mir-blue text-mir-text"
                                    >
                                        <SelectValue placeholder="Select a service" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-mir-border rounded-none">
                                        {SERVICES.map((i) => (
                                            <SelectItem
                                                key={i}
                                                value={i}
                                                data-testid={`service-option-${i.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                            >
                                                {i}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-xs uppercase tracking-[0.2em] text-mir-muted">
                                Your message *
                            </Label>
                            <Textarea
                                id="message"
                                data-testid="contact-input-message"
                                value={form.message}
                                onChange={(e) => update("message", e.target.value)}
                                placeholder="Tell us about your operating context, current challenges, and what you'd like to explore..."
                                rows={6}
                                className="bg-white border-mir-border rounded-none focus-visible:ring-mir-blue focus-visible:ring-offset-0 focus-visible:border-mir-blue text-mir-text placeholder:text-mir-muted/70"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            data-testid="contact-submit-button"
                            className="group inline-flex items-center justify-center gap-3 bg-mir-midnight hover:bg-mir-blue disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 text-sm font-medium tracking-wide transition-colors w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending request...
                                </>
                            ) : (
                                <>
                                    Send Consultation Request
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        <p className="text-xs text-mir-muted">
                            By submitting this form, you agree to be contacted by MIR
                            Consulting regarding your inquiry.
                        </p>
                    </motion.form>

                    <aside className="lg:col-span-5 space-y-6">
                        <div className="border border-mir-border bg-white p-8">
                            <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                                Direct channels
                            </div>
                            <ul className="space-y-5 text-sm">
                                <li className="flex items-start gap-4">
                                    <Mail className="w-5 h-5 text-mir-blue shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-mir-muted text-xs uppercase tracking-[0.2em]">
                                            Email
                                        </div>
                                        <a
                                            href="mailto:mirconsulting26@gmail.com"
                                            data-testid="contact-info-email"
                                            className="text-mir-text hover:text-mir-blue transition-colors"
                                        >
                                            mirconsulting26@gmail.com
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <Phone className="w-5 h-5 text-mir-blue shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-mir-muted text-xs uppercase tracking-[0.2em]">
                                            Phone
                                        </div>
                                        <div className="text-mir-text">
                                            Available on request
                                        </div>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <MapPin className="w-5 h-5 text-mir-blue shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-mir-muted text-xs uppercase tracking-[0.2em]">
                                            Engagements
                                        </div>
                                        <div className="text-mir-text">
                                            Global remote · Onsite for select clients
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="border border-mir-blue/40 bg-mir-blue/5 p-8">
                            <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-3">
                                Response time
                            </div>
                            <div className="font-heading text-2xl text-mir-text mb-2">
                                ≤ 1 business day
                            </div>
                            <p className="text-sm text-mir-muted leading-relaxed">
                                All inbound consultation requests are reviewed and routed
                                directly to a senior consultant — never a sales gatekeeper.
                            </p>
                        </div>

                        <div className="border border-mir-border bg-white p-8">
                            <div className="text-[11px] uppercase tracking-[0.25em] text-mir-muted mb-4">
                                What happens next
                            </div>
                            <ol className="space-y-4 text-sm text-mir-textSoft">
                                <li className="flex gap-4">
                                    <span className="font-heading text-mir-blue font-medium">01</span>
                                    A senior consultant reviews your context.
                                </li>
                                <li className="flex gap-4">
                                    <span className="font-heading text-mir-blue font-medium">02</span>
                                    We schedule a 30-minute discovery call.
                                </li>
                                <li className="flex gap-4">
                                    <span className="font-heading text-mir-blue font-medium">03</span>
                                    You receive a written, tailored next step.
                                </li>
                            </ol>
                        </div>
                    </aside>
                </div>
            </Section>
        </div>
    );
}
