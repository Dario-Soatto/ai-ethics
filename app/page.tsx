import Link from "next/link";
import { Fragment } from "react";
import { models } from "@/lib/models";
import {
  loadAllSummaries,
  computeAgreementMatrix,
  type CellSummary,
} from "@/lib/data";
import { tintBg, TONE_CSS_VAR } from "@/lib/colors";
import {
  categories,
  dilemmas,
  type CategoryId,
  type Dilemma,
} from "@/lib/dilemmas";

function Cell({
  cell,
  dilemma,
  modelSlug,
}: {
  cell: CellSummary;
  dilemma: Dilemma;
  modelSlug: string;
}) {
  const total = cell.validSamples.length;
  if (!cell.modal || total === 0) {
    return (
      <td className="p-1 align-middle">
        <div className="block px-3 py-3 text-center text-[var(--color-ink-mute)] text-sm">
          —
        </div>
      </td>
    );
  }
  const ratio = cell.modal.count / total;
  return (
    <td className="p-1 align-middle">
      <Link
        href={`/d/${dilemma.id}/${modelSlug}`}
        style={{ backgroundColor: tintBg(cell.modal.option.tone, ratio) }}
        className="block px-3 py-3 text-center text-sm text-[var(--color-ink)] transition hover:brightness-95"
      >
        {cell.modal.option.short}
      </Link>
    </td>
  );
}

export default async function HomePage(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const rawCategory = sp?.category;
  const filter =
    typeof rawCategory === "string" &&
    categories.some((c) => c.id === rawCategory)
      ? (rawCategory as CategoryId)
      : null;

  const summaries = await loadAllSummaries();
  const visibleSummaries = filter
    ? summaries.filter((s) => s.dilemma.category === filter)
    : summaries;

  // Group visible rows by category, preserving the order in `categories`.
  const grouped = categories
    .map((cat) => ({
      category: cat,
      rows: visibleSummaries.filter((s) => s.dilemma.category === cat.id),
    }))
    .filter((g) => g.rows.length > 0);

  const agreement = computeAgreementMatrix(visibleSummaries);

  return (
    <div className="mx-auto max-w-6xl px-8">
      <section className="grid lg:grid-cols-[5fr_4fr] gap-10 py-16 border-b border-[var(--color-rule)]">
        <div>
          <h1 className="font-serif text-5xl leading-[1.05] text-[var(--color-ink)] tracking-tight">
            How frontier models reason about{" "}
            <span className="font-serif italic text-[var(--color-jade)]">
              ethics
            </span>
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-[var(--color-ink-soft)] max-w-md">
            A catalogue of how six frontier language models respond to{" "}
            {dilemmas.length} classic ethical, strategic, and decision-theoretic
            dilemmas. Each cell is the modal answer across ten independent
            samples at temperature 1.0.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-6 self-end text-xs lg:justify-self-end">
          <Stat n={String(dilemmas.length)} label="dilemmas" />
          <Stat n={String(models.length)} label="models" />
          <Stat n="10" label="samples / cell" />
        </div>
      </section>

      <section className="py-10">
        <div className="flex items-baseline justify-between mb-5 gap-4 flex-wrap">
          <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase">
            01 · the matrix
          </h2>
          <FilterPills active={filter} />
        </div>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 pl-2 pr-6 text-[10px] tracking-widest uppercase text-[var(--color-ink-mute)] font-normal border-b border-[var(--color-rule)] w-72 whitespace-nowrap">
                  dilemma
                </th>
                {models.map((m) => (
                  <th
                    key={m.slug}
                    className="text-center px-2 py-3 text-xs tracking-wide text-[var(--color-ink)] font-normal border-b border-[var(--color-rule)] min-w-[120px]"
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
              </tr>
            </thead>
            <tbody>
              {grouped.map((group) => (
                <Fragment key={group.category.id}>
                  <tr>
                    <td
                      colSpan={models.length + 1}
                      className="pt-7 pb-2 pl-2"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase">
                          {group.category.label}
                        </span>
                        <span className="text-[10px] text-[var(--color-ink-mute)]">
                          · {group.rows.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.rows.map(({ dilemma, cells }, idx) => (
                    <tr
                      key={dilemma.id}
                      className="border-b border-[var(--color-rule)] last:border-b-0"
                    >
                      <td className="py-3 pl-2 pr-6 align-middle whitespace-nowrap">
                        <Link
                          href={`/d/${dilemma.id}`}
                          className="block group"
                        >
                          <span className="text-[10px] text-[var(--color-ink-mute)] mr-2">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm text-[var(--color-ink)] group-hover:text-[var(--color-jade)]">
                            {dilemma.title}
                          </span>
                        </Link>
                      </td>
                      {models.map((m) => (
                        <Cell
                          key={m.slug}
                          cell={cells[m.slug]}
                          dilemma={dilemma}
                          modelSlug={m.slug}
                        />
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
              {grouped.length === 0 && (
                <tr>
                  <td
                    colSpan={models.length + 1}
                    className="py-10 text-center text-sm text-[var(--color-ink-mute)]"
                  >
                    No dilemmas in this category yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="py-12 border-t border-[var(--color-rule)]">
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-3">
          02 · model agreement
        </h2>
        <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed max-w-2xl mb-8">
          How similar each pair of models&apos; decision distributions are
          across {visibleSummaries.length} dilemma{visibleSummaries.length === 1 ? "" : "s"}.
          Computed as histogram intersection per dilemma — Σ min(P<sub>A</sub>(opt),
          P<sub>B</sub>(opt)) — averaged across dilemmas. 100 = identical
          distributions everywhere; 0 = no overlap.
        </p>
        <AgreementMatrix matrix={agreement} />
      </section>

      <section className="py-12 border-t border-[var(--color-rule)]">
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-8">
          03 · color key
        </h2>
        <ColorKey />
      </section>
    </div>
  );
}

function FilterPills({ active }: { active: CategoryId | null }) {
  const allClass = active === null;
  const baseLink =
    "px-2.5 py-1 text-[10px] tracking-widest uppercase border transition";
  const activeStyle =
    "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]";
  const idleStyle =
    "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]";
  return (
    <div className="flex flex-wrap gap-1.5">
      <Link
        href="/"
        className={`${baseLink} ${allClass ? activeStyle : idleStyle}`}
      >
        all
      </Link>
      {categories.map((cat) => {
        const isActive = active === cat.id;
        return (
          <Link
            key={cat.id}
            href={`/?category=${cat.id}`}
            className={`${baseLink} ${isActive ? activeStyle : idleStyle}`}
          >
            {cat.label.toLowerCase()}
          </Link>
        );
      })}
    </div>
  );
}

function AgreementMatrix({ matrix }: { matrix: number[][] }) {
  // Stretch the typical [0.5, 1] range into [0, 1] so differences pop.
  const remap = (v: number) => Math.max(0, Math.min(1, (v - 0.5) / 0.5));

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-32" />
            {models.map((m) => (
              <th
                key={m.slug}
                className="text-center px-2 py-3 text-xs font-normal text-[var(--color-ink)] min-w-[100px] border-b border-[var(--color-rule)]"
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
          </tr>
        </thead>
        <tbody>
          {models.map((rowM, i) => (
            <tr
              key={rowM.slug}
              className="border-b border-[var(--color-rule)] last:border-b-0"
            >
              <th className="text-left pr-4 pl-2 py-3 text-sm font-normal whitespace-nowrap">
                <Link
                  href={`/m/${rowM.slug}`}
                  className="text-[var(--color-ink)] hover:text-[var(--color-jade)]"
                >
                  {rowM.label.replace(" Maverick", "")}
                </Link>
              </th>
              {models.map((colM, j) => {
                const value = matrix[i][j];
                const isDiagonal = i === j;
                const pct = Math.round(value * 100);
                return (
                  <td key={colM.slug} className="p-1 align-middle">
                    <div
                      style={
                        isDiagonal
                          ? undefined
                          : { backgroundColor: tintBg("good", remap(value)) }
                      }
                      className={`block px-3 py-3 text-center text-sm ${
                        isDiagonal
                          ? "text-[var(--color-ink-mute)]"
                          : "text-[var(--color-ink)]"
                      }`}
                    >
                      {isDiagonal ? "—" : pct}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 leading-tight">
      <span className="font-serif text-xl text-[var(--color-ink)]">{n}</span>
      <span className="text-[10px] tracking-wider text-[var(--color-ink-mute)] uppercase">
        {label}
      </span>
    </div>
  );
}

function ColorKey() {
  type KeyRow = {
    tone: "good" | "bad" | "neutral" | "refuse";
    name: string;
    headline: string;
    description: string;
    examples: string;
  };
  const rows: KeyRow[] = [
    {
      tone: "good",
      name: "jade",
      headline: "act-utilitarian / cooperative",
      description:
        "The choice that maximizes aggregate welfare or sustains cooperation when others might reciprocate.",
      examples: "e.g., pull (trolley), cooperate (PD), $50 offer (ultimatum)",
    },
    {
      tone: "bad",
      name: "vermillion",
      headline: "restraint / defection / lowball",
      description:
        "The choice that respects deontological constraints, defects in coordination problems, or claims more for oneself.",
      examples:
        "e.g., don't push (footbridge), defect (PD), $0 contribution (public goods)",
    },
    {
      tone: "neutral",
      name: "ochre",
      headline: "moderate / middle-ground",
      description:
        "A middle-ground option on dilemmas that offer several gradations between the two extremes.",
      examples:
        "e.g., $31–49 offer (ultimatum), $4–6 contribution (public goods)",
    },
    {
      tone: "refuse",
      name: "gray",
      headline: "abstention",
      description:
        "Declining to engage with the dilemma — listed as a choice on a few dilemmas where refusal is itself a defensible response.",
      examples: "e.g., refuse (trolley, transplant, Newcomb)",
    },
  ];
  const swatchRatios = [1, 0.7, 0.4];

  return (
    <div className="space-y-7 max-w-4xl">
      {rows.map((row) => (
        <div
          key={row.name}
          className="grid grid-cols-[180px_1fr] gap-6 items-baseline"
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {swatchRatios.map((r) => (
                <span
                  key={r}
                  style={{ backgroundColor: tintBg(row.tone, r) }}
                  className="block h-5 w-5"
                />
              ))}
            </div>
            <div className="leading-tight">
              <div className="text-xs text-[var(--color-ink)]">{row.name}</div>
              <div className="text-[10px] text-[var(--color-ink-mute)] uppercase tracking-wider">
                {row.headline.split(" / ")[0]}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              {row.description}
            </div>
            <div className="text-xs text-[var(--color-ink-mute)] mt-1.5">
              {row.examples}
            </div>
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[180px_1fr] gap-6 items-baseline pt-3 border-t border-[var(--color-rule)]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {swatchRatios.map((r) => (
              <span
                key={r}
                style={{
                  backgroundColor: `color-mix(in oklab, ${TONE_CSS_VAR.good} ${Math.round(r * 60)}%, var(--color-paper))`,
                }}
                className="block h-5 w-5"
              />
            ))}
          </div>
          <div className="leading-tight">
            <div className="text-xs text-[var(--color-ink)]">opacity</div>
            <div className="text-[10px] text-[var(--color-ink-mute)] uppercase tracking-wider">
              agreement
            </div>
          </div>
        </div>
        <div className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
          A cell&apos;s saturation reflects within-model agreement —
          <span className="text-[var(--color-ink)]"> 10/10</span> samples
          agreeing gives the deepest tone,{" "}
          <span className="text-[var(--color-ink)]">5/10</span> the faintest.
          Click any cell for the exact distribution and reasoning.
        </div>
      </div>
    </div>
  );
}
