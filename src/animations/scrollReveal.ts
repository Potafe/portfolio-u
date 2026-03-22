/**
 * scrollReveal.ts
 * Lightweight GSAP ScrollTrigger helpers for section reveals.
 * Each exported function takes a container element + optional config.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface RevealConfig {
  /** How much of the element must be visible before triggering (0–1) */
  threshold?: number;
  /** Seconds to wait before the first item animates */
  initialDelay?: number;
  /** Seconds between each staggered child */
  stagger?: number;
  /** y offset to start from */
  fromY?: number;
}

const DEFAULTS: Required<RevealConfig> = {
  threshold: 0.15,
  initialDelay: 0,
  stagger: 0.08,
  fromY: 32,
};

/**
 * Fade + slide-up each direct child of `container` when it scrolls into view.
 * Returns the ScrollTrigger instance so callers can kill it on unmount.
 */
export function revealChildren(
  container: HTMLElement,
  config: RevealConfig = {},
): ScrollTrigger {
  const cfg = { ...DEFAULTS, ...config };

  const items = Array.from(container.children) as HTMLElement[];
  gsap.set(items, { y: cfg.fromY, opacity: 0 });

  return ScrollTrigger.create({
    trigger: container,
    start: `top ${Math.round((1 - cfg.threshold) * 100)}%`,
    once: true,
    onEnter: () => {
      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
        stagger: cfg.stagger,
        delay: cfg.initialDelay,
      });
    },
  });
}

/**
 * Reveal a single element (section header, divider, etc.).
 */
export function revealElement(
  el: HTMLElement,
  config: RevealConfig = {},
): ScrollTrigger {
  const cfg = { ...DEFAULTS, ...config };

  gsap.set(el, { y: cfg.fromY, opacity: 0 });

  return ScrollTrigger.create({
    trigger: el,
    start: `top ${Math.round((1 - cfg.threshold) * 100)}%`,
    once: true,
    onEnter: () => {
      gsap.to(el, {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "expo.out",
        delay: cfg.initialDelay,
      });
    },
  });
}

/**
 * Scramble text letter-by-letter as it enters the viewport.
 * Requires a plain text node, not nested HTML.
 */
export function scrambleReveal(
  el: HTMLElement,
  config: RevealConfig = {},
): ScrollTrigger {
  const cfg = { ...DEFAULTS, ...config };
  const original = el.textContent ?? "";
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";

  gsap.set(el, { opacity: 1 });

  return ScrollTrigger.create({
    trigger: el,
    start: `top ${Math.round((1 - cfg.threshold) * 100)}%`,
    once: true,
    onEnter: () => {
      let iteration = 0;
      const interval = setInterval(() => {
        el.textContent = original
          .split("")
          .map((ch, i) => {
            if (i < iteration) return original[i] ?? ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)] ?? ch; // NOSONAR(javascript:S2245) – not security-sensitive; used only for visual text-scramble animation
          })
          .join("");
        if (iteration >= original.length) {
          clearInterval(interval);
          el.textContent = original;
        }
        iteration += 0.5;
      }, 30);
    },
  });
}

/**
 * Kill all active ScrollTriggers — call in cleanup / useEffect return.
 */
export function killAllScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((t) => t.kill());
}
