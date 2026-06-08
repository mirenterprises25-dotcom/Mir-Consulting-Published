import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_URL = (
    process.env.REACT_APP_SITE_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    "https://mirconsulting.com"
).replace(/\/$/, "");

const BASE_TITLE = "MIR Consulting";
const DEFAULT_DESC =
    "Premium business, technology and intelligence consulting — strategy, analytics, automation and digital transformation for enterprises.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-cover.jpg`; // optional asset; consumers fall back gracefully when missing

/**
 * Seo — single component that sets <title>, meta description, OG + Twitter cards,
 * canonical, hreflang (EN/DE/ES), and optional JSON-LD structured data.
 *
 * Props:
 *   title          page title (omit for site default)
 *   description    meta description
 *   path           absolute path, e.g. "/about" or "/our-work/video/foo"
 *   type           "website" (default) | "article" | "video.other"
 *   image          absolute or relative image URL for OG/Twitter card
 *   article        { published_time, modified_time, author, section, tags[] }
 *   schema         optional JSON-LD object (or array) to embed
 *   noIndex        true to add robots="noindex,nofollow"
 */
export default function Seo({
    title,
    description,
    path = "",
    type = "website",
    image,
    article,
    schema,
    noIndex = false,
}) {
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} | Strategy. Technology. Intelligence.`;
    const desc = description || DEFAULT_DESC;
    const cleanPath = path.startsWith("/") ? path : `/${path || ""}`;
    const url = `${SITE_URL}${cleanPath === "/" ? "" : cleanPath}`;
    const imgUrl = image
        ? image.startsWith("http")
            ? image
            : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`
        : DEFAULT_OG_IMAGE;

    const schemaJson = schema
        ? Array.isArray(schema)
            ? schema
            : [schema]
        : null;

    return (
        <Helmet prioritizeSeoTags>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            {noIndex && <meta name="robots" content="noindex,nofollow" />}

            {/* Open Graph */}
            <meta property="og:site_name" content={BASE_TITLE} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={imgUrl} />
            <meta property="og:locale" content="en_US" />
            <meta property="og:locale:alternate" content="de_DE" />
            <meta property="og:locale:alternate" content="es_ES" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={imgUrl} />

            {/* Canonical + hreflang */}
            <link rel="canonical" href={url} />
            <link rel="alternate" hrefLang="en" href={url} />
            <link rel="alternate" hrefLang="de" href={url} />
            <link rel="alternate" hrefLang="es" href={url} />
            <link rel="alternate" hrefLang="x-default" href={url} />

            {/* Article metadata */}
            {type === "article" && article?.published_time && (
                <meta property="article:published_time" content={article.published_time} />
            )}
            {type === "article" && article?.modified_time && (
                <meta property="article:modified_time" content={article.modified_time} />
            )}
            {type === "article" && article?.author && (
                <meta property="article:author" content={article.author} />
            )}
            {type === "article" && article?.section && (
                <meta property="article:section" content={article.section} />
            )}
            {type === "article" && Array.isArray(article?.tags) &&
                article.tags.map((t) => (
                    <meta key={t} property="article:tag" content={t} />
                ))}

            {/* Structured data (JSON-LD) */}
            {schemaJson &&
                schemaJson.map((s, i) => (
                    <script key={i} type="application/ld+json">
                        {JSON.stringify(s)}
                    </script>
                ))}
        </Helmet>
    );
}

export { SITE_URL };
