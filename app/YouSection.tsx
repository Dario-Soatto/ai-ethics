"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Dilemma } from "@/lib/dilemmas";
import type { ModelConfig } from "@/lib/models";
import type { CompactData } from "@/lib/data";
import { tintBg } from "@/lib/colors";
import { useUserAnswers } from "@/lib/useUserAnswers";

type Props = {
  models: ModelConfig[];
  dilemmas: Dilemma[];
  data: CompactData;
};

export default function YouSection({ models, dilemmas, data }: Props) {
  const { answers, hydrated } = useUserAnswers();

  const answeredCount = useMemo(
    () => dilemmas.filter((d) => Boolean(answers[d.id])).length,
    [answers, dilemmas]
  );

  const similarities = useMemo(() => {
    return models.map((m) => {
      let sum = 0;
      let n = 0;
      for (const d of dilemmas) {
        const userAns = answers[d.id];
        if (!userAns) continue;
        const cell = data[d.id]?.[m.slug];
        if (!cell || cell.total === 0) continue;
        sum += (cell.counts[userAns] ?? 0) / cell.total;
        n += 1;
      }
      return { slug: m.slug, score: n > 0 ? sum / n : null, n };
    });
  }, [models, dilemmas, data, answers]);

  const bestMatch = useMemo(() => {
    if (!hydrated || answeredCount === 0) return null;
    let best: { slug: string; score: number } | null = null;
    for (const s of similarities) {
      if (s.score === null) continue;
      if (!best || s.score > best.score)
        best = { slug: s.slug, score: s.score };
    }
    return best;
  }, [similarities, answeredCount, hydrated]);

  const bestModel = bestMatch
    ? models.find((m) => m.slug === bestMatch.slug)
    : null;

  const remap = (v: number) => Math.max(0, Math.min(1, (v - 0.5) / 0.5));

  return (
    <div className="grid lg:grid-cols-[3fr_4fr] gap-10 items-start">
      <div className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
        {hydrated && answeredCount > 0 ? (
          <>
            <p>
              You&apos;ve answered{" "}
              <span className="text-[var(--color-ink)]">{answeredCount}</span>{" "}
              of {dilemmas.length} dilemmas.{" "}
              {bestModel && (
                <>
                  Your answers most resemble{" "}
                  <Link
                    href={`/m/${bestModel.slug}`}
                    className="text-[var(--color-jade)] hover:text-[var(--color-ink)]"
                  >
                    {bestModel.label.replace(" Maverick", "")}
                  </Link>
                  .
                </>
              )}
            </p>
            <p className="mt-3">
              <Link
                href="/you"
                className="text-[var(--color-jade)] underline underline-offset-2 hover:text-[var(--color-ink)]"
              >
                Continue the quiz →
              </Link>
            </p>
          </>
        ) : (
          <>
            <p>
              Answer the same {dilemmas.length} dilemmas the models faced and
              your decisions populate the rightmost column on the matrix and
              the bottom row & rightmost column on the agreement table. Your
              similarity to each model is computed live.
            </p>
            <p className="mt-3">
              <Link
                href="/you"
                className="text-[var(--color-jade)] underline underline-offset-2 hover:text-[var(--color-ink)]"
              >
                Take the quiz →
              </Link>
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {models.map((m, i) => {
          const sim = similarities[i];
          const ready = hydrated && sim.score !== null;
          const pct = ready ? Math.round(sim.score! * 100) : null;
          return (
            <Link
              key={m.slug}
              href="/you"
              style={
                ready
                  ? { backgroundColor: tintBg("good", remap(sim.score!)) }
                  : undefined
              }
              className={`block px-3 py-3 transition hover:brightness-95 ${
                ready
                  ? ""
                  : "border border-dashed border-[var(--color-rule)] hover:border-[var(--color-ink-mute)]"
              }`}
              title={ready ? `${pct}% similarity to ${m.label}` : `Take the quiz to see your similarity to ${m.label}`}
            >
              <div className="text-[10px] text-[var(--color-ink-soft)] truncate">
                {m.label.replace(" Maverick", "")}
              </div>
              <div
                className={`font-serif text-2xl leading-none mt-1 ${
                  ready
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-mute)]"
                }`}
              >
                {pct ?? "—"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
