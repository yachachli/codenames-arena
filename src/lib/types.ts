export type Role = "red" | "blue" | "civilian" | "assassin";
export type Team = "red" | "blue";

export interface Pick { w: string; r: Role }
export interface Rejected { word: string | null; number: number | null; reason: string | null }

export interface Turn {
  n: number;
  team: Team;
  clue: string | null;
  number: number | null;
  picks: Pick[];
  stopped: boolean;
  ownLeft?: number;
  oppLeft?: number;
  rejected?: Rejected[];
  badGuesses?: { word: string | null; reason: string | null }[];
  forfeit?: boolean;
}

export interface VersusGame {
  slug: string; mode: "versus"; seed: number; words: string[]; key: Role[];
  red: string; blue: string; winner: Team | null; ending: string; redLeft: number; blueLeft: number; turns: Turn[];
}

export interface BenchGame {
  slug: string; mode: "single"; seed: number; words: string[]; key: Role[];
  cluer: string; guesser: string; outcome: string; score: number; turns: Turn[];
}

export interface VersusIndexRow {
  slug: string; seed: number; red: string; blue: string; winner: Team | null; ending: string; turns: number;
  redLeft: number; blueLeft: number; longShots: number; comeback: boolean; biggest: number;
}

export interface BenchIndexRow {
  slug: string; seed: number; cluer: string; guesser: string; outcome: string; score: number; turns: number;
}

export const otherTeam = (t: Team): Team => (t === "red" ? "blue" : "red");
