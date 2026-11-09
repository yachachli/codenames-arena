/**
 * Two-team Codenames rules, ported from the Python referee (codenames/versus.py).
 * Red moves first with nine words. A civilian or opponent word ends the turn; an opponent word
 * counts for the opponent. First team with all words revealed wins, whoever revealed them.
 * The assassin loses for the guessing team. Up to number + 1 guesses per clue.
 */
import { type Role, type Team, otherTeam } from "../types";
import type { ClueValidator, ClueVerdict } from "./validator";

export interface LivePick { w: string; r: Role }
export interface LiveTurn {
  n: number; team: Team; ownLeft: number; oppLeft: number;
  clue: string | null; number: number | null; picks: LivePick[];
  endedBy: string | null; stopped: boolean;
}
export type Phase = "clue" | "guess" | "over";

export class RuleError extends Error {
  constructor(public reason: string, public detail: string) { super(detail); }
}

export class VersusEngine {
  revealed = new Map<string, Role>();
  turns: LiveTurn[] = [];
  phase: Phase = "clue";
  current: Team;
  winner: Team | null = null;
  outcome: "cleared" | "assassin" | "turn_limit" | null = null;

  constructor(public words: string[], public key: Role[], private validator: ClueValidator, public maxTurns = 50) {
    const red = key.filter(k => k === "red").length, blue = key.filter(k => k === "blue").length;
    this.current = red >= blue ? "red" : "blue";
  }

  roleOf(w: string): Role { return this.key[this.words.indexOf(w)]; }
  unrevealed(): string[] { return this.words.filter(w => !this.revealed.has(w)); }
  remaining(role: Role): string[] { return this.unrevealed().filter(w => this.roleOf(w) === role); }
  get turnNo() { return this.turns.length; }
  get turn(): LiveTurn { return this.turns[this.turns.length - 1]; }
  guessesRemaining(): number { const t = this.turn; return (t.number ?? 0) + 1 - t.picks.length; }

  validateClue(word: string, number: number): ClueVerdict {
    return this.validator.validate(word, number, this.unrevealed(), this.remaining(this.current).length);
  }

  private openTurn(): LiveTurn {
    const t: LiveTurn = { n: this.turnNo + 1, team: this.current, ownLeft: this.remaining(this.current).length,
      oppLeft: this.remaining(otherTeam(this.current)).length, clue: null, number: null, picks: [], endedBy: null, stopped: false };
    this.turns.push(t);
    return t;
  }

  giveClue(word: string, number: number): void {
    if (this.phase !== "clue") throw new RuleError("wrong_phase", `expected phase clue, game is in phase ${this.phase}`);
    const v = this.validateClue(word, number);
    if (!v.ok) throw new RuleError(v.reason!, v.detail!);
    const t = this.openTurn();
    t.clue = v.word!; t.number = number;
    this.phase = "guess";
  }

  forfeit(): void {
    if (this.phase === "clue") { this.openTurn(); this.phase = "guess"; this.endTurn("forfeit"); }
    else if (this.phase === "guess") this.endTurn("forfeit");
  }

  guess(raw: string): { role: Role; correct: boolean; turnOver: boolean; gameOver: boolean } {
    if (this.phase !== "guess") throw new RuleError("wrong_phase", `expected phase guess, game is in phase ${this.phase}`);
    const w = raw.trim().toUpperCase();
    if (!this.words.includes(w)) throw new RuleError("not_on_board", `'${raw}' is not one of the words on the board.`);
    if (this.revealed.has(w)) throw new RuleError("already_revealed", `'${w}' has already been revealed.`);
    const role = this.roleOf(w);
    const t = this.turn;
    this.revealed.set(w, role);
    t.picks.push({ w, r: role });
    const team = t.team, opp = otherTeam(team);
    if (role === "assassin") this.finish(opp, "assassin", "assassin");
    else if (role === team) {
      if (!this.remaining(team).length) this.finish(team, "cleared", "win");
      else if (t.picks.length >= (t.number ?? 0) + 1) this.endTurn("limit");
    } else if (role === opp && !this.remaining(opp).length) this.finish(opp, "cleared", "opponent_cleared");
    else this.endTurn("miss");
    const phase = this.phase as Phase; // mutated by the calls above
    return { role, correct: role === team, turnOver: phase !== "guess", gameOver: phase === "over" };
  }

  stop(): void {
    if (this.phase !== "guess") throw new RuleError("wrong_phase", "no turn is in progress");
    if (!this.turn.picks.length) throw new RuleError("must_guess_once", "You must make at least one guess before stopping.");
    this.turn.stopped = true;
    this.endTurn("stop");
  }

  private endTurn(how: string) {
    this.turn.endedBy = how;
    if (this.turnNo >= this.maxTurns) { this.phase = "over"; this.outcome = "turn_limit"; this.winner = null; }
    else { this.current = otherTeam(this.current); this.phase = "clue"; }
  }

  private finish(winner: Team, outcome: "cleared" | "assassin", how: string) {
    this.turn.endedBy = how;
    this.phase = "over"; this.winner = winner; this.outcome = outcome;
  }
}
