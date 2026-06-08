import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Section } from "@/components/sections/Section";
import Seo from "@/lib/Seo";
import { fetchVideo } from "@/lib/api";

export default function VideoDetail() {
    const { slug } = useParams();
    const [video, setVideo] = React.useState(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let cancelled = false;
        fetchVideo(slug)
            .then((data) => {
                if (!cancelled) setVideo(data);
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e?.response?.status === 404 ? "not_found" : "error");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (error === "not_found") {
        return (
            <Section testId="video-not-found" className="bg-mir-bg">
                <h1 className="font-heading text-4xl text-mir-text">Video not found</h1>
                <Link to="/our-work" className="inline-flex items-center gap-2 mt-6 text-mir-blue">
                    <ArrowLeft className="w-4 h-4" /> Back to Our Work
                </Link>
            </Section>
        );
    }
    if (!video) {
        return (
            <Section testId="video-loading" className="bg-mir-bg">
                <div className="text-mir-muted">Loading…</div>
            </Section>
        );
    }

    return (
        <div data-testid="video-detail-page" className="bg-mir-bg">
            <Seo title={video.title} description={video.description?.slice(0, 280)} path={`/our-work/video/${video.slug}`} />
            <Section testId="video-hero" className="bg-mir-bg">
                <Link
                    to="/our-work"
                    className="inline-flex items-center gap-2 text-mir-blue text-sm mb-8 hover:underline"
                    data-testid="video-back-link"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Our Work
                </Link>
                <div className="text-[11px] uppercase tracking-[0.25em] text-mir-blue mb-5 inline-flex items-center gap-2">
                    <PlayCircle className="w-3.5 h-3.5" /> Video · {video.category}
                </div>
                <h1 className="font-heading text-3xl sm:text-5xl font-light tracking-tighter text-mir-text max-w-4xl leading-[1.1]">
                    {video.title}
                </h1>
                <div className="mt-10 aspect-video bg-black border border-mir-border" data-testid="video-player-wrapper">
                    {video.youtube_id ? (
                        <iframe
                            data-testid="video-iframe"
                            src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                            Invalid video URL.
                        </div>
                    )}
                </div>
                <p className="mt-10 text-base sm:text-lg text-mir-textSoft max-w-3xl leading-relaxed whitespace-pre-wrap" data-testid="video-description">
                    {video.description}
                </p>
            </Section>
        </div>
    );
}
