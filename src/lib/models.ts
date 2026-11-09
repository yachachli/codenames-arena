export interface ModelInfo { key: string; name: string; maker: string; color: string }

/** Fixed colour slots from the validated categorical palette; colour follows the model everywhere. */
export const MODELS: Record<string, ModelInfo> = {
  opus: { key: "opus", name: "Opus 5.5", maker: "Anthropic", color: "var(--series-1)" },
  sonnet: { key: "sonnet", name: "Sonnet 5.5", maker: "Anthropic", color: "var(--series-2)" },
  astra: { key: "astra", name: "GPT-6 Astra", maker: "OpenAI", color: "var(--series-3)" },
  sol61: { key: "sol61", name: "GPT-6.1 Sol", maker: "OpenAI", color: "var(--series-4)" },
  gpt55: { key: "gpt55", name: "GPT-5.5", maker: "OpenAI", color: "var(--series-5)" },
  sol56: { key: "sol56", name: "GPT-5.6 Sol", maker: "OpenAI", color: "var(--series-6)" },
  glove: { key: "glove", name: "GloVe", maker: "Word vectors", color: "var(--series-7)" },
};

export const TOURNAMENT = ["opus", "sonnet", "astra", "sol61"];
export const BENCH = ["opus", "sonnet", "gpt55", "sol56", "glove"];
export const modelName = (k: string | null | undefined) => (k ? MODELS[k]?.name ?? k : "Nobody");
