"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/sections/LoadingScreen";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Extracurriculars from "@/components/sections/Extracurriculars";
import type { Resume } from "@/types/resume.types";

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHero, setShowHero] = useState(false);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => r.json())
      .then((data: Resume) => setResume(data))
      .catch(() => {
        /* resume fetch failed silently */
      });
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

      {showHero && resume && (
        <>
          <Hero resume={resume} />
          <About resume={resume} />
          <Experience resume={resume} />
          <Projects resume={resume} />
          <Extracurriculars resume={resume} />
        </>
      )}
    </main>
  );
}
