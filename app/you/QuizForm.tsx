"use client";

import Link from "next/link";
import { useMemo } from "react";
import type {
  Dilemma,
  Category,
  DecisionOption,
} from "@/lib/dilemmas";
import type { ModelConfig } from "@/lib/models";
import { tintBg } from "@/lib/colors";
import type { CompactData } from "@/lib/data";
import { useUserAnswers } from "@/lib/useUserAnswers";

type Props = {
  dilemmas: Dilemma[];
  categories: Category[];
  models: ModelConfig[];
  data: CompactData;
};

export default function QuizForm({
  dilemmas,
  categories,
  models,
  data,
}: Props) {
  const { answers, setAnswers } = useUserAnswers();

  const similarities = useMemo(() => {
    return models.map((m) => {
      let sum = 0;
      let n = 0;
      for (const d of dilemmas) {
        const userAns = answers[d.id];
        if (!userAns) continue;
        const cell = data[d.id]?.[m.slug];
        if (!cell || cell.total === 0) continue;
        const matchCount = cell.counts[userAns] ?? 0;
        sum += matchCount / cell.total;
        n += 1;
      }
      return { slug: m.slug, score: n > 0 ? sum / n : 0, n };
    });
  }, [answers, dilemmas, models, data]);

  const totalAnswered = useMemo(
    () =>
      dilemmas.filter((d) => Boolean(answers[d.id])).length,
    [answers, dilemmas]
  );

  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: dilemmas.filter((d) => d.category === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  const setAnswer = (dilemmaId: string, value: string) =>
    setAnswers((prev) =>
      prev[dilemmaId] === value
        ? // Toggle off if clicking the same answer again
          (() => {
            const next = { ...prev };
            delete next[dilemmaId];
            return next;
          })()
        : { ...prev, [dilemmaId]: value }
    );

  const reset = () => setAnswers({});

  return (
    <div className="mx-auto max-w-6xl px-8">
      <section className="grid lg:grid-cols-[5fr_4fr] gap-10 py-16 border-b border-[var(--color-rule)]">
        <div>
          <h1 className="font-serif text-5xl leading-[1.05] text-[var(--color-ink)] tracking-tight">
            How do <span className="font-serif italic text-[var(--color-jade)]">you</span>{" "}
            compare?
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-[var(--color-ink-soft)] max-w-md">
            Answer the same {dilemmas.length} dilemmas the models faced. Your
            similarity with each model is computed live as histogram
            intersection — for each question you answer, the score reflects
            how often the model picked your choice across its 10 samples,
            averaged across answered dilemmas. Your answers are saved locally
            on this device.
          </p>
        </div>
      </section>

      <ScoresPanel
        similarities={similarities}
        models={models}
        totalAnswered={totalAnswered}
        totalDilemmas={dilemmas.length}
        onReset={reset}
      />

      <div className="pb-24">
        {grouped.map((group, gIdx) => (
          <section
            key={group.category.id}
            className="border-t border-[var(--color-rule)] py-12 first:border-t-0"
          >
            <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-6">
              {String(gIdx + 1).padStart(2, "0")} · {group.category.label}
            </h2>
            <div className="space-y-10">
              {group.items.map((d, idx) => (
                <DilemmaQuestion
                  key={d.id}
                  dilemma={d}
                  idx={idx + 1}
                  selected={answers[d.id]}
                  onSelect={(v) => setAnswer(d.id, v)}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="border-t border-[var(--color-rule)] pt-12 mt-4 flex flex-col items-center gap-3">
          <Link
            href="/#sec-you"
            className="inline-block px-8 py-3 border border-[var(--color-ink)] text-xs tracking-widest uppercase text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
          >
            see results →
          </Link>
          <p className="text-[10px] tracking-wider text-[var(--color-ink-mute)]">
            {totalAnswered === 0
              ? "answers populate the matrix and agreement table on the home page"
              : `${totalAnswered} / ${dilemmas.length} answered · best match ${
                  models.find((m) => m.slug === similarities.reduce((b, s) => (s.score > b.score ? s : b)).slug)
                    ?.label.replace(" Maverick", "") ?? "—"
                }`}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoresPanel({
  similarities,
  models,
  totalAnswered,
  totalDilemmas,
  onReset,
}: {
  similarities: { slug: string; score: number; n: number }[];
  models: ModelConfig[];
  totalAnswered: number;
  totalDilemmas: number;
  onReset: () => void;
}) {
  const remap = (v: number) => Math.max(0, Math.min(1, (v - 0.3) / 0.7));
  const bestMatch =
    totalAnswered > 0
      ? similarities.reduce((best, s) =>
          s.score > best.score ? s : best
        )
      : null;
  const bestModel = bestMatch
    ? models.find((m) => m.slug === bestMatch.slug)
    : null;

  return (
    <div
      className="sticky top-[57px] z-10 bg-[var(--color-paper)] border-b border-[var(--color-rule)] -mx-8 px-8 py-5"
    >
      <div className="flex items-baseline justify-between gap-6 mb-4">
        <div className="text-[10px] tracking-widest uppercase text-[var(--color-ink-soft)]">
          your similarity to each model
        </div>
        <div className="flex items-baseline gap-4 text-[10px] tracking-wider text-[var(--color-ink-mute)] uppercase">
          <span>
            <span className="text-[var(--color-ink)]">{totalAnswered}</span>
            {" / "}
            {totalDilemmas} answered
          </span>
          {bestModel && (
            <span>
              best match{" "}
              <span className="text-[var(--color-jade)] normal-case tracking-normal">
                {bestModel.label.replace(" Maverick", "")}
              </span>
            </span>
          )}
          <button
            onClick={onReset}
            disabled={totalAnswered === 0}
            className="hover:text-[var(--color-ink)] disabled:opacity-30 transition-colors"
          >
            reset
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {models.map((m, i) => {
          const sim = similarities[i];
          const pct = Math.round(sim.score * 100);
          const dimmed = sim.n === 0;
          return (
            <div
              key={m.slug}
              style={
                dimmed
                  ? undefined
                  : { backgroundColor: tintBg("good", remap(sim.score)) }
              }
              className={`px-3 py-2 ${dimmed ? "border border-[var(--color-rule)]" : ""}`}
            >
              <div className="text-[10px] text-[var(--color-ink-soft)] truncate">
                {m.label.replace(" Maverick", "")}
              </div>
              <div className="font-serif text-2xl text-[var(--color-ink)] leading-none mt-1">
                {dimmed ? "—" : pct}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DilemmaQuestion({
  dilemma,
  idx,
  selected,
  onSelect,
}: {
  dilemma: Dilemma;
  idx: number;
  selected: string | undefined;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid lg:grid-cols-[2fr_3fr] gap-6">
      <div>
        <div className="text-[10px] tracking-widest uppercase text-[var(--color-ink-mute)] mb-2">
          {String(idx).padStart(2, "0")}
        </div>
        <h3 className="font-serif text-2xl text-[var(--color-ink)] leading-tight mb-3">
          {dilemma.title}
        </h3>
        <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-line mb-3">
          {dilemma.scenario}
        </p>
        <p className="text-sm text-[var(--color-ink)] mt-3">
          {dilemma.question}
        </p>
      </div>
      <div className="flex flex-col gap-2 self-start">
        {dilemma.decisions.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={
                isSelected
                  ? { backgroundColor: tintBg(opt.tone, 1) }
                  : undefined
              }
              className={`text-left px-4 py-3 text-sm transition-all border ${
                isSelected
                  ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                  : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
