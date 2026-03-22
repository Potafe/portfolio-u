"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Beyond", href: "#extracurriculars" },
];

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Entrance animation
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { y: -64, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", delay: 0.2 },
    );
  }, []);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(globalThis.scrollY > 40);
    globalThis.window?.addEventListener("scroll", onScroll, { passive: true });
    return () => globalThis.window?.removeEventListener("scroll", onScroll);
  }, []);

  // Active section tracking
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.replace("#", ""));
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActive(`#${id}`);
        },
        { threshold: 0.3 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (globalThis.innerWidth > 768) setMenuOpen(false);
    };
    globalThis.window?.addEventListener("resize", onResize);
    return () => globalThis.window?.removeEventListener("resize", onResize);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`navbar${scrolled ? " navbar--scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="navbar-inner">
          {/* Logo */}
          <a
            href="#"
            className="navbar-logo"
            onClick={(e) => {
              e.preventDefault();
              globalThis.window?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="Back to top"
          >
            {"<YM />"}
          </a>

          {/* Desktop links */}
          <ul className="navbar-links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <button
                  className={`navbar-link${active === link.href ? " navbar-link--active" : ""}`}
                  onClick={() => handleNavClick(link.href)}
                  type="button"
                >
                  {link.label}
                  {active === link.href && (
                    <motion.span
                      className="navbar-link-dot"
                      layoutId="nav-dot"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 24,
                      }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Hamburger */}
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            type="button"
          >
            <span
              className={`hamburger-bar${menuOpen ? " hamburger-bar--open-1" : ""}`}
            />
            <span
              className={`hamburger-bar${menuOpen ? " hamburger-bar--open-2" : ""}`}
            />
            <span
              className={`hamburger-bar${menuOpen ? " hamburger-bar--open-3" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="navbar-drawer"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            role="dialog"
            aria-label="Mobile navigation"
          >
            <ul className="drawer-links">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    delay: i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                    duration: 0.35,
                  }}
                >
                  <button
                    type="button"
                    className={`drawer-link${active === link.href ? " drawer-link--active" : ""}`}
                    onClick={() => handleNavClick(link.href)}
                  >
                    <span className="drawer-link-num">0{i + 1}</span>
                    {link.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
