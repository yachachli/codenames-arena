import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ClueValidator } from "../src/lib/referee/validator";
import { VersusEngine } from "../src/lib/referee/versus";
import { cluePrompt, guessPrompt, SYSTEM } from "../src/lib/referee/prompts";
import type { Role } from "../src/lib/types";

const dict = new Set(readFileSync("public/live/dictionary.txt", "utf-8").split("\n"));
const v = new ClueValidator(dict);
const fixture = (n: string) => JSON.parse(readFileSync(`tests/fixtures/${n}`, "utf-8"));

test("stemmer matches Python's snowballstemmer on every clue and board word", () => {
  const cases: Record<string, string> = fixture("stemmer_cases.json");
  const bad = Object.entries(cases).filter(([w, s]) => v.stem(w) !== s);
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} of ${Object.keys(cases).length} stems differ`);
});

test("validator matches the Python referee on every logged clue", () => {
  const cases: { word: string; number: number; unrevealed: string[]; remaining: number; ok: boolean; reason: string | null }[] =
    fixture("validator_cases.json");
  const bad = cases.filter(c => {
    const r = v.validate(c.word, c.number, c.unrevealed, c.remaining);
    return r.ok !== c.ok || r.reason !== c.reason;
  });
  assert.equal(bad.length, 0, `${bad.length} of ${cases.length} differ, e.g. ${JSON.stringify(bad.slice(0, 3).map(c => [c.word, c.number, c.reason]))}`);
});

test("prompts match the exact text the benchmark sent to the models", () => {
  const games: { file: string; board: { words: string[]; key: Role[] }; steps: any[] }[] = fixture("prompt_cases.json");
  let checked = 0;
  for (const g of games) {
    const e = new VersusEngine(g.board.words, g.board.key, v);
    for (const s of g.steps) {
      if (s.kind === "prompt") {
        const mine = s.role === "clue" ? cluePrompt(e, null) : guessPrompt(e, null);
        assert.equal(mine, s.prompt, `${g.file}: ${s.role} prompt differs`);
        assert.equal(SYSTEM, s.system);
        checked++;
      } else if (s.kind === "clue") e.giveClue(s.word, s.number);
      else if (s.kind === "guess") e.guess(s.word);
      else if (s.kind === "stop") e.stop();
      else if (s.kind === "forfeit") e.forfeit();
    }
  }
  assert.ok(checked > 50);
});

test("engine rules: alternation, opponent word counts for them, assassin, gift win", () => {
  const boards: { seed: number; words: string[]; key: Role[] }[] = JSON.parse(readFileSync("public/live/boards.json", "utf-8"));
  const b = boards[0];
  const of = (r: Role) => b.words.filter((_, i) => b.key[i] === r);
  const e = new VersusEngine(b.words, b.key, v);
  assert.equal(e.current, "red");
  e.giveClue("zebra", 2);
  const r1 = e.guess(of("blue")[0]);
  assert.ok(r1.turnOver && !r1.correct);
  assert.equal(e.current, "blue");
  assert.equal(e.remaining("blue").length, 7);
  e.giveClue("zebra", 1);
  e.guess(of("assassin")[0]);
  assert.equal(e.phase, "over");
  assert.equal(e.winner, "red");

  const g = new VersusEngine(b.words, b.key, v);
  of("blue").slice(0, 7).forEach(w => g.revealed.set(w, "blue"));
  g.giveClue("zebra", 1);
  g.guess(of("blue")[7]);
  assert.equal(g.winner, "blue");
  assert.equal(g.turn.endedBy, "opponent_cleared");
});
