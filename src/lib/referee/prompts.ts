/** The benchmark's "versus" prompt template, reproduced exactly from codenames/players/llm.py. */
import type { Role, Team } from "../types";
import type { VersusEngine } from "./versus";

const LABEL: Record<Role, string> = { red: "Red", blue: "Blue", civilian: "Civilian", assassin: "Assassin" };
export const SYSTEM = "You are playing the board game Codenames. Answer only with the requested JSON object.";

const pylist = (ws: string[]) => "[" + ws.map(w => `'${w}'`).join(", ") + "]";
const plural = (n: number, s: string) => (n !== 1 ? s : "");

function rules(): string {
  return `Two teams, ${LABEL.red} and ${LABEL.blue}, take turns. On a turn the spymaster gives a ` +
    "one-word clue and a number, and the team's guesser reveals words one at a time, up to the number plus one, " +
    "and may stop after any guess. Revealing one of your own words lets the guesser continue. Revealing a " +
    "civilian or one of the other team's words ends the turn, and the other team's word counts for them. " +
    "The first team to have all of its words revealed wins, no matter who revealed them. " +
    "Revealing the assassin loses the game immediately. ";
}

function score(team: Team, opp: Team, own: number, other: number): string {
  return `Score: ${LABEL[team]} (your team) has ${own} word${plural(own, "s")} left to find; ` +
    `${LABEL[opp]} has ${other} word${plural(other, "s")} left to find. `;
}

function history(g: VersusEngine, excludeCurrent: boolean): string {
  const done = excludeCurrent ? g.turns.slice(0, -1) : g.turns;
  if (!done.length) return "No clues have been given yet. ";
  return "Previous turns: " + done.map(h => {
    const clue = h.clue ? `${h.clue.toUpperCase()} ${h.number}` : "(no valid clue)";
    const gs = h.picks.map(p => `${p.w} (${LABEL[p.r]})`).join(", ") || "no guesses";
    return `Turn ${h.n}, ${LABEL[h.team]}: clue ${clue}; revealed: ${gs}.`;
  }).join(" ") + " ";
}

export function cluePrompt(g: VersusEngine, feedback: string | null): string {
  const team = g.current, opp: Team = team === "red" ? "blue" : "red";
  const own = g.remaining(team), other = g.remaining(opp);
  let p = `You are the spymaster for the ${LABEL[team]} team, playing against the ${LABEL[opp]} team. ` +
    rules() + "Your guesser does not know which words are yours. " + score(team, opp, own.length, other.length) +
    `Remaining words. ${LABEL[team]} (yours): ${pylist(own)}. ` +
    `${LABEL[opp]} (theirs): ${pylist(other)}. Civilian: ${pylist(g.remaining("civilian"))}. ` +
    `Assassin: ${pylist(g.remaining("assassin"))}. ` + history(g, false) +
    `Give a single-word clue and a number from 1 to ${own.length} saying how many of your words it points to. ` +
    "The clue cannot be a form of, or share a word part with, any word on the board. " +
    'Answer as JSON: {"word": "...", "number": N}.';
  if (feedback) p += `\n\nYour previous answer was rejected: ${feedback} Provide a different clue.`;
  return p;
}

export function guessPrompt(g: VersusEngine, feedback: string | null): string {
  const t = g.turn, team = t.team, opp: Team = team === "red" ? "blue" : "red";
  const picked = t.picks.map(p => `${p.w} (${LABEL[p.r]})`).join(", ") || "none yet";
  const left = g.guessesRemaining(), mayStop = t.picks.length >= 1;
  let p = `You are the guesser for the ${LABEL[team]} team, playing against the ${LABEL[opp]} team. ` +
    rules() + score(team, opp, g.remaining(team).length, g.remaining(opp).length) +
    `Unrevealed words: ${pylist(g.unrevealed())}. ` + history(g, true) +
    `Your spymaster's clue this turn: (${t.clue!.toUpperCase()}, ${t.number}). Picks so far this turn: ${picked}. ` +
    `You may make up to ${left} more guess${plural(left, "es")} this turn. ` +
    (mayStop
      ? 'Answer as JSON: {"action": "guess", "word": "<one unrevealed word>"} or, to end your turn, {"action": "stop", "word": ""}.'
      : 'You must make at least one guess. Answer as JSON: {"action": "guess", "word": "<one unrevealed word>"}.');
  if (feedback) p += `\n\nYour previous answer was rejected: ${feedback}`;
  return p;
}

export const CLUE_SCHEMA = {
  type: "object",
  properties: { word: { type: "string" }, number: { type: "integer" } },
  required: ["word", "number"],
  additionalProperties: false,
} as const;

export const GUESS_SCHEMA = {
  type: "object",
  properties: { action: { type: "string", enum: ["guess", "stop"] }, word: { type: "string" } },
  required: ["action", "word"],
  additionalProperties: false,
} as const;
