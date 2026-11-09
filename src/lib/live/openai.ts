/**
 * OpenAI calls for live games, through the Responses API with a strict JSON schema.
 * Runs in the visitor's browser with the visitor's own key, which goes only to api.openai.com.
 */
import OpenAI from "openai";
import type { CallResult } from "./claude";

export async function callOpenAI(opts: {
  apiKey: string; model: string; effort: "low" | "medium" | "high"; system: string; user: string; schema: Record<string, unknown>;
}): Promise<CallResult> {
  const client = new OpenAI({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });
  const t0 = performance.now();
  const res = await client.responses.create({
    model: opts.model,
    instructions: opts.system,
    input: opts.user,
    reasoning: { effort: opts.effort },
    text: { format: { type: "json_schema", name: "answer", schema: opts.schema, strict: true } },
  });
  const text = (res.output_text ?? "").trim();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* parsed by the caller's fallback */ }
  return { text, json, servedBy: res.model, inputTokens: res.usage?.input_tokens ?? 0, outputTokens: res.usage?.output_tokens ?? 0, ms: performance.now() - t0 };
}

export function describeOpenAIError(e: unknown): string {
  if (e instanceof OpenAI.AuthenticationError) return "OpenAI rejected the API key.";
  if (e instanceof OpenAI.NotFoundError) return "OpenAI doesn't know that model id, or your key can't use it.";
  if (e instanceof OpenAI.RateLimitError) return "OpenAI rate limit or quota hit.";
  if (e instanceof OpenAI.APIError) return `OpenAI API error ${e.status}: ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}
