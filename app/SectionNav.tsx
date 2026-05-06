"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  { id: "sec-matrix", n: "01", label: "matrix" },
  { id: "sec-agreement", n: "02", label: "agreement" },
  { id: "sec-you", n: "03", label: "you" },
  { id: "sec-key", n: "04", label: "key" },
] as const;

export default function SectionNav() {
  const [active, setActive] = useState<(typeof ITEMS)[number]["id"]>(
    "sec-matrix"
  );

  useEffect(() => {
    const onScroll = () => {
      // Standard scroll-spy: the active section is the most recent one whose
      // top has scrolled past a line ~30% from the top of the viewport.
      let current: (typeof ITEMS)[number]["id"] = "sec-matrix";
      const trigger = window.innerHeight * 0.3;
      for (const item of ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= trigger) {
          current = item.id;
        }
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed left-6 top-32 z-10 hidden xl:flex flex-col gap-3"
    >
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={isActive ? "true" : undefined}
            className={`text-[10px] tracking-widest uppercase leading-tight transition-colors ${
              isActive
                ? "text-[var(--color-jade)]"
                : "text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
            }`}
          >
            <span
              className={`block font-serif italic text-[11px] transition-colors ${
                isActive
                  ? "text-[var(--color-jade)]"
                  : "text-[var(--color-ink-soft)]"
              }`}
            >
              {item.n}
            </span>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
