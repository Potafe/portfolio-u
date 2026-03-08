"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    gsap.from(titleRef.current, {
      y: 100,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
    });
  }, []);

  return (
    <section style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <h1 ref={titleRef}>Hello, I'm Yazat</h1>
    </section>
  );
}