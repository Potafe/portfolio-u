"use client";

import { motion } from "framer-motion";

export default function DownloadResumeButton() {
  return (
    <motion.a
      href="/api/resume/download"
      download="resume.pdf"
      className="download-resume-btn"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Download resume as PDF"
    >
      <span className="download-resume-btn-icon" aria-hidden>
        ↓
      </span>{" "}
      Resume
    </motion.a>
  );
}
