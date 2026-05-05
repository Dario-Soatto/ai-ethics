import type { DecisionOption } from "./dilemmas";

export const TONE_TEXT: Record<DecisionOption["tone"], string> = {
  good: "text-[var(--color-jade)]",
  bad: "text-[var(--color-vermillion)]",
  neutral: "text-[var(--color-ochre)]",
  refuse: "text-[var(--color-ink-mute)]",
};

export const TONE_DOT: Record<DecisionOption["tone"], string> = {
  good: "bg-[var(--color-jade)]",
  bad: "bg-[var(--color-vermillion)]",
  neutral: "bg-[var(--color-ochre)]",
  refuse: "bg-[var(--color-ink-mute)]",
};

export const TONE_CSS_VAR: Record<DecisionOption["tone"], string> = {
  good: "var(--color-jade)",
  bad: "var(--color-vermillion)",
  neutral: "var(--color-ochre)",
  refuse: "var(--color-ink-mute)",
};

/** Returns a `color-mix` background where alpha scales with agreement (0–1).
 * Uses a power curve so that high-agreement cells get notably more saturation
 * than partial-agreement ones — the pronounce-the-difference effect. */
export function tintBg(
  tone: DecisionOption["tone"],
  ratio: number,
  maxPercent = 72,
  exponent = 1.4
): string {
  const pct = Math.round(Math.pow(ratio, exponent) * maxPercent);
  return `color-mix(in oklab, ${TONE_CSS_VAR[tone]} ${pct}%, var(--color-paper))`;
}
