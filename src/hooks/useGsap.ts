/**
 * useGsap.ts
 * Thin React wrappers around GSAP that handle cleanup automatically.
 */
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Run a GSAP context inside a React component.
 * The context is reverted (cleaned up) when the component unmounts.
 *
 * @param factory  Function that receives a GSAP context and sets up animations.
 *                 Do all gsap.to / gsap.from / ScrollTrigger.create calls here.
 * @param deps     React dependency array — re-runs the factory when these change.
 */
export function useGsapContext(
  factory: (ctx: gsap.Context) => void,
  deps: React.DependencyList = [],
): void {
  useEffect(() => {
    // Pass `self` (the context object) via the callback parameter so it is
    // available before the outer `const ctx` assignment completes.
    const ctx = gsap.context((self) => {
      factory(self);
    });
    return () => ctx.revert();
  }, deps);
}

/**
 * Returns a ref that, when attached to a DOM element, runs a GSAP
 * entrance animation (fade + slide) when the element enters the viewport.
 *
 * @param options  Standard gsap.from vars (excluding the target).
 */
export function useScrollReveal<T extends HTMLElement>(
  options: gsap.TweenVars = {},
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from: gsap.TweenVars = {
      y: 36,
      opacity: 0,
      duration: 0.6,
      ease: "expo.out",
      ...options,
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => gsap.from(el, from),
    });

    return () => st.kill();
  }, []);

  return ref;
}

/**
 * Attach a magnetic hover effect to a button/link element.
 * The element shifts toward the cursor and springs back on leave.
 *
 * @param strength  How strongly the element follows the cursor (0–1). Default 0.35.
 */
export function useMagnetic<T extends HTMLElement>(
  strength = 0.35,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, {
        x: dx * strength,
        y: dy * strength,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return ref;
}
