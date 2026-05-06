import { dilemmas, categories } from "@/lib/dilemmas";
import { models } from "@/lib/models";
import { loadAllSummaries, buildCompactData } from "@/lib/data";
import QuizForm from "./QuizForm";

export const metadata = {
  title: "How do you compare? · Model Ethics Catalog",
};

export default async function YouPage() {
  const summaries = await loadAllSummaries();
  const compact = buildCompactData(summaries);

  return (
    <QuizForm
      dilemmas={dilemmas}
      categories={categories}
      models={models}
      data={compact}
    />
  );
}
