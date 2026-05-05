import Link from "next/link";
import { notFound } from "next/navigation";
import { models } from "@/lib/models";
import { loadModelAcrossDilemmas } from "@/lib/data";
import { TONE_TEXT, TONE_DOT } from "@/lib/colors";

export async function generateStaticParams() {
  return models.map((m) => ({ slug: m.slug }));
}

export default async function ModelPage(props: PageProps<"/m/[slug]">) {
  const { slug } = await props.params;
  const data = await loadModelAcrossDilemmas(slug);
  if (!data) notFound();
  const { model, rows } = data;

  const totalSamples = rows.reduce(
    (acc, r) => acc + r.summary.validSamples.length,
    0
  );
  const unanimous = rows.filter(
    (r) =>
      r.summary.modal &&
      r.summary.modal.count === r.summary.validSamples.length
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-8">
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
            model · {model.provider.toLowerCase()}
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] text-[var(--color-ink)] tracking-tight mb-3">
            {model.label}
          </h1>
          <div className="text-xs tracking-wider text-[var(--color-ink-mute)]">
            {model.id}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-4 self-end lg:justify-self-end">
          <Stat n={String(rows.length)} label="dilemmas" />
          <Stat n={String(totalSamples)} label="samples" />
          <Stat n={`${unanimous}/${rows.length}`} label="unanimous" />
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-xs tracking-widest text-[var(--color-ink-soft)] uppercase mb-6">
          01 · decisions across all dilemmas
        </h2>
        <table className="w-full border-collapse">
          <tbody>
            {rows.map(({ dilemma, summary }, idx) => {
              const total = summary.validSamples.length;
              const dots = summary.distribution.flatMap(({ option, count }) =>
                Array.from({ length: count }, () => option)
              );
              return (
                <tr
                  key={dilemma.id}
                  className="border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-paper-warm)]"
                >
                  <td className="py-4 pr-4 align-baseline w-80">
                    <Link
                      href={`/d/${dilemma.id}/${model.slug}`}
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
                  <td className="py-4 px-4 align-baseline w-32">
                    <div className="flex gap-[2px]">
                      {dots.map((option, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 ${TONE_DOT[option.tone]}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4 align-baseline text-sm">
                    {summary.modal ? (
                      <span className={TONE_TEXT[summary.modal.option.tone]}>
                        {summary.modal.option.short}
                        <span className="text-[var(--color-ink-mute)] ml-2">
                          {summary.modal.count}/{total}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[var(--color-ink-mute)]">—</span>
                    )}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <Link
                      href={`/d/${dilemma.id}/${model.slug}`}
                      className="text-[10px] tracking-widest text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] uppercase"
                    >
                      read →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
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
