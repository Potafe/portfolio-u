"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
  LayoutGroup,
} from "framer-motion";
import type { Resume, ProjectEntry } from "@/types/resume.types";

// ─── Story derivation ──────────────────────────────────────────────────────

function deriveChallenge(entry: ProjectEntry): string {
  const title = entry.title.toLowerCase();
  const tech = entry.techStack.join(" ").toLowerCase();

  if (title.includes("spdxmerge") || tech.includes("spdx")) {
    return "Enterprise SBOM tooling lives in a sparse open-source ecosystem. spdxmerge had accumulated broken Docker entrypoints, flawed SHA validation, and dependency rot — blocking teams from merging SPDX documents reliably in CI/CD pipelines.";
  }

  if (
    tech.includes("ollama") ||
    tech.includes("langchain") ||
    tech.includes("rag") ||
    title.includes("bot")
  ) {
    return "Private documents can't be sent to cloud LLMs. Building a fully offline, context-aware Q&A system over arbitrary PDFs requires wiring a vector store, graph context, real-time streaming, and local inference — with zero internet dependency.";
  }

  if (
    title.includes("mingle") ||
    tech.includes("cloudinary") ||
    tech.includes("socket")
  ) {
    return "Shipping a real-time social platform — group chat, global rooms, media uploads, and secure auth — without a BaaS means composing every infrastructure layer by hand.";
  }

  return `${entry.title} required solving non-trivial architecture decisions across ${entry.techStack.slice(0, 3).join(", ")} to deliver something reliable and production-ready.`;
}

function deriveStory(entry: ProjectEntry): {
  challenge: string;
  solution: string[];
  impact: string | null;
} {
  const challenge = deriveChallenge(entry);
  const { bullets } = entry;
  if (bullets.length === 0) return { challenge, solution: [], impact: null };
  if (bullets.length === 1)
    return { challenge, solution: bullets, impact: null };
  return {
    challenge,
    solution: bullets.slice(0, -1),
    impact: bullets.at(-1) ?? null,
  };
}

// ─── Magnetic + Tilt hook ──────────────────────────────────────────────────

function useMagneticTilt() {
  const magnetX = useMotionValue(0);
  const magnetY = useMotionValue(0);
  const springX = useSpring(magnetX, { stiffness: 180, damping: 22 });
  const springY = useSpring(magnetY, { stiffness: 180, damping: 22 });
  // Use a ref instead of state so tilt updates bypass the React render cycle,
  // avoiding a re-render on every mousemove event.
  const tiltRef = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      magnetX.set(dx * 0.07);
      magnetY.set(dy * 0.07);

      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(800px) rotateY(${px * 12}deg) rotateX(${-py * 9}deg) translateY(-6px)`;
        tiltRef.current.style.transition = "transform 0.1s ease-out";
      }

      // Drive spotlight glow with cursor position
      e.currentTarget.style.setProperty(
        "--card-glow-x",
        `${((e.clientX - r.left) / r.width) * 100}%`,
      );
      e.currentTarget.style.setProperty(
        "--card-glow-y",
        `${((e.clientY - r.top) / r.height) * 100}%`,
      );
    },
    [magnetX, magnetY],
  );

  const onMouseLeave = useCallback(() => {
    magnetX.set(0);
    magnetY.set(0);
    if (tiltRef.current) {
      tiltRef.current.style.transform =
        "perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)";
      tiltRef.current.style.transition = "transform 0.5s ease-out";
    }
  }, [magnetX, magnetY]);

  return { springX, springY, tiltRef, onMouseMove, onMouseLeave };
}

// ─── Project Card ──────────────────────────────────────────────────────────

interface CardProps {
  entry: ProjectEntry;
  index: number;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: () => void;
}

function ProjectCard({
  entry,
  index,
  isSelected,
  isDimmed,
  onSelect,
}: Readonly<CardProps>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasEntered = useInView(wrapperRef, { once: true, amount: 0.15 });
  const { springX, springY, tiltRef, onMouseMove, onMouseLeave } =
    useMagneticTilt();

  return (
    <motion.div
      ref={wrapperRef}
      initial={{ y: 44, opacity: 0 }}
      animate={hasEntered ? { y: 0, opacity: 1 } : {}}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 26,
        delay: index * 0.09,
      }}
    >
      {/* Magnetic spring layer wraps the layoutId element */}
      <motion.div style={{ x: springX, y: springY }}>
        <motion.div
          layoutId={`proj-shell-${index}`}
          className={`proj-card${isDimmed ? " proj-card--dim" : ""}`}
          animate={{ opacity: isSelected ? 0 : 1 }}
          transition={{
            layout: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.15 },
          }}
          style={{ pointerEvents: isSelected ? "none" : "auto" }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={onSelect}
          role="button"
          tabIndex={0}
          aria-label={`View case study for ${entry.title}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault(); // Space would otherwise scroll the page
              onSelect();
            }
          }}
        >
          {/* Spotlight glow overlay (not in tilt space, tracks cursor) */}
          <div className="proj-glow" aria-hidden />

          {/* 3D tilt layer */}
          <div ref={tiltRef} className="proj-card-body">
            {/* Header row */}
            <div className="proj-card-top">
              <div className="proj-title-group">
                <h3 className="proj-card-title">{entry.title}</h3>
                <p className="proj-card-period">
                  {entry.period.start} – {entry.period.end}
                </p>
              </div>
              {entry.repoUrl && (
                <a
                  href={entry.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proj-gh"
                  onClick={(e) => e.stopPropagation()}
                >
                  GH↗
                </a>
              )}
            </div>

            {/* First bullet as card summary */}
            {entry.bullets[0] && (
              <p className="proj-card-summary">{entry.bullets[0]}</p>
            )}

            {/* Tech chips */}
            <div className="proj-chips">
              {entry.techStack.slice(0, 5).map((t) => (
                <span key={t} className="proj-chip">
                  {t}
                </span>
              ))}
              {entry.techStack.length > 5 && (
                <span className="proj-chip proj-chip--more">
                  +{entry.techStack.length - 5}
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="proj-expand">
              <span className="proj-expand-text">Case study</span>
              <span className="proj-expand-arrow">→</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Project Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  entry: ProjectEntry;
  index: number;
  onClose: () => void;
}

function ProjectModal({ entry, index, onClose }: Readonly<ModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const story = deriveStory(entry);

  useEffect(() => {
    dialogRef.current?.show();
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="proj-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden
      />

      {/* Native dialog — satisfies ARIA/SonarQube requirement */}
      <dialog
        ref={dialogRef}
        className="proj-modal-scroll"
        aria-label="Project case study"
      >
        {/* Shared layout shell — same layoutId as card */}
        <motion.div
          layoutId={`proj-shell-${index}`}
          className="proj-modal"
          onClick={(e) => e.stopPropagation()}
          transition={{
            layout: { type: "spring", stiffness: 280, damping: 30 },
          }}
        >
          {/* Modal content fades in after layout animation starts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.16, duration: 0.28 }}
          >
            {/* Close button */}
            <button
              className="proj-modal-close"
              onClick={onClose}
              aria-label="Close case study"
            >
              ✕
            </button>

            {/* Header */}
            <div className="proj-modal-header">
              <div>
                <h2 className="proj-modal-title">{entry.title}</h2>
                <p className="proj-modal-period">
                  {entry.period.start} – {entry.period.end}
                </p>
              </div>
              {entry.repoUrl && (
                <a
                  href={entry.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proj-modal-gh"
                >
                  GitHub ↗
                </a>
              )}
            </div>

            {/* Story */}
            <div className="proj-story">
              {/* Challenge */}
              <div className="story-seg story-seg--challenge">
                <div className="story-label">
                  <span
                    className="story-dot story-dot--red"
                    aria-hidden="true"
                  />{" "}
                  Challenge
                </div>
                <p className="story-body">{story.challenge}</p>
              </div>

              {/* Solution */}
              {story.solution.length > 0 && (
                <div className="story-seg story-seg--solution">
                  <div className="story-label">
                    <span
                      className="story-dot story-dot--blue"
                      aria-hidden="true"
                    />{" "}
                    Solution
                  </div>
                  <ul className="story-bullets">
                    {story.solution.map((b) => (
                      <li key={b.slice(0, 40)} className="story-bullet">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Impact */}
              {story.impact && (
                <div className="story-seg story-seg--impact">
                  <div className="story-label">
                    <span
                      className="story-dot story-dot--green"
                      aria-hidden="true"
                    />{" "}
                    Impact
                  </div>
                  <p className="story-body">{story.impact}</p>
                </div>
              )}
            </div>

            {/* Full tech stack */}
            <div className="proj-modal-stack">
              <p className="proj-modal-stack-label">Stack</p>
              <div className="proj-chips">
                {entry.techStack.map((t) => (
                  <span key={t} className="proj-chip proj-chip--lg">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </dialog>
    </>
  );
}

// ─── Projects Section ──────────────────────────────────────────────────────

interface ProjectsProps {
  resume: Resume;
}

export default function Projects({ resume }: Readonly<ProjectsProps>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isHeaderVisible = useInView(sectionRef, { once: true, amount: 0.05 });

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = selectedIndex === null ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  // Esc closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIndex(null);
    };
    globalThis.window?.addEventListener("keydown", onKey);
    return () => globalThis.window?.removeEventListener("keydown", onKey);
  }, []);

  // Background gradient tracks mouse via CSS custom props — zero re-renders
  const onSectionMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--glow-x",
      `${((e.clientX - r.left) / r.width) * 100}%`,
    );
    el.style.setProperty(
      "--glow-y",
      `${((e.clientY - r.top) / r.height) * 100}%`,
    );
  }, []);

  const selectedEntry =
    selectedIndex === null ? undefined : resume.projects[selectedIndex];

  return (
    <section
      ref={sectionRef}
      className="projects-root"
      id="projects"
      aria-label="Projects"
      onMouseMove={onSectionMouseMove}
    >
      {/* Section-level ambient glow that tracks mouse */}
      <div className="projects-bg" aria-hidden />

      <div className="projects-inner">
        {/* Header */}
        <div className="section-header">
          <motion.span
            className="section-eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
          >
            03 / Projects
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5, delay: 0.1 }}
          >
            What I&apos;ve Built
          </motion.h2>
          <motion.div
            className="section-divider"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isHeaderVisible ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5, delay: 0.2 }}
            style={{ transformOrigin: "left center" }}
          />
        </div>

        {/* Cards + modal share a LayoutGroup so layout animations are scoped */}
        <LayoutGroup>
          <div className="projects-grid">
            {resume.projects.map((entry, i) => (
              <ProjectCard
                key={entry.title}
                entry={entry}
                index={i}
                isSelected={selectedIndex === i}
                isDimmed={selectedIndex !== null && selectedIndex !== i}
                onSelect={() => setSelectedIndex(i)}
              />
            ))}
          </div>

          <AnimatePresence>
            {selectedIndex !== null && selectedEntry && (
              <ProjectModal
                key="proj-modal"
                entry={selectedEntry}
                index={selectedIndex}
                onClose={() => setSelectedIndex(null)}
              />
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
}
