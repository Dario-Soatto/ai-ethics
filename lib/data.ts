import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { CellResults, SampleResult } from "./schema";
import { dilemmas } from "./dilemmas";
import type { Dilemma, DecisionOption } from "./dilemmas";
import { models } from "./models";
import type { ModelConfig } from "./models";

// Resolve from process.cwd() so the path is correct in Vercel's
// serverless function bundle (where compiled code lives in .next/...
// but cwd is set to the project root).
const RESULTS_DIR = path.join(process.cwd(), "data", "results");

export type CellSummary = {
  dilemmaId: string;
  modelSlug: string;
  validSamples: SampleResult[];
  errorCount: number;
  modal: { value: string; count: number; option: DecisionOption } | null;
  distribution: { option: DecisionOption; count: number }[];
};

export type DilemmaWithCells = {
  dilemma: Dilemma;
  cells: Record<string, CellSummary>;
};

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function loadCell(
  dilemmaId: string,
  modelSlug: string
): Promise<CellResults | null> {
  const p = path.join(RESULTS_DIR, dilemmaId, `${modelSlug}.json`);
  if (!(await fileExists(p))) return null;
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw) as CellResults;
}

export function summarizeCell(
  dilemma: Dilemma,
  cell: CellResults | null,
  modelSlug: string
): CellSummary {
  if (!cell) {
    return {
      dilemmaId: dilemma.id,
      modelSlug,
      validSamples: [],
      errorCount: 0,
      modal: null,
      distribution: dilemma.decisions.map((option) => ({ option, count: 0 })),
    };
  }
  const validSamples = cell.samples.filter((s) => !s.error);
  const errorCount = cell.samples.length - validSamples.length;
  const counts = new Map<string, number>();
  for (const s of validSamples) {
    counts.set(s.decision, (counts.get(s.decision) ?? 0) + 1);
  }
  const distribution = dilemma.decisions.map((option) => ({
    option,
    count: counts.get(option.value) ?? 0,
  }));
  let modal: CellSummary["modal"] = null;
  for (const entry of distribution) {
    if (!modal || entry.count > modal.count) {
      modal = {
        value: entry.option.value,
        count: entry.count,
        option: entry.option,
      };
    }
  }
  if (modal && modal.count === 0) modal = null;
  return {
    dilemmaId: dilemma.id,
    modelSlug,
    validSamples,
    errorCount,
    modal,
    distribution,
  };
}

export async function loadAllSummaries(): Promise<DilemmaWithCells[]> {
  const out: DilemmaWithCells[] = [];
  for (const dilemma of dilemmas) {
    const cells: Record<string, CellSummary> = {};
    for (const model of models) {
      const cell = await loadCell(dilemma.id, model.slug);
      cells[model.slug] = summarizeCell(dilemma, cell, model.slug);
    }
    out.push({ dilemma, cells });
  }
  return out;
}

export async function loadDilemmaWithCells(
  dilemmaId: string
): Promise<DilemmaWithCells | null> {
  const dilemma = dilemmas.find((d) => d.id === dilemmaId);
  if (!dilemma) return null;
  const cells: Record<string, CellSummary> = {};
  for (const model of models) {
    const cell = await loadCell(dilemma.id, model.slug);
    cells[model.slug] = summarizeCell(dilemma, cell, model.slug);
  }
  return { dilemma, cells };
}

/**
 * Pairwise model agreement using histogram intersection.
 * For each dilemma, agreement = sum over options of min(P_A(opt), P_B(opt))
 * (which is in [0,1]). The matrix value is the mean over dilemmas with data.
 * Diagonal is always 1.0; the matrix is symmetric.
 */
export function computeAgreementMatrix(
  summaries: DilemmaWithCells[]
): number[][] {
  const N = models.length;
  const matrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let total = 0;
      let count = 0;
      for (const { cells } of summaries) {
        const cellI = cells[models[i].slug];
        const cellJ = cells[models[j].slug];
        const ni = cellI.validSamples.length;
        const nj = cellJ.validSamples.length;
        if (ni === 0 || nj === 0) continue;
        const countsI = new Map<string, number>();
        const countsJ = new Map<string, number>();
        for (const s of cellI.validSamples)
          countsI.set(s.decision, (countsI.get(s.decision) ?? 0) + 1);
        for (const s of cellJ.validSamples)
          countsJ.set(s.decision, (countsJ.get(s.decision) ?? 0) + 1);
        const decisions = new Set([...countsI.keys(), ...countsJ.keys()]);
        let overlap = 0;
        for (const d of decisions) {
          overlap += Math.min(
            (countsI.get(d) ?? 0) / ni,
            (countsJ.get(d) ?? 0) / nj
          );
        }
        total += overlap;
        count += 1;
      }
      matrix[i][j] = count > 0 ? total / count : 0;
    }
  }
  return matrix;
}

export async function loadModelAcrossDilemmas(
  modelSlug: string
): Promise<{ model: ModelConfig; rows: { dilemma: Dilemma; summary: CellSummary }[] } | null> {
  const model = models.find((m) => m.slug === modelSlug);
  if (!model) return null;
  const rows = [];
  for (const dilemma of dilemmas) {
    const cell = await loadCell(dilemma.id, model.slug);
    rows.push({ dilemma, summary: summarizeCell(dilemma, cell, model.slug) });
  }
  return { model, rows };
}

