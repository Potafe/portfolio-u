"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { Resume, ActivityEntry } from "@/types/resume.types";

const ICON: Record<string, string> = {
  "placement coordinator": "🎯",
  "sure'24 fellow": "🔬",
  fellow: "🔬",
  coordinator: "🎯",
  research: "🔬",
};

function getIcon(role: string): string {
  const lower = role.toLowerCase();
  for (const [key, icon] of Object.entries(ICON)) {
    if (lower.includes(key)) return icon;
  }
  return "⚡";
}

const slideUp = {
  hidden: { y: 24, opacity: 0 },
  visible: (d: number = 0) => ({
    y: 0,
    opacity: 1,
    transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.5, delay: d },
  }),
};

function ActivityCard({
  entry,
  index,
}: Readonly<{ entry: ActivityEntry; index: number }>) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      className="extra-card"
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={slideUp}
      custom={index * 0.1}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 360, damping: 20 }}
    >
      <div className="extra-icon" aria-hidden="true">
        {getIcon(entry.role)}
      </div>
      <div className="extra-body">
        <div className="extra-header">
          <h3 className="extra-role">{entry.role}</h3>
          <span className="extra-period">
            {entry.period.start}
            {entry.period.end === entry.period.start
              ? ""
              : ` – ${entry.period.end}`}
          </span>
        </div>
        <p className="extra-org">{entry.organisation}</p>
        {entry.bullets.length > 0 && (
          <p className="extra-detail">{entry.bullets[0]}</p>
        )}
      </div>
    </motion.div>
  );
}

interface ExtracurricularsProps {
  resume: Resume;
}

export default function Extracurriculars({
  resume,
}: Readonly<ExtracurricularsProps>) {
  const sectionRef = useRef<HTMLElement>(null);
  const isHeaderVisible = useInView(sectionRef, { once: true, amount: 0.1 });
  const extras = resume.extracurriculars ?? [];

  if (extras.length === 0) return null;

  return (
    <section ref={sectionRef} className="extra-root" id="extracurriculars">
      <div className="extra-inner">
        <div className="section-header">
          <motion.span
            className="section-eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
          >
            04 / Beyond Code
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderVisible ? { opacity: 1, y: 0 } : {}}
            transition={{
              ease: [0.22, 1, 0.36, 1],
              duration: 0.5,
              delay: 0.1,
            }}
          >
            Outside the IDE
          </motion.h2>
          <motion.div
            className="section-divider"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isHeaderVisible ? { opacity: 1, scaleX: 1 } : {}}
            transition={{
              ease: [0.22, 1, 0.36, 1],
              duration: 0.5,
              delay: 0.2,
            }}
            style={{ transformOrigin: "left center" }}
          />
        </div>

        <div className="extra-grid">
          {extras.map((entry, i) => (
            <ActivityCard
              key={`${entry.role}-${entry.organisation}`}
              entry={entry}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
