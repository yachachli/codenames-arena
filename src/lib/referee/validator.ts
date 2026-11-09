/**
 * Clue validity, ported line for line from the Python referee (codenames/validator.py).
 * Parity with Python is tested on every clue logged in the benchmark (tests/referee.test.ts).
 *
 * Rules: one word of letters A-Z; in lenient dictionary mode an unknown word is allowed unless it
 * splits into two dictionary words of 4+ letters; not equal to, an inflection of, or a compound
 * with any unrevealed board word; a number between 1 and the team's remaining words.
 */
import { stemEnglish } from "./stemmer";

const WORD_RE = /^[a-z]+$/;
const AFFIXES = new Set(["s", "es", "ed", "er", "ers", "ing", "ly", "y", "ish", "en", "ness", "less", "ful", "man", "men",
  "un", "re", "de", "pre", "non", "anti", "co", "ex", "mis", "over", "under", "out", "sub", "super"]);
const IRREGULAR: Record<string, string> = {
  mouse: "mice", tooth: "teeth", foot: "feet", child: "children", goose: "geese", man: "men", woman: "women",
  knife: "knives", leaf: "leaves", wolf: "wolves", life: "lives", die: "dice", person: "people", ox: "oxen",
  louse: "lice", half: "halves", wife: "wives", shelf: "shelves", thief: "thieves", loaf: "loaves",
};
const IRREGULAR_PAIRS = new Set(Object.entries(IRREGULAR).flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
const STRIP = new Set("'\"`.,!?()[]".split(""));

export interface ClueVerdict {
  ok: boolean;
  word: string | null;
  reason: string | null;
  detail: string | null;
  flags: string[];
}

const reject = (word: string | null, reason: string, detail: string): ClueVerdict => ({ ok: false, word, reason, detail, flags: [] });

/** Python repr() of a short ASCII-ish string, so referee messages match the benchmark's. */
export const pyRepr = (s: string): string => (s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);

export class ClueValidator {
  constructor(
    private dictionary: Set<string>,
    private opts: { mode?: "lenient" | "strict" | "off"; minLen?: number; minRemainder?: number; minCompoundPart?: number } = {},
  ) {}

  get mode() { return this.opts.mode ?? "lenient"; }

  static normalize(raw: string): string {
    let s = raw.trim();
    let a = 0, b = s.length;
    while (a < b && STRIP.has(s[a])) a++;
    while (b > a && STRIP.has(s[b - 1])) b--;
    s = s.slice(a, b);
    return s.toLowerCase();
  }

  stem(word: string): string { return stemEnglish(word.toLowerCase()); }

  splitCompound(word: string): [string, string] | null {
    const k = this.opts.minCompoundPart ?? 4;
    for (let i = k; i < word.length - k + 1; i++) {
      const a = word.slice(0, i), b = word.slice(i);
      if (this.dictionary.has(a) && this.dictionary.has(b)) return [a, b];
    }
    return null;
  }

  private isRemainder(rest: string): boolean {
    if (AFFIXES.has(rest)) return true;
    return rest.length >= (this.opts.minRemainder ?? 3) && this.dictionary.has(rest);
  }

  conflict(clueRaw: string, boardWord: string): string | null {
    const clue = clueRaw.toLowerCase();
    const b = boardWord.toLowerCase().replace(/ /g, "");
    if (clue === b) return "equals_board_word";
    if (this.stem(clue) === this.stem(b) || IRREGULAR_PAIRS.has(`${clue}|${b}`)) return "inflection_of_board_word";
    for (const [longer, shorter] of [[clue, b], [b, clue]]) {
      if (longer.length <= shorter.length) continue;
      if (longer.startsWith(shorter) && this.isRemainder(longer.slice(shorter.length))) return "compound_with_board_word";
      if (longer.endsWith(shorter) && this.isRemainder(longer.slice(0, longer.length - shorter.length))) return "compound_with_board_word";
    }
    return null;
  }

  validate(rawWord: string, number: number, unrevealed: readonly string[], remainingTargets: number): ClueVerdict {
    const word = ClueValidator.normalize(rawWord);
    if (!word || !WORD_RE.test(word)) {
      return reject(word, "not_single_word",
        `Clue ${pyRepr(rawWord)} must be a single word made only of letters A-Z (no spaces, hyphens, digits or accents).`);
    }
    const minLen = this.opts.minLen ?? 2;
    if (word.length < minLen) return reject(word, "too_short", `Clue ${pyRepr(word)} is too short; use at least ${minLen} letters.`);
    const flags: string[] = [];
    if (this.mode !== "off" && !this.dictionary.has(word)) {
      if (this.mode === "strict") return reject(word, "not_in_dictionary", `Clue ${pyRepr(word)} is not in the English dictionary used by the referee.`);
      const parts = this.splitCompound(word);
      if (parts) {
        return reject(word, "invented_compound",
          `Clue ${pyRepr(word)} is not a dictionary word and looks like two words joined together (${parts[0]} + ${parts[1]}). A clue must be one real word.`);
      }
      flags.push("unknown_word");
    }
    for (const b of unrevealed) {
      const reason = this.conflict(word, b);
      if (reason) {
        return reject(word, reason,
          `Clue ${pyRepr(word)} is not allowed because it is a form of, or shares a word part with, the board word ${pyRepr(b.toUpperCase())}.`);
      }
    }
    if (!Number.isInteger(number)) return reject(word, "bad_number", "The number must be an integer.");
    if (number < 1 || number > remainingTargets) {
      return reject(word, "bad_number",
        `The number ${number} is out of range; it must be between 1 and ${remainingTargets} (your remaining words).`);
    }
    return { ok: true, word, reason: null, detail: null, flags };
  }
}

export { REASON_TEXT } from "./reasons";
