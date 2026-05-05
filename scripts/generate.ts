import { generateText } from "ai";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

import { dilemmas, getDilemma } from "../lib/dilemmas";
import { models } from "../lib/models";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildResponseSchema,
  type CellResults,
  type SampleResult,
} from "../lib/schema";

const TEMPERATURE = 1.0;
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.resolve(SCRIPT_DIR, "..", "data", "results");

function buildByok(): Record<string, { apiKey: string }[]> | undefined {
  const byok: Record<string, { apiKey: string }[]> = {};
  if (process.env.XAI_API_KEY) {
    byok.xai = [{ apiKey: process.env.XAI_API_KEY }];
  }
  return Object.keys(byok).length ? byok : undefined;
}

type Args = {
  dilemmaIds: string[] | null;
  modelSlugs: string[] | null;
  samples: number;
  force: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = {
    dilemmaIds: null,
    modelSlugs: null,
    samples: 10,
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dilemma") args.dilemmaIds = (argv[++i] ?? "").split(",");
    else if (a === "--model") args.modelSlugs = (argv[++i] ?? "").split(",");
    else if (a === "--samples") args.samples = Number(argv[++i] ?? "10");
    else if (a === "--force") args.force = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: pnpm generate [--dilemma id1,id2] [--model slug1,slug2] [--samples N] [--force]"
      );
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return args;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

const MAX_ATTEMPTS = 5;

/** Strip markdown fences and surrounding prose from candidate JSON output. */
function repairText({ text }: { text: string }): string {
  let t = text.trim();
  const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) t = fenceMatch[1].trim();
  const firstBrace = t.indexOf("{");
  const lastBrace = t.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    t = t.slice(firstBrace, lastBrace + 1);
  }
  return t;
}

async function runSample(
  dilemmaId: string,
  modelId: string,
  sampleIdx: number
): Promise<SampleResult> {
  const dilemma = getDilemma(dilemmaId)!;
  const schema = buildResponseSchema(dilemma);
  const userPrompt = buildUserPrompt(dilemma);
  const start = Date.now();
  let lastError: string | undefined;

  const byok = buildByok();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await generateText({
        model: modelId,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: TEMPERATURE,
        ...(byok ? { providerOptions: { gateway: { byok } } } : {}),
      });
      const cleaned = repairText({ text: result.text });
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        lastError = `JSON parse failed: ${(parseErr as Error).message}; raw: ${result.text.slice(0, 200)}`;
        continue;
      }
      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        lastError = `Schema validation failed: ${validated.error.message}; got: ${cleaned.slice(0, 200)}`;
        continue;
      }
      return {
        sample: sampleIdx,
        decision: validated.data.decision,
        confidence: validated.data.confidence,
        reasoning: validated.data.reasoning,
        durationMs: Date.now() - start,
        finishReason: result.finishReason,
        inputTokens: result.usage?.inputTokens,
        outputTokens: result.usage?.outputTokens,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      break;
    }
  }

  return {
    sample: sampleIdx,
    decision: "__ERROR__",
    confidence: 0,
    reasoning: "",
    durationMs: Date.now() - start,
    attempts: MAX_ATTEMPTS,
    error: lastError,
  };
}

async function runCell(
  dilemmaId: string,
  modelSlug: string,
  modelId: string,
  modelLabel: string,
  samples: number,
  force: boolean
): Promise<void> {
  const dir = path.join(RESULTS_DIR, dilemmaId);
  await fs.mkdir(dir, { recursive: true });
  const outPath = path.join(dir, `${modelSlug}.json`);

  if (!force && (await fileExists(outPath))) {
    console.log(`  [skip] ${dilemmaId} × ${modelSlug} (already exists)`);
    return;
  }

  const dilemma = getDilemma(dilemmaId)!;
  const userPrompt = buildUserPrompt(dilemma);

  console.log(`  [run]  ${dilemmaId} × ${modelSlug}  (${samples} samples)`);
  const t0 = Date.now();
  const samplesOut = await Promise.all(
    Array.from({ length: samples }, (_, i) => runSample(dilemmaId, modelId, i))
  );
  const errorCount = samplesOut.filter((s) => s.error).length;
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `         done in ${dt}s${errorCount ? ` (${errorCount} errors)` : ""}`
  );

  const cell: CellResults = {
    dilemmaId,
    modelId,
    modelSlug,
    modelLabel,
    generatedAt: new Date().toISOString(),
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: TEMPERATURE,
    samples: samplesOut,
  };
  await fs.writeFile(outPath, JSON.stringify(cell, null, 2) + "\n");
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error(
      "ERROR: AI_GATEWAY_API_KEY is not set. Copy .env.local.example to .env.local and add your key."
    );
    process.exit(1);
  }

  const args = parseArgs();
  const targetDilemmas = args.dilemmaIds
    ? dilemmas.filter((d) => args.dilemmaIds!.includes(d.id))
    : dilemmas;
  const targetModels = args.modelSlugs
    ? models.filter((m) => args.modelSlugs!.includes(m.slug))
    : models;

  if (targetDilemmas.length === 0) {
    console.error("No matching dilemmas.");
    process.exit(1);
  }
  if (targetModels.length === 0) {
    console.error("No matching models.");
    process.exit(1);
  }

  console.log(
    `Running ${targetDilemmas.length} dilemma(s) × ${targetModels.length} model(s) × ${args.samples} sample(s) = ${
      targetDilemmas.length * targetModels.length * args.samples
    } total calls`
  );
  console.log("");

  for (const dilemma of targetDilemmas) {
    console.log(`[${dilemma.id}] ${dilemma.title}`);
    for (const model of targetModels) {
      await runCell(
        dilemma.id,
        model.slug,
        model.id,
        model.label,
        args.samples,
        args.force
      );
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
