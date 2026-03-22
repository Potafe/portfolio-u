"use client";

import { useEffect, useState } from "react";
import type React from "react";

type Theme = "dark" | "light" | "system";

function getSystemTheme(): "dark" | "light" {
  if (typeof globalThis === "undefined") return "dark";
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.dataset["theme"] = resolved;
}

export function useTheme() {
  const [themeValue, setThemeValue] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setThemeValue(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    if (themeValue !== "system") return;
    const mq = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themeValue]);

  const setTheme = (next: Theme) => {
    setThemeValue(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return { theme: themeValue, setTheme };
}

// ── SVG Icons ──────────────────────────────────────────────────────────────

function MoonIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const ICONS: Record<Theme, React.ReactNode> = {
  dark: <MoonIcon />,
  light: <SunIcon />,
  system: <MonitorIcon />,
};

const LABELS: Record<Theme, string> = {
  dark: "Dark",
  light: "Light",
  system: "Auto",
};

const CYCLE: Theme[] = ["system", "dark", "light"];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length] as Theme;
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-switcher"
      onClick={handleClick}
      aria-label={`Theme: ${LABELS[theme]}. Click to cycle.`}
      title={`Theme: ${LABELS[theme]}`}
    >
      <span className="theme-switcher-icon">{ICONS[theme]}</span>
      <span className="theme-switcher-label">{LABELS[theme]}</span>
    </button>
  );
}
