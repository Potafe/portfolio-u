"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const PARSE_STEPS = [
  "Reading resume.sty...",
  "Parsing contact info...",
  "Parsing education...",
  "Parsing experience...",
  "Parsing projects...",
  "Parsing skills...",
  "Building portfolio...",
];

interface Props {
  onComplete: () => void;
}

function TypingLine({
  text,
  delay,
  onDone,
}: Readonly<{
  text: string;
  delay: number;
  onDone?: () => void;
}>) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
          onDone?.();
        }
      }, 22);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay, onDone]);

  return (
    <div className="loading-line">
      <span className="loading-prompt">
        <span className="loading-prompt-arrow">&gt;</span>
      </span>
      <span className="loading-text">
        {displayed}
        {!done && <span className="loading-cursor" />}
      </span>
      {done && <span className="loading-ok"> ✓</span>}
    </div>
  );
}

export default function LoadingScreen({ onComplete }: Readonly<Props>) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const totalSteps = PARSE_STEPS.length;

  const advanceStep = () => {
    setVisibleCount((c) => {
      const next = c + 1;
      progressRef.current = Math.round((next / totalSteps) * 100);
      setProgress(progressRef.current);
      if (next > totalSteps) {
        setTimeout(onComplete, 520);
      }
      return next;
    });
  };

  useEffect(() => {
    setProgress(Math.round((1 / totalSteps) * 100));
  }, [totalSteps]);

  return (
    <motion.div
      className="loading-root"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    >
      <div className="loading-card">
        <div className="loading-header">
          <span className="loading-header-dot red" />
          <span className="loading-header-dot yellow" />
          <span className="loading-header-dot green" />
          <span className="loading-header-title">portfolio — init</span>
        </div>

        <div className="loading-body">
          <div className="loading-logo">
            {"<YM />".split("").map((ch, i) => (
              <motion.span
                key={ch}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: "easeOut" }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          <div className="loading-steps">
            {PARSE_STEPS.slice(0, visibleCount).map((step, i) => {
              const isLast = i === visibleCount - 1;
              return (
                <TypingLine
                  key={step}
                  text={step}
                  delay={i === 0 ? 200 : 0}
                  {...(isLast ? { onDone: advanceStep } : {})}
                />
              );
            })}
            {visibleCount > totalSteps && (
              <motion.div
                className="loading-done"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="loading-prompt-arrow">&gt;</span> Ready.
              </motion.div>
            )}
          </div>
        </div>

        <div className="loading-footer">
          <div className="loading-progress-track">
            <motion.div
              className="loading-progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.35 }}
            />
          </div>
          <span className="loading-percentage">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}
