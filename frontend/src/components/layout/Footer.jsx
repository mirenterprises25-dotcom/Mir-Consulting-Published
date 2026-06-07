import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Linkedin, ArrowUpRight } from "lucide-react";

export default function Footer() {
    return (
        <footer
            data-testid="site-footer"
            className="bg-mir-midnight text-white mt-24 relative overflow-hidden"
        >
            <div className="absolute inset-0 grid-backdrop-dark opacity-20 pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-mir-blue/20 blur-[140px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    <div className="md:col-span-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 border border-mir-blue/60 flex items-center justify-center bg-mir-blue/15">
                                <span className="font-heading font-bold text-mir-blueSoft tracking-tighter">
                                    M
                                </span>
                            </div>
                            <div>
                                <div className="font-heading text-xl font-semibold tracking-tight text-white">
                                    MIR{" "}
                                    <span className="text-white/60 font-light">
                                        Consulting
                                    </span>
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.25em] text-mir-blueSoft mt-1">
                                    Strategy · Technology · Intelligence
                                </div>
                            </div>
                        </div>
                        <p className="text-white/65 text-sm leading-relaxed max-w-md">
                            MIR Consulting helps organizations modernize operations
                            through business consulting, analytics, automation
                            and intelligent systems engineered for scale.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 text-sm text-white/65">
                            <a
                                href="mailto:mirconsulting26@gmail.com"
                                data-testid="footer-email"
                                className="inline-flex items-center gap-3 hover:text-white transition-colors"
                            >
                                <Mail className="w-4 h-4 text-mir-blueSoft" />
                                mirconsulting26@gmail.com
                            </a>
                            <div className="inline-flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-mir-blueSoft" />
                                Global remote · Engagements worldwide
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-mir-blueSoft mb-4">
                            Company
                        </div>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link
                                    to="/about"
                                    data-testid="footer-link-about"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/case-studies"
                                    data-testid="footer-link-case-studies"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    Case Studies
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/insights"
                                    data-testid="footer-link-insights"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    Insights
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/contact"
                                    data-testid="footer-link-contact"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-mir-blueSoft mb-4">
                            Services
                        </div>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link
                                    to="/services"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    Business Consulting
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    Analytics &amp; BI
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    IT Consulting
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    Process Automation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/services"
                                    className="text-white/75 hover:text-white transition-colors"
                                >
                                    Digital Transformation
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-mir-blueSoft mb-4">
                            Engage
                        </div>
                        <Link
                            to="/contact"
                            data-testid="footer-cta-book"
                            className="group inline-flex items-center gap-2 bg-mir-blue hover:bg-mir-blueSoft text-white px-4 py-3 text-sm font-medium transition-colors w-full justify-center"
                        >
                            Book Consultation
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                        <a
                            href="https://www.linkedin.com"
                            target="_blank"
                            rel="noreferrer"
                            data-testid="footer-linkedin"
                            className="mt-4 inline-flex items-center gap-2 text-white/65 hover:text-white transition-colors text-sm"
                        >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                        </a>
                    </div>
                </div>

                <div className="divider-line mt-16" />
                <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-white/55 tracking-wide gap-3">
                    <div>
                        © {new Date().getFullYear()} MIR Consulting. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        <span>Premium enterprise consulting</span>
                        <Link to="/admin" data-testid="footer-admin-link" className="hover:text-white/85 transition-colors">
                            Admin
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
