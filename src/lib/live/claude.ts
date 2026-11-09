/**
 * Claude calls for live games. Runs in the visitor's browser with the visitor's own API key,
 * which goes only to api.anthropic.com. Structured output enforces the benchmark's JSON shapes.
 * Server-side refusal fallback is on: if a model declines, the API reroutes, and `servedBy` records it.
 */
import Anthropic from "@anthropic-ai/sdk";

export interface CallResult { text: string; json: unknown; servedBy: string; inputTokens: number; outputTokens: number; ms: number }

export async function callClaude(opts: {
  apiKey: string; model: string; effort: "low" | "medium" | "high"; system: string; user: string; schema: Record<string, unknown>;
}): Promise<CallResult> {
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });
  const t0 = performance.now();
  const res = await client.beta.messages.create({
    model: opts.model,
    max_tokens: 16000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    output_config: { effort: opts.effort, format: { type: "json_schema", schema: opts.schema } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (res.stop_reason === "refusal") throw new Error(`${opts.model} declined to answer (refusal).`);
  const text = res.content.map(b => (b.type === "text" ? b.text : "")).join("").trim();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* parsed by the caller's fallback */ }
  return { text, json, servedBy: res.model, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, ms: performance.now() - t0 };
}

export function describeClaudeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return "Anthropic rejected the API key.";
  if (e instanceof Anthropic.NotFoundError) return "Anthropic doesn't know that model id.";
  if (e instanceof Anthropic.RateLimitError) return "Anthropic rate limit hit. Wait a moment and try again.";
  if (e instanceof Anthropic.BadRequestError) return `Anthropic rejected the request: ${e.message}`;
  if (e instanceof Anthropic.APIError) return `Anthropic API error ${e.status}: ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}
