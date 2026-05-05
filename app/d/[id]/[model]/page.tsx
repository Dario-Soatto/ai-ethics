import Link from "next/link";
import { notFound } from "next/navigation";
import { models } from "@/lib/models";
import { dilemmas } from "@/lib/dilemmas";
import { loadCell, summarizeCell } from "@/lib/data";
import { TONE_TEXT, TONE_DOT } from "@/lib/colors";
import type { DecisionOption } from "@/lib/dilemmas";

export async function generateStaticParams() {
  const params: { id: string; model: string }[] = [];
  for (const d of dilemmas) {
    for (const m of models) {
      params.push({ id: d.id, model: m.slug });
    }
  }
  return params;
}

export default async function CellPage(
  props: PageProps<"/d/[id]/[model]">
) {
  const { id, model: modelSlug } = await props.params;
  const dilemma = dilemmas.find((d) => d.id === id);
  const model = models.find((m) => m.slug === modelSlug);
  if (!dilemma || !model) notFound();

  const cell = await loadCell(id, modelSlug);
  if (!cell) notFound();
  const summary = summarizeCell(dilemma, cell, modelSlug);

  const optionByValue = new Map<string, DecisionOption>(
    dilemma.decisions.map((d) => [d.value, d])
  );

  return (
    <div className="mx-auto max-w-4xl px-8">
      <nav className="py-8 text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase border-b border-[var(--color-rule)]">
        <Link href="/" className="hover:text-[var(--color-ink)]">
          matrix
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/d/${dilemma.id}`}
          className="hover:text-[var(--color-ink)]"
        >
          {dilemma.title.toLowerCase()}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-ink)]">{model.label.toLowerCase()}</span>
      </nav>

      <section className="py-10 border-b border-[var(--color-rule)]">
        <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-3">
          {dilemma.category.replace("-", " ")} · {model.id}
        </div>
        <h1 className="font-serif text-4xl leading-tight text-[var(--color-ink)] mb-4 tracking-tight">
          {dilemma.title} <span className="text-[var(--color-ink-mute)]">·</span>{" "}
          <span className="font-serif italic">{model.label}</span>
        </h1>
        <div className="flex items-baseline gap-6 text-sm mt-6">
          {summary.modal && (
            <div>
              <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-1">
                modal answer
              </div>
              <div className={TONE_TEXT[summary.modal.option.tone]}>
                {summary.modal.option.short}{" "}
                <span className="text-[var(--color-ink-mute)]">
                  {summary.modal.count}/{summary.validSamples.length}
                </span>
              </div>
            </div>
          )}
          <div>
            <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-1">
              distribution
            </div>
            <div className="flex gap-[3px] mt-0.5">
              {summary.distribution
                .flatMap(({ option, count }) =>
                  Array.from({ length: count }, () => option)
                )
                .map((option, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 ${TONE_DOT[option.tone]}`}
                  />
                ))}
            </div>
          </div>
          {summary.distribution.filter((d) => d.count > 0).length > 1 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {summary.distribution
                .filter((d) => d.count > 0)
                .map(({ option, count }) => (
                  <span
                    key={option.value}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[option.tone]}`}
                    />
                    <span className={TONE_TEXT[option.tone]}>
                      {option.short}
                    </span>
                    <span className="text-[var(--color-ink-mute)]">
                      ×{count}
                    </span>
                  </span>
                ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 border-b border-[var(--color-rule)]">
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-8">
          all {summary.validSamples.length} samples
        </h2>
        <ol className="space-y-10">
          {summary.validSamples
            .sort((a, b) => a.sample - b.sample)
            .map((s) => {
              const option = optionByValue.get(s.decision);
              const tone = option?.tone ?? "neutral";
              return (
                <li
                  key={s.sample}
                  className="grid grid-cols-[80px_1fr] gap-6"
                >
                  <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase">
                    <div>#{String(s.sample).padStart(2, "0")}</div>
                    <div className={`mt-1 ${TONE_TEXT[tone]} normal-case`}>
                      {option?.short ?? s.decision}
                    </div>
                    <div className="mt-3 text-[var(--color-ink-mute)]">
                      conf {s.confidence.toFixed(2)}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed font-serif text-[15px]">
                    {s.reasoning}
                  </p>
                </li>
              );
            })}
        </ol>
      </section>

      <section className="py-12">
        <details className="group">
          <summary className="text-xs tracking-widest text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] uppercase cursor-pointer list-none">
            <span className="group-open:hidden">+ exact prompt</span>
            <span className="hidden group-open:inline">− exact prompt</span>
          </summary>
          <div className="mt-6 space-y-6 max-w-3xl">
            <div>
              <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-2">
                system
              </div>
              <pre className="text-xs text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap border-l border-[var(--color-rule)] pl-4">
                {cell.systemPrompt}
              </pre>
            </div>
            <div>
              <div className="text-[10px] tracking-widest text-[var(--color-ink-mute)] uppercase mb-2">
                user
              </div>
              <pre className="text-xs text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-wrap border-l border-[var(--color-rule)] pl-4">
                {cell.userPrompt}
              </pre>
            </div>
            <div className="text-[10px] tracking-wider text-[var(--color-ink-mute)]">
              temperature {cell.temperature} · generated{" "}
              {new Date(cell.generatedAt).toISOString().slice(0, 10)}
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
