"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Display labels for path segments (the URL slug → friendly label mapping).
// Anything not in this map renders the slug verbatim.
const SEGMENT_LABELS: Record<string, string> = {
  d: "dilemma",
  m: "model",
  you: "you",
};

// Segments that aren't real pages on their own — they're prefixes for
// dynamic routes like /d/[id] and /m/[slug]. Render as plain text, not links.
const NON_CLICKABLE_SEGMENTS = new Set(["d", "m"]);

export default function HeaderPath() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="text-xs tracking-widest text-[var(--color-ink-soft)] flex items-baseline gap-1.5">
      <Link href="/" className="hover:text-[var(--color-ink)]">
        M.E.C.
      </Link>
      <span className="text-[var(--color-ink-mute)]">/</span>
      <Link href="/" className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]">
        catalog
      </Link>
      {segments.map((seg, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        const label = SEGMENT_LABELS[seg] ?? seg;
        const clickable = !isLast && !NON_CLICKABLE_SEGMENTS.has(seg);
        return (
          <span key={path} className="flex items-baseline gap-1.5">
            <span className="text-[var(--color-ink-mute)]">/</span>
            {clickable ? (
              <Link
                href={path}
                className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
              >
                {label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-mute)]"
                }
              >
                {label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
