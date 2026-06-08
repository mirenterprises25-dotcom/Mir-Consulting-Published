import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "@/lib/Seo";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex items-center bg-mir-bg" data-testid="not-found-page">
            <Seo title="Page not found" description="The page you are looking for does not exist." noIndex />
            <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-6">
                    Error 404
                </div>
                <h1 className="font-heading text-5xl sm:text-7xl font-light tracking-tighter text-mir-text">
                    Page not found.
                </h1>
                <p className="mt-6 text-mir-muted">
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link
                    to="/"
                    data-testid="not-found-cta"
                    className="mt-10 inline-flex items-center gap-2 border border-mir-border hover:border-mir-blue px-6 py-3 text-sm text-mir-text"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </Link>
            </div>
        </div>
    );
}
