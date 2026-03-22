"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import type { Resume, ExperienceEntry } from "@/types/resume.types";

// ─── Type badge map ────────────────────────────────────────────────────────

const TYPE_CLASS: Partial<
  Record<NonNullable<ExperienceEntry["type"]>, string>
> = {
  "full-time": "type-fulltime",
  internship: "type-internship",
  apprentice: "type-apprentice",
  contract: "type-contract",
  freelance: "type-freelance",
};

// ─── Single timeline card ──────────────────────────────────────────────────

function TimelineCard({
  entry,
  index,
}: Readonly<{ entry: ExperienceEntry; index: number }>) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // once:true → card snaps in and stays visible
  const hasEntered = useInView(wrapperRef, { once: true, amount: 0.2 });
  // once:false → active glow tracks which card is centred in viewport
  const isActive = useInView(wrapperRef, { once: false, amount: 0.55 });

  return (
    <div ref={wrapperRef} className="exp-item">
      {/* Timeline dot */}
      <div className="exp-dot-col">
        <motion.div
          className="exp-dot"
          animate={
            isActive
              ? {
                  scale: 1.6,
                  backgroundColor: "#7c3aed",
                  boxShadow:
                    "0 0 0 5px rgba(124,58,237,0.18), 0 0 22px rgba(124,58,237,0.55)",
                }
              : {
                  scale: 1,
                  backgroundColor: "#252525",
                  boxShadow: "none",
                }
          }
          transition={{ duration: 0.28, ease: "easeOut" }}
        />
      </div>

      {/* Card — outer drives entry, inner drives 3-D tilt */}
      <motion.div
        className="exp-card-outer"
        initial={{ x: 56, opacity: 0 }}
        animate={hasEntered ? { x: 0, opacity: 1 } : { x: 56, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
          delay: index * 0.06,
        }}
      >
        <div
          className={`exp-card${isActive ? " exp-card--active" : ""}`}
          aria-label={`${entry.role} at ${entry.company}`}
        >
          {/* Header */}
          <div className="exp-card-header">
            <div className="exp-title-group">
              <h3 className="exp-role">{entry.role}</h3>
              <p className="exp-company">{entry.company}</p>
            </div>
            <div className="exp-meta">
              <span className="exp-period">
                {entry.period.start} – {entry.period.end}
              </span>
              {entry.type && (
                <span className={`exp-badge ${TYPE_CLASS[entry.type] ?? ""}`}>
                  {entry.type}
                </span>
              )}
              {entry.location && (
                <span className="exp-location">{entry.location}</span>
              )}
            </div>
          </div>

          {/* Bullets — cap at 4 */}
          <ul className="exp-bullets">
            {entry.bullets.slice(0, 4).map((bullet) => (
              <li key={bullet.slice(0, 40)} className="exp-bullet">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Experience section ────────────────────────────────────────────────────

interface ExperienceProps {
  resume: Resume;
}

export default function Experience({ resume }: Readonly<ExperienceProps>) {
  const sectionRef = useRef<HTMLElement>(null);
  const isHeaderVisible = useInView(sectionRef, { once: true, amount: 0.05 });

  // Scroll progress of the section → drives the line fill
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 90%", "end 15%"],
  });
  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={sectionRef} className="exp-root" id="experience">
      <div className="exp-inner">
        {/* Header */}
        <div className="section-header">
          <motion.span
            className="section-eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={
              isHeaderVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
            }
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
          >
            02 / Experience
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            animate={
              isHeaderVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{
              ease: [0.22, 1, 0.36, 1],
              duration: 0.5,
              delay: 0.1,
            }}
          >
            Where I&apos;ve Worked
          </motion.h2>
          <motion.div
            className="section-divider"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={
              isHeaderVisible
                ? { opacity: 1, scaleX: 1 }
                : { opacity: 0, scaleX: 0 }
            }
            transition={{
              ease: [0.22, 1, 0.36, 1],
              duration: 0.5,
              delay: 0.2,
            }}
            style={{ transformOrigin: "left center" }}
          />
        </div>

        {/* Timeline */}
        <div className="exp-timeline">
          {/* Scroll-fill line */}
          <div className="exp-line-track">
            <motion.div
              className="exp-line-fill"
              style={{
                scaleY: lineScaleY,
                transformOrigin: "top center",
              }}
            />
          </div>

          {/* Cards */}
          {resume.experience.map((entry, i) => (
            <TimelineCard
              key={`${entry.company}-${entry.role}`}
              entry={entry}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
