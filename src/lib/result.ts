import { modelName } from "./models";
import type { BenchGame, VersusGame } from "./types";

/** One-line outcome of a game, used on replays and in page metadata. */
export function resultText(g: VersusGame | BenchGame): string {
  if (g.mode === "single") {
    const who = `${modelName(g.cluer)} clued, ${modelName(g.guesser)} guessed`;
    if (g.outcome === "win") return `${who}: all nine words found in ${g.score} turns.`;
    if (g.outcome === "assassin") return `${who}: the guesser revealed the assassin. Scored as a loss (25).`;
    return `${who}: the opponent's words ran out first. Scored as a loss (25).`;
  }
  const winner = g.winner === "red" ? g.red : g.blue, loser = g.winner === "red" ? g.blue : g.red;
  if (!g.winner) return "No winner: the turn limit was reached.";
  if (g.ending === "assassin") return `${modelName(winner)} wins: ${modelName(loser)} revealed the assassin.`;
  if (g.ending === "gift") return `${modelName(winner)} wins: ${modelName(loser)} revealed ${modelName(winner)}'s last word.`;
  return `${modelName(winner)} wins: it found its last word.`;
}
