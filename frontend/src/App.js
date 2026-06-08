import React from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";

import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Industries from "@/pages/Industries";
import CaseStudies from "@/pages/CaseStudies";
import CaseStudyDetail from "@/pages/CaseStudyDetail";
import Insights from "@/pages/Insights";
import InsightDetail from "@/pages/InsightDetail";
import OurWork from "@/pages/OurWork";
import VideoDetail from "@/pages/VideoDetail";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import AdminResetPassword from "@/pages/AdminResetPassword";
import NotFound from "@/pages/NotFound";

function App() {
    return (
        <HelmetProvider>
            <div className="App bg-mir-bg text-mir-text min-h-screen">
                <BrowserRouter>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/industries" element={<Industries />} />
                            <Route path="/case-studies" element={<CaseStudies />} />
                            <Route
                                path="/case-studies/:slug"
                                element={<CaseStudyDetail />}
                            />
                            <Route path="/insights" element={<Insights />} />
                            <Route
                                path="/insights/:slug"
                                element={<InsightDetail />}
                            />
                            <Route path="/our-work" element={<OurWork />} />
                            <Route path="/our-work/video/:slug" element={<VideoDetail />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/reset/:token" element={<AdminResetPassword />} />
                    </Routes>
                </BrowserRouter>
                <Toaster
                    theme="light"
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: "hsl(0, 0%, 100%)",
                            color: "hsl(222, 47%, 11%)",
                            border: "1px solid hsl(220, 13%, 91%)",
                            borderRadius: 0,
                        },
                    }}
                />
            </div>
        </HelmetProvider>
    );
}

export default App;
