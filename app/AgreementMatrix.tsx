"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ModelConfig } from "@/lib/models";
import type { Dilemma } from "@/lib/dilemmas";
import type { CompactData } from "@/lib/data";
import { tintBg } from "@/lib/colors";
import { useUserAnswers } from "@/lib/useUserAnswers";

type Props = {
  models: ModelConfig[];
  dilemmas: Dilemma[]; // dilemmas in scope (filter-aware)
  data: CompactData;
};

export default function AgreementMatrix({
  models,
  dilemmas,
  data,
}: Props) {
  const { answers, hydrated } = useUserAnswers();

  // Stretch the typical [0.5, 1] range into [0, 1] so differences pop.
  const remap = (v: number) => Math.max(0, Math.min(1, (v - 0.5) / 0.5));

  // Compute model x model agreement (histogram intersection over distributions)
  const modelMatrix = useMemo(() => {
    const N = models.length;
    const m: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        let total = 0;
        let count = 0;
        for (const d of dilemmas) {
          const cellI = data[d.id]?.[models[i].slug];
          const cellJ = data[d.id]?.[models[j].slug];
          if (!cellI || !cellJ || cellI.total === 0 || cellJ.total === 0)
            continue;
          const decisions = new Set([
            ...Object.keys(cellI.counts),
            ...Object.keys(cellJ.counts),
          ]);
          let overlap = 0;
          for (const dec of decisions) {
            overlap += Math.min(
              (cellI.counts[dec] ?? 0) / cellI.total,
              (cellJ.counts[dec] ?? 0) / cellJ.total
            );
          }
          total += overlap;
          count += 1;
        }
        m[i][j] = count > 0 ? total / count : 0;
      }
    }
    return m;
  }, [models, dilemmas, data]);

  // User vs each model — only counts dilemmas the user has answered
  const userVsModel = useMemo(() => {
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
      return { score: n > 0 ? sum / n : null, n };
    });
  }, [models, dilemmas, data, answers]);

  // How many dilemmas in scope the user has answered (drives whether the
  // user row/col shows numbers at all)
  const userAnsweredInScope = useMemo(() => {
    return dilemmas.filter((d) => Boolean(answers[d.id])).length;
  }, [dilemmas, answers]);

  const CELL_W = 100;
  const ROW_LABEL_W = 160;
  const colCount = models.length + 1; // +1 for "you" column

  return (
    <div className="overflow-x-auto -mx-1">
      <table
        className="border-collapse"
        style={{
          tableLayout: "fixed",
          width: ROW_LABEL_W + CELL_W * colCount,
        }}
      >
        <thead>
          <tr>
            <th style={{ width: ROW_LABEL_W }} />
            {models.map((m) => (
              <th
                key={m.slug}
                style={{ width: CELL_W }}
                className="text-center px-2 py-3 text-xs font-normal text-[var(--color-ink)] border-b border-[var(--color-rule)]"
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
              style={{ width: CELL_W }}
              className="text-center px-2 py-3 text-xs font-normal border-b border-[var(--color-rule)] border-l border-[var(--color-rule)]"
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
          {models.map((rowM, i) => (
            <tr
              key={rowM.slug}
              className="border-b border-[var(--color-rule)] last:border-b-0"
            >
              <th
                style={{ width: ROW_LABEL_W }}
                className="text-left pr-4 pl-2 py-3 text-sm font-normal whitespace-nowrap"
              >
                <Link
                  href={`/m/${rowM.slug}`}
                  className="text-[var(--color-ink)] hover:text-[var(--color-jade)]"
                >
                  {rowM.label.replace(" Maverick", "")}
                </Link>
              </th>
              {models.map((colM, j) => {
                const value = modelMatrix[i][j];
                const pct = Math.round(value * 100);
                return (
                  <td
                    key={colM.slug}
                    style={{ width: CELL_W }}
                    className="p-1 align-middle"
                  >
                    <div
                      style={{ backgroundColor: tintBg("good", remap(value)) }}
                      className="block px-3 py-3 text-center text-sm text-[var(--color-ink)]"
                    >
                      {pct}
                    </div>
                  </td>
                );
              })}
              {/* user column for this model row */}
              <td
                style={{ width: CELL_W }}
                className="p-1 align-middle border-l border-[var(--color-rule)]"
              >
                {(() => {
                  const u = userVsModel[i];
                  if (!hydrated || u.score === null) {
                    return (
                      <Link
                        href="/you"
                        className="block px-3 py-3 text-center text-sm text-[var(--color-ink-mute)] border border-dashed border-[var(--color-rule)] hover:border-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
                      >
                        —
                      </Link>
                    );
                  }
                  return (
                    <div
                      style={{
                        backgroundColor: tintBg("good", remap(u.score)),
                      }}
                      className="block px-3 py-3 text-center text-sm text-[var(--color-ink)]"
                    >
                      {Math.round(u.score * 100)}
                    </div>
                  );
                })()}
              </td>
            </tr>
          ))}
          {/* user row */}
          <tr className="border-t border-[var(--color-rule)]">
            <th
              style={{ width: ROW_LABEL_W }}
              className="text-left pr-4 pl-2 py-3 text-sm font-normal whitespace-nowrap"
            >
              <Link
                href="/you"
                className="font-serif italic text-[var(--color-jade)] text-[18px] hover:opacity-80"
              >
                you
              </Link>
            </th>
            {models.map((m, i) => {
              const u = userVsModel[i];
              if (!hydrated || u.score === null) {
                return (
                  <td
                    key={m.slug}
                    style={{ width: CELL_W }}
                    className="p-1 align-middle"
                  >
                    <Link
                      href="/you"
                      className="block px-3 py-3 text-center text-sm text-[var(--color-ink-mute)] border border-dashed border-[var(--color-rule)] hover:border-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
                    >
                      —
                    </Link>
                  </td>
                );
              }
              return (
                <td
                  key={m.slug}
                  style={{ width: CELL_W }}
                  className="p-1 align-middle"
                >
                  <div
                    style={{ backgroundColor: tintBg("good", remap(u.score)) }}
                    className="block px-3 py-3 text-center text-sm text-[var(--color-ink)]"
                  >
                    {Math.round(u.score * 100)}
                  </div>
                </td>
              );
            })}
            {/* user-vs-user diagonal */}
            <td
              style={{ width: CELL_W }}
              className="p-1 align-middle border-l border-[var(--color-rule)]"
            >
              {!hydrated || userAnsweredInScope === 0 ? (
                <Link
                  href="/you"
                  className="block px-3 py-3 text-center text-sm text-[var(--color-ink-mute)] border border-dashed border-[var(--color-rule)] hover:border-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
                >
                  —
                </Link>
              ) : (
                <div
                  style={{ backgroundColor: tintBg("good", 1) }}
                  className="block px-3 py-3 text-center text-sm text-[var(--color-ink)]"
                >
                  100
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
