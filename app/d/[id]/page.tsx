import Link from "next/link";
import { notFound } from "next/navigation";
import { models } from "@/lib/models";
import { loadDilemmaWithCells, type CellSummary } from "@/lib/data";
import { TONE_TEXT, TONE_DOT } from "@/lib/colors";
import type { Dilemma } from "@/lib/dilemmas";
import { dilemmas } from "@/lib/dilemmas";

export async function generateStaticParams() {
  return dilemmas.map((d) => ({ id: d.id }));
}

export default async function DilemmaPage(props: PageProps<"/d/[id]">) {
  const { id } = await props.params;
  const data = await loadDilemmaWithCells(id);
  if (!data) notFound();
  const { dilemma, cells } = data;

  const idx = (dilemmas.findIndex((d) => d.id === dilemma.id) + 1)
    .toString()
    .padStart(2, "0");

  return (
    <div className="mx-auto max-w-6xl px-8">
      <div className="py-8 border-b border-[var(--color-rule)]">
        <Link
          href="/"
          className="text-[10px] tracking-widest text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
        >
          ← MATRIX
        </Link>
      </div>

      <section className="grid lg:grid-cols-[5fr_4fr] gap-12 py-12 border-b border-[var(--color-rule)]">
        <div>
          <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-3">
            {idx} · {dilemma.category.replace("-", " ")}
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] text-[var(--color-ink)] tracking-tight mb-4">
            {dilemma.title}
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
            {dilemma.blurb}
          </p>
        </div>

        <div className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
          <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-3">
            Scenario
          </div>
          <p className="whitespace-pre-line">{dilemma.scenario}</p>
          <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-2 mt-6">
            Question
          </div>
          <p className="text-[var(--color-ink)]">{dilemma.question}</p>
        </div>
      </section>

      <section className="py-12 border-b border-[var(--color-rule)]">
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-6">
          02 · choices
        </h2>
        <ul className="space-y-2 text-sm">
          {dilemma.decisions.map((d) => (
            <li key={d.value} className="flex items-baseline gap-3">
              <span
                className={`h-1.5 w-1.5 rounded-full inline-block flex-shrink-0 translate-y-[-2px] ${TONE_DOT[d.tone]}`}
              />
              <span className="text-[var(--color-ink-mute)] mr-2 w-44 flex-shrink-0">
                {d.short}
              </span>
              <span className="text-[var(--color-ink-soft)]">{d.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-12 border-b border-[var(--color-rule)]">
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-6">
          03 · aggregate distribution
        </h2>
        <ConsensusBars dilemma={dilemma} cells={cells} />
      </section>

      <section className="py-12">
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-6">
          04 · by model
        </h2>
        <table className="w-full border-collapse">
          <tbody>
            {models.map((m) => (
              <ModelRow
                key={m.slug}
                dilemma={dilemma}
                cell={cells[m.slug]}
                modelSlug={m.slug}
                modelLabel={m.label}
                modelProvider={m.provider}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ConsensusBars({
  dilemma,
  cells,
}: {
  dilemma: Dilemma;
  cells: Record<string, CellSummary>;
}) {
  const totals = new Map<string, number>();
  let totalSamples = 0;
  for (const slug of Object.keys(cells)) {
    for (const sample of cells[slug].validSamples) {
      totals.set(sample.decision, (totals.get(sample.decision) ?? 0) + 1);
      totalSamples += 1;
    }
  }
  const ranked = dilemma.decisions
    .map((option) => ({ option, count: totals.get(option.value) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3 max-w-3xl">
      {ranked.map(({ option, count }) => {
        const pct = totalSamples ? (count / totalSamples) * 100 : 0;
        return (
          <div key={option.value}>
            <div className="flex items-baseline justify-between mb-1.5 text-sm">
              <span className="text-[var(--color-ink)]">{option.label}</span>
              <span className="text-[10px] tracking-wider text-[var(--color-ink-mute)] ml-3">
                {count}/{totalSamples} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-[3px] bg-[var(--color-paper-warm)] overflow-hidden">
              <div
                className={`h-full ${TONE_DOT[option.tone]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModelRow({
  dilemma,
  cell,
  modelSlug,
  modelLabel,
  modelProvider,
}: {
  dilemma: Dilemma;
  cell: CellSummary;
  modelSlug: string;
  modelLabel: string;
  modelProvider: string;
}) {
  const total = cell.validSamples.length;
  return (
    <tr className="border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-paper-warm)]">
      <td className="py-4 pr-4 align-baseline w-72">
        <Link
          href={`/d/${dilemma.id}/${modelSlug}`}
          className="block group"
        >
          <div className="text-sm text-[var(--color-ink)] group-hover:text-[var(--color-jade)]">
            {modelLabel}
          </div>
          <div className="text-[10px] tracking-wider text-[var(--color-ink-mute)] uppercase mt-0.5">
            {modelProvider}
          </div>
        </Link>
      </td>
      <td className="py-4 px-4 align-baseline">
        {cell.modal && (
          <span className={`text-sm ${TONE_TEXT[cell.modal.option.tone]}`}>
            {cell.modal.option.short}
            <span className="text-[var(--color-ink-mute)] ml-2">
              {cell.modal.count}/{total}
            </span>
          </span>
        )}
      </td>
      <td className="py-4 px-4 align-baseline">
        <div className="flex gap-[2px]">
          {cell.distribution
            .flatMap(({ option, count }) =>
              Array.from({ length: count }, () => option)
            )
            .map((option, i) => (
              <span
                key={i}
                className={`h-2 w-2 ${TONE_DOT[option.tone]}`}
              />
            ))}
        </div>
      </td>
      <td className="py-4 pl-4 text-right align-baseline">
        <Link
          href={`/d/${dilemma.id}/${modelSlug}`}
          className="text-[10px] tracking-widest text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] uppercase"
        >
          read →
        </Link>
      </td>
    </tr>
  );
}
