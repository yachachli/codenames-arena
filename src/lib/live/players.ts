/**
 * Seats and the benchmark's retry policy for live games: an invalid or unreadable move is re-prompted
 * with the referee's message up to ten times, then the action is forfeited (decision D04 in the benchmark).
 */
import { callClaude, describeClaudeError, type CallResult } from "./claude";
import { callOpenAI, describeOpenAIError } from "./openai";
import { CLUE_SCHEMA, GUESS_SCHEMA, SYSTEM, cluePrompt, guessPrompt } from "../referee/prompts";
import { RuleError, type VersusEngine } from "../referee/versus";
import { pyRepr } from "../referee/validator";

export type Effort = "low" | "medium" | "high";
export type SeatKind = "human" | "claude" | "openai";
export interface Seat { preset: string; kind: SeatKind; model: string; label: string }
export interface Keys { anthropic: string; openai: string }

export const PRESETS: { id: string; label: string; kind: SeatKind; model: string }[] = [
  { id: "opus", label: "Opus 5.5", kind: "claude", model: "claude-opus-5-5" },
  { id: "sonnet", label: "Sonnet 5.5", kind: "claude", model: "claude-sonnet-5-5" },
  { id: "astra", label: "GPT-6 Astra", kind: "openai", model: "gpt-6-astra" },
  { id: "sol61", label: "GPT-6.1 Sol", kind: "openai", model: "gpt-6.1-sol" },
  { id: "claude-custom", label: "Other Claude model", kind: "claude", model: "" },
  { id: "openai-custom", label: "Other OpenAI model", kind: "openai", model: "" },
  { id: "you", label: "You", kind: "human", model: "" },
];

export const MAX_RETRIES = 10;

export interface CallLog { turn: number; team: string; role: "clue" | "guess"; seat: string; attempt: number; ok: boolean;
  answer: string; servedBy?: string; ms?: number; inputTokens?: number; outputTokens?: number; reason?: string }

export class FatalApiError extends Error {}

export type Caller = (seat: Seat, keys: Keys, effort: Effort, user: string, schema: Record<string, unknown>) => Promise<CallResult>;

const call: Caller = async (seat, keys, effort, user, schema) => {
  try {
    if (seat.kind === "claude") return await callClaude({ apiKey: keys.anthropic, model: seat.model, effort, system: SYSTEM, user, schema });
    return await callOpenAI({ apiKey: keys.openai, model: seat.model, effort, system: SYSTEM, user, schema });
  } catch (e) {
    throw new FatalApiError(seat.kind === "claude" ? describeClaudeError(e) : describeOpenAIError(e));
  }
};

function parseClue(r: CallResult): [string, number] | null {
  const j = r.json as { word?: unknown; number?: unknown } | null;
  if (j && typeof j.word === "string" && Number.isInteger(j.number)) return [j.word, j.number as number];
  const m = r.text.match(/\(?\s*['"]?([A-Za-z][A-Za-z-]*)['"]?\s*,\s*(\d+)\s*\)?/);
  return m ? [m[1], parseInt(m[2], 10)] : null;
}

/** One spymaster action for a model seat. Returns the rejected attempts. */
export async function modelClue(g: VersusEngine, seat: Seat, keys: Keys, effort: Effort, log: (c: CallLog) => void,
  cancelled: () => boolean, caller: Caller = call): Promise<{ word: string | null; number: number | null; reason: string }[]> {
  const rejected: { word: string | null; number: number | null; reason: string }[] = [];
  let feedback: string | null = null;
  const turn = g.turnNo + 1, team = g.current;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    if (cancelled()) return rejected;
    const r = await caller(seat, keys, effort, cluePrompt(g, feedback), CLUE_SCHEMA as unknown as Record<string, unknown>);
    const parsed = parseClue(r);
    const base = { turn, team, role: "clue" as const, seat: seat.label, attempt, answer: r.text, servedBy: r.servedBy, ms: r.ms,
      inputTokens: r.inputTokens, outputTokens: r.outputTokens };
    if (!parsed) {
      feedback = `Your previous answer could not be parsed: could not parse a clue from ${pyRepr(r.text.slice(0, 120))}`;
      rejected.push({ word: null, number: null, reason: "unparseable" });
      log({ ...base, ok: false, reason: "unparseable" });
      continue;
    }
    const v = g.validateClue(parsed[0], parsed[1]);
    log({ ...base, ok: v.ok, reason: v.reason ?? undefined });
    if (v.ok) { g.giveClue(parsed[0], parsed[1]); return rejected; }
    rejected.push({ word: parsed[0], number: parsed[1], reason: v.reason! });
    feedback = v.detail;
  }
  g.forfeit();
  return rejected;
}

/** One guess (or stop) for a model seat. */
export async function modelGuess(g: VersusEngine, seat: Seat, keys: Keys, effort: Effort, log: (c: CallLog) => void,
  cancelled: () => boolean, caller: Caller = call): Promise<void> {
  let feedback: string | null = null;
  const turn = g.turnNo, team = g.turn.team;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    if (cancelled()) return;
    const r = await caller(seat, keys, effort, guessPrompt(g, feedback), GUESS_SCHEMA as unknown as Record<string, unknown>);
    const base = { turn, team, role: "guess" as const, seat: seat.label, attempt, answer: r.text, servedBy: r.servedBy, ms: r.ms,
      inputTokens: r.inputTokens, outputTokens: r.outputTokens };
    const j = r.json as { action?: string; word?: string } | null;
    const action = j?.action ?? (/^"?stop"?$/i.test(r.text) ? "stop" : "guess");
    try {
      if (action === "stop") {
        if (!g.turn.picks.length) {
          feedback = "Your previous answer could not be parsed: you must make at least one guess before stopping";
          log({ ...base, ok: false, reason: "must_guess_once" });
          continue;
        }
        g.stop();
      } else {
        let word = j?.word && typeof j.word === "string" ? j.word : null;
        if (!word) {
          const up = r.text.toUpperCase();
          word = g.unrevealed().find(w => new RegExp(`\\b${w}\\b`).test(up)) ?? null;
        }
        if (!word) {
          feedback = `Your previous answer could not be parsed: could not parse a board word from ${pyRepr(r.text.slice(0, 120))}`;
          log({ ...base, ok: false, reason: "unparseable" });
          continue;
        }
        g.guess(word);
      }
      log({ ...base, ok: true });
      return;
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      feedback = e.detail;
      log({ ...base, ok: false, reason: e.reason });
    }
  }
  g.forfeit();
}
