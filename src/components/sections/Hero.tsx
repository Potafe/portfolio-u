"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import type { Resume } from "@/types/resume.types";

// ─── Animation variants ────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.1 },
  },
};

const letterVariants: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { ease: [0.22, 1, 0.36, 1], duration: 0.55 },
  },
};

const slideUp: Variants = {
  hidden: { y: 28, opacity: 0 },
  visible: (d: number = 0) => ({
    y: 0,
    opacity: 1,
    transition: { ease: [0.22, 1, 0.36, 1], duration: 0.5, delay: d },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (d: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.4, delay: d },
  }),
};

// ─── Typing effect hook ────────────────────────────────────────────────────

function useTypingEffect(words: string[], startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  // null = not yet started; avoids the race where phase==="typing" on mount
  // means the second effect fires immediately (started===false, returns) and
  // the start-delay callback then calls setPhase("typing") with no state
  // change, so React never re-runs the effect and typing never begins.
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting" | null>(
    null,
  );

  // Kick off after the start delay
  useEffect(() => {
    const delay = setTimeout(() => setPhase("typing"), startDelay);
    return () => clearTimeout(delay);
  }, [startDelay]);

  useEffect(() => {
    if (phase === null) return;
    const word = words[wordIndex % words.length] ?? "";

    if (phase === "typing") {
      if (displayed.length < word.length) {
        const t = setTimeout(
          () => setDisplayed(word.slice(0, displayed.length + 1)),
          52,
        );
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("pausing"), 1400);
        return () => clearTimeout(t);
      }
    }

    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), 500);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), 28);
        return () => clearTimeout(t);
      } else {
        setWordIndex((i) => i + 1);
        setPhase("typing");
      }
    }
  }, [displayed, phase, wordIndex, words]);

  return { displayed, isTyping: phase === "typing" };
}

// ─── Letter-split helper ───────────────────────────────────────────────────

function SplitText({
  text,
  className,
}: Readonly<{
  text: string;
  className?: string;
}>) {
  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label={text}
      style={{ display: "inline-block" }}
    >
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          style={{ display: "inline-block", overflow: "hidden" }}
        >
          <motion.span
            variants={letterVariants}
            style={{ display: "inline-block" }}
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

// ─── Icon map (text fallbacks for the portfolio icons) ────────────────────

const ICON_CHAR: Record<string, string> = {
  github: "GH",
  linkedin: "LI",
  code: "◈",
  envelope: "✉",
  phone: "📞",
};

// ─── Hero Component ───────────────────────────────────────────────────────

interface HeroProps {
  resume: Resume;
}

export default function Hero({ resume }: Readonly<HeroProps>) {
  const { contact, experience, skills } = resume;

  const roles = [
    experience[0]?.role ?? "Software Engineer",
    ...skills
      .slice(0, 2)
      .map((s) => s.category + " · " + s.skills.slice(0, 2).join(", ")),
    experience[0]?.company ?? "",
  ].filter(Boolean);

  const topSkills = skills.flatMap((s) => s.skills).slice(0, 10);

  const { displayed, isTyping } = useTypingEffect(roles, 1200);

  return (
    <section className="hero-root">
      {/* Gradient orbs */}
      <div className="hero-orb hero-orb-1" aria-hidden />
      <div className="hero-orb hero-orb-2" aria-hidden />
      <div className="hero-orb hero-orb-3" aria-hidden />

      {/* Grid overlay */}
      <div className="hero-grid" aria-hidden />

      <div className="hero-inner">
        {/* Tag line */}
        <motion.p
          className="hero-eyebrow"
          variants={slideUp}
          initial="hidden"
          animate="visible"
          custom={0.15}
        >
          <span className="hero-eyebrow-dot"></span> Available for new
          opportunities
        </motion.p>

        {/* Name */}
        <h1 className="hero-name">
          <SplitText text={contact.name} />
        </h1>

        {/* Typing role */}
        <motion.p
          className="hero-role"
          variants={slideUp}
          initial="hidden"
          animate="visible"
          custom={0.8}
        >
          <span className="hero-role-prefix">$ </span>
          <span className="hero-role-text">{displayed}</span>
          <span
            className="hero-cursor"
            style={{ opacity: isTyping ? 1 : 0.4 }}
          />
        </motion.p>

        {/* Skills strip */}
        <motion.div
          className="hero-skills"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {topSkills.map((skill, i) => (
            <motion.span
              key={skill}
              className="hero-skill-tag"
              variants={slideUp}
              custom={0.9 + i * 0.04}
              whileHover={{ scale: 1.08, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {skill}
            </motion.span>
          ))}
        </motion.div>

        {/* Links */}
        <motion.div
          className="hero-links"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {contact.links.map((link, i) => (
            <motion.a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-link"
              variants={slideUp}
              custom={1.25 + i * 0.07}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              <span className="hero-link-icon">
                {ICON_CHAR[link.icon ?? ""] ?? link.label.charAt(0)}
              </span>
              <span className="hero-link-label">{link.label}</span>
            </motion.a>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="hero-scroll"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <span className="hero-scroll-bar" />
          <span>scroll</span>
        </motion.div>
      </div>
    </section>
  );
}
