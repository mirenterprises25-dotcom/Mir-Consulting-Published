import React from "react";
import { Helmet } from "react-helmet-async";

const BASE_TITLE = "MIR Consulting";
const DEFAULT_DESC =
    "Premium business, technology, and intelligence consulting for enterprise growth, analytics, automation, and digital transformation.";

export default function Seo({ title, description, path = "" }) {
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} | Strategy. Technology. Intelligence.`;
    const desc = description || DEFAULT_DESC;
    const url = `https://mirconsulting.com${path}`;
    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <link rel="canonical" href={url} />
        </Helmet>
    );
}
