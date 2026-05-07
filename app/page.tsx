import Link from "next/link";
import SectionNav from "./SectionNav";
import MatrixTable from "./MatrixTable";
import AgreementMatrix from "./AgreementMatrix";
import YouSection from "./YouSection";
import { models } from "@/lib/models";
import { loadAllSummaries, buildCompactData } from "@/lib/data";
import { tintBg, TONE_CSS_VAR } from "@/lib/colors";
import {
  categories,
  dilemmas,
  type CategoryId,
} from "@/lib/dilemmas";

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

  // Compact data for client components (matrix table + agreement matrix)
  const compactData = buildCompactData(visibleSummaries);

  // Group visible dilemmas by category, preserving the order in `categories`.
  const groups = categories
    .map((cat) => ({
      category: cat,
      dilemmas: visibleSummaries
        .filter((s) => s.dilemma.category === cat.id)
        .map((s) => s.dilemma),
    }))
    .filter((g) => g.dilemmas.length > 0);

  const visibleDilemmas = visibleSummaries.map((s) => s.dilemma);

  return (
    <div className="mx-auto max-w-6xl px-8">
      <section className="grid lg:grid-cols-[5fr_4fr] gap-10 py-16 border-b border-[var(--color-rule)]">
        <div>
          <Link
            href="/you"
            className="inline-flex items-baseline gap-2 mb-6 text-[10px] tracking-widest uppercase text-[var(--color-jade)] hover:text-[var(--color-ink)] border-b border-[var(--color-jade)]/40 hover:border-[var(--color-ink)] pb-1 transition-colors"
          >
            <span className="font-serif italic normal-case tracking-normal text-[14px]">
              new
            </span>
            <span>see how you compare →</span>
          </Link>
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

      <section id="sec-matrix" className="py-10 scroll-mt-20">
        <div className="flex items-baseline justify-between mb-5 gap-4 flex-wrap">
          <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase">
            01 · the matrix
          </h2>
          <FilterPills active={filter} />
        </div>
        <MatrixTable
          models={models}
          groups={groups}
          data={compactData}
        />
      </section>

      <section
        id="sec-agreement"
        className="py-12 border-t border-[var(--color-rule)] scroll-mt-20"
      >
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-3">
          02 · model agreement
        </h2>
        <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed max-w-2xl mb-8">
          How similar each pair of models&apos; decision distributions are
          across {visibleDilemmas.length} dilemma
          {visibleDilemmas.length === 1 ? "" : "s"}. Computed as histogram
          intersection per dilemma — Σ min(P<sub>A</sub>(opt),
          P<sub>B</sub>(opt)) — averaged across dilemmas. 100 = identical
          distributions everywhere; 0 = no overlap.
        </p>
        <AgreementMatrix
          models={models}
          dilemmas={visibleDilemmas}
          data={compactData}
        />
      </section>

      <section
        id="sec-you"
        className="py-12 border-t border-[var(--color-rule)] scroll-mt-20"
      >
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-6">
          03 · you
        </h2>
        <YouSection
          models={models}
          dilemmas={visibleDilemmas}
          data={compactData}
        />
      </section>

      <section
        id="sec-key"
        className="py-12 border-t border-[var(--color-rule)] scroll-mt-20"
      >
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-8">
          04 · color key
        </h2>
        <ColorKey />
      </section>

      <SectionNav />
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
