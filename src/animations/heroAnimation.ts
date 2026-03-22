/**
 * heroAnimation.ts
 * GSAP-powered entrance timeline for the hero section.
 * Called once after the loading screen exits.
 */
import gsap from "gsap";

export interface HeroRefs {
  eyebrow: HTMLElement | null;
  name: HTMLElement | null;
  role: HTMLElement | null;
  skills: HTMLElement | null;
  links: HTMLElement | null;
  scroll: HTMLElement | null;
  orb1: HTMLElement | null;
  orb2: HTMLElement | null;
  orb3: HTMLElement | null;
}

/**
 * Runs a snappy, staggered entrance for every hero element.
 * Uses a master timeline so nothing overlaps and everything is
 * orchestrated in one place.
 */
export function runHeroEntrance(refs: HeroRefs): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

  // Orbs drift in from slightly off-position (already in DOM, so just fade)
  tl.fromTo(
    [refs.orb1, refs.orb2, refs.orb3],
    { opacity: 0, scale: 0.7 },
    { opacity: 1, scale: 1, duration: 1.6, stagger: 0.18, ease: "power2.out" },
    0,
  );

  // Eyebrow (tag line)
  tl.fromTo(
    refs.eyebrow,
    { y: 18, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.55 },
    0.1,
  );

  // Name — each letter is already split by Framer Motion, so animate the
  // parent container as a whole here for a secondary glow burst
  tl.fromTo(
    refs.name,
    { filter: "blur(12px)", opacity: 0 },
    { filter: "blur(0px)", opacity: 1, duration: 0.75, ease: "power3.out" },
    0.25,
  );

  // Role line
  tl.fromTo(
    refs.role,
    { y: 14, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.45 },
    0.6,
  );

  // Skills strip — stagger individual chips
  tl.fromTo(
    refs.skills
      ? Array.from(refs.skills.querySelectorAll(".hero-skill-tag"))
      : [],
    { y: 16, opacity: 0, scale: 0.9 },
    { y: 0, opacity: 1, scale: 1, duration: 0.38, stagger: 0.035 },
    0.75,
  );

  // Links
  tl.fromTo(
    refs.links ? Array.from(refs.links.querySelectorAll(".hero-link")) : [],
    { y: 12, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.38, stagger: 0.06 },
    0.9,
  );

  // Scroll hint
  tl.fromTo(refs.scroll, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.2);

  return tl;
}

/**
 * Continuous floating animation applied to the orbs after entrance.
 * Call after runHeroEntrance completes.
 */
export function startOrbFloat(
  refs: Pick<HeroRefs, "orb1" | "orb2" | "orb3">,
): void {
  if (refs.orb1) {
    gsap.to(refs.orb1, {
      x: 40,
      y: 30,
      scale: 1.08,
      duration: 12,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }
  if (refs.orb2) {
    gsap.to(refs.orb2, {
      x: -30,
      y: -25,
      scale: 1.05,
      duration: 15,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }
  if (refs.orb3) {
    gsap.to(refs.orb3, {
      x: 20,
      y: -20,
      duration: 9,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }
}
