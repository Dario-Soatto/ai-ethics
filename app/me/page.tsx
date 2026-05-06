import { dilemmas, categories } from "@/lib/dilemmas";
import { models } from "@/lib/models";
import { loadAllSummaries } from "@/lib/data";
import QuizForm from "./QuizForm";

export const metadata = {
  title: "How do you compare? · Model Ethics Catalog",
};

export type CompactCell = {
  counts: Record<string, number>;
  total: number;
};

export type CompactData = Record<string, Record<string, CompactCell>>;

export default async function MePage() {
  const summaries = await loadAllSummaries();

  // Strip down to just decision counts per (dilemma, model) so we can ship
  // it to the client without sending all reasoning text.
  const compact: CompactData = {};
  for (const { dilemma, cells } of summaries) {
    compact[dilemma.id] = {};
    for (const m of models) {
      const cell = cells[m.slug];
      const counts: Record<string, number> = {};
      for (const s of cell.validSamples) {
        counts[s.decision] = (counts[s.decision] ?? 0) + 1;
      }
      compact[dilemma.id][m.slug] = {
        counts,
        total: cell.validSamples.length,
      };
    }
  }

  return (
    <QuizForm
      dilemmas={dilemmas}
      categories={categories}
      models={models}
      data={compact}
    />
  );
}
