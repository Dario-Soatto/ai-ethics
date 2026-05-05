export type ModelConfig = {
  id: string;
  slug: string;
  label: string;
  provider: string;
  accentClass: string;
};

export const models: ModelConfig[] = [
  {
    id: "anthropic/claude-opus-4.7",
    slug: "claude-opus-4-7",
    label: "Claude Opus 4.7",
    provider: "Anthropic",
    accentClass: "text-orange-500",
  },
  {
    id: "openai/gpt-5.5",
    slug: "gpt-5-5",
    label: "GPT 5.5",
    provider: "OpenAI",
    accentClass: "text-emerald-500",
  },
  {
    id: "google/gemini-3.1-pro-preview",
    slug: "gemini-3-1-pro",
    label: "Gemini 3.1 Pro",
    provider: "Google",
    accentClass: "text-sky-500",
  },
  {
    id: "xai/grok-4.3",
    slug: "grok-4-3",
    label: "Grok 4.3",
    provider: "xAI",
    accentClass: "text-zinc-300",
  },
  {
    id: "meta/llama-4-maverick",
    slug: "llama-4-maverick",
    label: "Llama 4 Maverick",
    provider: "Meta",
    accentClass: "text-violet-400",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    slug: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    accentClass: "text-teal-400",
  },
];
