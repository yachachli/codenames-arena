/** Plain-English labels for referee rejection codes. */
export const REASON_TEXT: Record<string, string> = {
  not_single_word: "not a single word",
  too_short: "too short",
  not_in_dictionary: "not in the dictionary",
  invented_compound: "an invented compound of two words",
  equals_board_word: "a word on the board",
  inflection_of_board_word: "a form of a word on the board",
  compound_with_board_word: "shares a word part with a word on the board",
  bad_number: "number out of range",
  unparseable: "could not be read",
  not_on_board: "not on the board",
  already_revealed: "already revealed",
  must_guess_once: "must guess before stopping",
};
