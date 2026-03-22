"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { Resume } from "@/types/resume.types";

const slideUp = {
  hidden: { y: 32, opacity: 0 },
  visible: (delay: number = 0) => ({
    y: 0,
    opacity: 1,
    transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.55, delay },
  }),
};

interface AboutProps {
  resume: Resume;
}

export default function About({ resume }: Readonly<AboutProps>) {
  const { education, experience, projects, skills } = resume;

  const edu = education[0];
  const currentRole = experience[0];

  const sectionRef = useRef<HTMLElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const isVisible = useInView(sectionRef, { once: true, amount: 0.1 });
  const isBioVisible = useInView(bioRef, { once: true, amount: 0.2 });
  const isStatsVisible = useInView(statsRef, { once: true, amount: 0.2 });

  const totalSkills = skills.flatMap((s) => s.skills).length;

  const stats = [
    { value: `${experience.length}`, label: "Roles" },
    { value: `${projects.length}+`, label: "Projects" },
    { value: `${totalSkills}+`, label: "Skills" },
    { value: edu?.gpa?.display ?? "9.54/10", label: "GPA" },
  ];

  const bio = [
    `${currentRole?.role ?? "Software Engineer"} at ${currentRole?.company ?? "Philips"}, building secure, high-impact software across DevSecOps, full-stack, and AI tooling.`,
    `${edu?.degree ?? "B.Tech"} graduate from ${edu?.institution ?? "NIT Mizoram"} — ${edu?.honours?.join(", ") ?? "Gold Medalist"} — with a passion for developer tooling, security automation, and shipping things that actually work.`,
    `Currently focused on SBOM pipelines, cloud security posture, and AI-driven threat modeling. Always looking for the intersection of deep tech and clean engineering.`,
  ];

  return (
    <section ref={sectionRef} className="about-root" id="about">
      <div className="about-inner">
        {/* Section header */}
        <motion.div
          className="section-header"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.span
            className="section-eyebrow"
            variants={slideUp}
            custom={0}
          >
            01 / About
          </motion.span>
          <motion.h2 className="section-title" variants={slideUp} custom={0.1}>
            Who I Am
          </motion.h2>
          <motion.div
            className="section-divider"
            variants={slideUp}
            custom={0.2}
          />
        </motion.div>

        <div className="about-grid">
          {/* Bio column */}
          <motion.div
            ref={bioRef}
            className="about-bio"
            initial="hidden"
            animate={isBioVisible ? "visible" : "hidden"}
          >
            {bio.map((text) => (
              <motion.p
                key={text.slice(0, 28)}
                className="about-para"
                variants={slideUp}
                custom={bio.indexOf(text) * 0.1 + 0.15}
              >
                {text}
              </motion.p>
            ))}

            {edu && (
              <motion.div className="edu-card" variants={slideUp} custom={0.5}>
                <div className="edu-card-accent" />
                <div className="edu-card-body">
                  <div className="edu-degree">
                    {edu.degree}
                    {edu.field ? `, ${edu.field}` : ""}
                  </div>
                  <div className="edu-institution">{edu.institution}</div>
                  <div className="edu-meta">
                    <span className="edu-period">
                      {edu.period.start} – {edu.period.end}
                    </span>
                    {edu.gpa && (
                      <span className="edu-gpa">{edu.gpa.display}</span>
                    )}
                    {edu.honours?.map((h) => (
                      <span key={h} className="edu-badge">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Stats column */}
          <motion.div
            ref={statsRef}
            className="about-stats"
            initial="hidden"
            animate={isStatsVisible ? "visible" : "hidden"}
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="stat-card"
                variants={slideUp}
                custom={0.15 + i * 0.08}
                whileHover={{ y: -5, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
              >
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
