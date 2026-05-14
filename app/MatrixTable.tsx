"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import type {
  Category,
  Dilemma,
  DecisionOption,
} from "@/lib/dilemmas";
import type { ModelConfig } from "@/lib/models";
import type { CompactData } from "@/lib/data";
import { tintBg } from "@/lib/colors";
import { useUserAnswers } from "@/lib/useUserAnswers";

type Group = { category: Category; dilemmas: Dilemma[] };

export default function MatrixTable({
  models,
  groups,
  data,
}: {
  models: ModelConfig[];
  groups: Group[];
  data: CompactData;
}) {
  const { answers, hydrated } = useUserAnswers();

  // Build a lookup of dilemmaId → option-by-value for quick access
  const optionLookup = useMemo(() => {
    const out: Record<string, Record<string, DecisionOption>> = {};
    for (const g of groups) {
      for (const d of g.dilemmas) {
        out[d.id] = Object.fromEntries(
          d.decisions.map((opt) => [opt.value, opt])
        );
      }
    }
    return out;
  }, [groups]);

  // Each <th> is sticky so the column headers stay visible while
  // scrolling through the matrix rows. The wrapper used to be
  // overflow-x-auto but that creates a scroll container which breaks
  // viewport-relative sticky. We accept horizontal overflow on very
  // narrow screens in exchange for the sticky header on desktop.
  const stickyTh =
    "sticky top-[60px] z-10 bg-[var(--color-paper)] border-b border-[var(--color-rule)]";

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              className={`${stickyTh} text-left py-3 pl-2 pr-6 text-[10px] tracking-widest uppercase text-[var(--color-ink-mute)] font-normal w-72 whitespace-nowrap`}
            >
              dilemma
            </th>
            {models.map((m) => (
              <th
                key={m.slug}
                className={`${stickyTh} text-center px-2 py-3 text-xs tracking-wide text-[var(--color-ink)] font-normal min-w-[120px]`}
              >
                <Link
                  href={`/m/${m.slug}`}
                  className="hover:text-[var(--color-jade)]"
                >
                  {m.label.replace(" Maverick", "")}
                </Link>
                <div className="text-[10px] text-[var(--color-ink-mute)] tracking-wider font-normal mt-0.5">
                  {m.provider.toLowerCase()}
                </div>
              </th>
            ))}
            <th
              className={`${stickyTh} text-center px-2 py-3 text-xs tracking-wide font-normal min-w-[120px] border-l border-[var(--color-rule)]`}
            >
              <span className="font-serif italic text-[var(--color-jade)] text-[15px]">
                you
              </span>
              <div className="text-[10px] text-[var(--color-ink-mute)] tracking-wider font-normal mt-0.5">
                <Link href="/you" className="hover:text-[var(--color-ink)]">
                  fill in →
                </Link>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.category.id}>
              <tr>
                <td
                  colSpan={models.length + 2}
                  className="pt-7 pb-2 pl-2"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase">
                      {group.category.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-mute)]">
                      · {group.dilemmas.length}
                    </span>
                  </div>
                </td>
              </tr>
              {group.dilemmas.map((dilemma, idx) => (
                <tr
                  key={dilemma.id}
                  className="border-b border-[var(--color-rule)] last:border-b-0"
                >
                  <td className="py-3 pl-2 pr-6 align-middle whitespace-nowrap">
                    <Link href={`/d/${dilemma.id}`} className="block group">
                      <span className="text-[10px] text-[var(--color-ink-mute)] mr-2">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm text-[var(--color-ink)] group-hover:text-[var(--color-jade)]">
                        {dilemma.title}
                      </span>
                    </Link>
                  </td>
                  {models.map((m) => (
                    <ModelCell
                      key={m.slug}
                      cell={data[dilemma.id]?.[m.slug]}
                      dilemma={dilemma}
                      modelSlug={m.slug}
                    />
                  ))}
                  <YouCell
                    dilemma={dilemma}
                    answer={hydrated ? answers[dilemma.id] : undefined}
                    option={
                      hydrated && answers[dilemma.id]
                        ? optionLookup[dilemma.id]?.[answers[dilemma.id]!]
                        : undefined
                    }
                  />
                </tr>
              ))}
            </Fragment>
          ))}
          {groups.length === 0 && (
            <tr>
              <td
                colSpan={models.length + 2}
                className="py-10 text-center text-sm text-[var(--color-ink-mute)]"
              >
                No dilemmas in this category yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ModelCell({
  cell,
  dilemma,
  modelSlug,
}: {
  cell: CompactData[string][string] | undefined;
  dilemma: Dilemma;
  modelSlug: string;
}) {
  if (!cell || !cell.modal || cell.total === 0) {
    return (
      <td className="p-1 align-middle">
        <div className="block px-3 py-3 text-center text-[var(--color-ink-mute)] text-sm">
          —
        </div>
      </td>
    );
  }
  const option = dilemma.decisions.find(
    (o) => o.value === cell.modal!.value
  );
  if (!option) {
    return <td className="p-1 align-middle">—</td>;
  }
  const ratio = cell.modal.count / cell.total;
  return (
    <td className="p-1 align-middle">
      <Link
        href={`/d/${dilemma.id}/${modelSlug}`}
        style={{ backgroundColor: tintBg(option.tone, ratio) }}
        className="block px-3 py-3 text-center text-sm text-[var(--color-ink)] transition hover:brightness-95"
      >
        {option.short}
      </Link>
    </td>
  );
}

function YouCell({
  dilemma,
  answer,
  option,
}: {
  dilemma: Dilemma;
  answer: string | undefined;
  option: DecisionOption | undefined;
}) {
  if (!answer || !option) {
    return (
      <td className="p-1 align-middle border-l border-[var(--color-rule)]">
        <Link
          href="/you"
          className="block px-3 py-3 text-center text-[var(--color-ink-mute)] text-sm border border-dashed border-[var(--color-rule)] hover:border-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
        >
          —
        </Link>
      </td>
    );
  }
  return (
    <td className="p-1 align-middle border-l border-[var(--color-rule)]">
      <Link
        href="/you"
        style={{ backgroundColor: tintBg(option.tone, 1) }}
        className="block px-3 py-3 text-center text-sm text-[var(--color-ink)] transition hover:brightness-95"
        title={`Your answer on ${dilemma.title}`}
      >
        {option.short}
      </Link>
    </td>
  );
}
