"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return { theme, setTheme };
}

const ICONS: Record<Theme, string> = {
  dark: "🌙",
  light: "☀️",
  system: "💻",
};

const LABELS: Record<Theme, string> = {
  dark: "Dark",
  light: "Light",
  system: "System",
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
      aria-label={`Switch theme — current: ${LABELS[theme]}`}
      title={`Theme: ${LABELS[theme]}`}
    >
      <span className="theme-switcher-icon" aria-hidden>
        {ICONS[theme]}
      </span>
      <span className="theme-switcher-label">{LABELS[theme]}</span>
    </button>
  );
}
