import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ClueValidator } from "../src/lib/referee/validator";
import { VersusEngine } from "../src/lib/referee/versus";
import { modelClue, modelGuess, type Caller, type CallLog, type Seat } from "../src/lib/live/players";
import type { Role } from "../src/lib/types";

const dict = new Set(readFileSync("public/live/dictionary.txt", "utf-8").split("\n"));
const boards: { seed: number; words: string[]; key: Role[] }[] = JSON.parse(readFileSync("public/live/boards.json", "utf-8"));
const seat: Seat = { preset: "fake", kind: "claude", model: "fake", label: "Fake" };
const keys = { anthropic: "x", openai: "x" };

/** A sloppy fake model: sometimes repeats a board word, sometimes answers in prose, otherwise plays plausibly. */
function fake(seed: number): Caller {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const clues = ["zebra", "quantum", "harbor", "velvet", "gadget", "orbit", "saga", "ember"];
  return async (_seat, _keys, _effort, user, schema) => {
    const res = (text: string) => ({ text, json: (() => { try { return JSON.parse(text); } catch { return null; } })(), servedBy: "fake", inputTokens: 1, outputTokens: 1, ms: 1 });
    if ("number" in (schema.properties as object)) {
      const r = rnd();
      const board = /Remaining words\. \w+ \(yours\): \[(.*?)\]/.exec(user)![1].split(", ").map(w => w.slice(1, -1));
      if (r < 0.15) return res(JSON.stringify({ word: board[0], number: 1 }));        // illegal: a board word
      if (r < 0.2) return res("I think the clue is good");                            // unparseable
      return res(JSON.stringify({ word: clues[Math.floor(rnd() * clues.length)], number: 1 + Math.floor(rnd() * Math.min(3, board.length)) }));
    }
    const words = /Unrevealed words: \[(.*?)\]/.exec(user)![1].split(", ").map(w => w.slice(1, -1));
    const mayStop = user.includes('"action": "stop"');
    const r = rnd();
    if (mayStop && r < 0.3) return res(JSON.stringify({ action: "stop", word: "" }));
    if (r < 0.35) return res(JSON.stringify({ action: "guess", word: "NOTAWORD" }));     // illegal guess
    return res(JSON.stringify({ action: "guess", word: words[Math.floor(rnd() * words.length)] }));
  };
}

test("full live games run to a legal finish with a sloppy fake model", async () => {
  const outcomes: Record<string, number> = {};
  for (let k = 0; k < 40; k++) {
    const b = boards[k];
    const g = new VersusEngine(b.words, b.key, new ClueValidator(dict));
    const caller = fake(k + 1);
    const calls: CallLog[] = [];
    let rejectedClues = 0;
    while (g.phase !== "over") {
      rejectedClues += (await modelClue(g, seat, keys, "low", c => calls.push(c), () => false, caller)).length;
      while (g.phase === "guess") await modelGuess(g, seat, keys, "low", c => calls.push(c), () => false, caller);
    }
    assert.ok(g.outcome && (g.winner || g.outcome === "turn_limit"));
    // every turn alternates and every revealed word matches the key
    g.turns.forEach((t, i) => { if (i) assert.notEqual(t.team, g.turns[i - 1].team); t.picks.forEach(p => assert.equal(p.r, g.roleOf(p.w))); });
    assert.ok(calls.some(c => !c.ok) || rejectedClues === 0);
    outcomes[g.outcome!] = (outcomes[g.outcome!] ?? 0) + 1;
  }
  assert.ok((outcomes.cleared ?? 0) + (outcomes.assassin ?? 0) > 0);
});
