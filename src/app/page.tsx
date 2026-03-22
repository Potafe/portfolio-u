"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/sections/LoadingScreen";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Extracurriculars from "@/components/sections/Extracurriculars";
import Contact from "@/components/sections/Contact";
import DownloadResumeButton from "@/components/ui/DownloadResumeButton";
import type { Resume } from "@/types/resume.types";

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHero, setShowHero] = useState(false);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => r.json())
      .then((data: Resume) => setResume(data))
      .catch(() => setFetchError(true));
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
    setTimeout(() => setShowHero(true), 80);
  };

  return (
    <main>
      <AnimatePresence mode="wait">
        {loading && (
          <LoadingScreen key="loader" onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {showHero && fetchError && !resume && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            color: "#888",
            fontFamily: "monospace",
          }}
        >
          Failed to load resume data — please refresh the page.
        </div>
      )}

      {showHero && resume && (
        <>
          <Hero resume={resume} />
          <About resume={resume} />
          <Experience resume={resume} />
          <Projects resume={resume} />
          <Extracurriculars resume={resume} />
          <Contact />
          <DownloadResumeButton />
        </>
      )}
    </main>
  );
}
