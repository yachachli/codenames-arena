/**
 * Snowball English stemmer, ported by hand from the Python `snowballstemmer`
 * package version 3.1.1 (english_stemmer.py, "Generated from english.sbl by
 * Snowball 3.1.1"). `stemEnglish(word)` returns exactly what
 * `snowballstemmer.stemmer("english").stemWord(word)` returns in Python.
 *
 * The structure mirrors the generated Python closely (same routine names,
 * same v_N save/restore variables) so it can be diffed against the source.
 * Python's try/raise labN control flow is expressed with labeled blocks.
 *
 * No dependencies. Input is not lowercased (Python does not lowercase either).
 */

interface Among {
  readonly s: string;
  readonly substringI: number;
  readonly result: number;
}

const A = (s: string, substringI: number, result: number): Among => ({ s, substringI, result });

const a_0: readonly Among[] = [
  A("arsen", -1, -1),
  A("commun", -1, -1),
  A("emerg", -1, -1),
  A("gener", -1, -1),
  A("inter", -1, -1),
  A("later", -1, -1),
  A("organ", -1, -1),
  A("past", -1, -1),
  A("univers", -1, -1),
];

const a_1: readonly Among[] = [A("'", -1, 1), A("'s'", 0, 1), A("'s", -1, 1)];

const a_2: readonly Among[] = [
  A("ied", -1, 2),
  A("s", -1, 3),
  A("ies", 1, 2),
  A("sses", 1, 1),
  A("ss", 1, -1),
  A("us", 1, -1),
];

const a_3: readonly Among[] = [A("succ", -1, 1), A("proc", -1, 1), A("exc", -1, 1)];

const a_4: readonly Among[] = [
  A("even", -1, 2),
  A("cann", -1, 2),
  A("inn", -1, 2),
  A("earr", -1, 2),
  A("herr", -1, 2),
  A("out", -1, 2),
  A("y", -1, 1),
];

const a_5: readonly Among[] = [
  A("", -1, -1),
  A("ed", 0, 2),
  A("eed", 1, 1),
  A("ing", 0, 3),
  A("edly", 0, 2),
  A("eedly", 4, 1),
  A("ingly", 0, 2),
];

const a_6: readonly Among[] = [
  A("", -1, 3),
  A("bb", 0, 2),
  A("dd", 0, 2),
  A("ff", 0, 2),
  A("gg", 0, 2),
  A("bl", 0, 1),
  A("mm", 0, 2),
  A("nn", 0, 2),
  A("pp", 0, 2),
  A("rr", 0, 2),
  A("at", 0, 1),
  A("tt", 0, 2),
  A("iz", 0, 1),
];

const a_7: readonly Among[] = [
  A("anci", -1, 3),
  A("enci", -1, 2),
  A("ogi", -1, 14),
  A("li", -1, 16),
  A("bli", 3, 12),
  A("abli", 4, 4),
  A("alli", 3, 8),
  A("fulli", 3, 9),
  A("lessli", 3, 15),
  A("ousli", 3, 10),
  A("entli", 3, 5),
  A("aliti", -1, 8),
  A("biliti", -1, 12),
  A("iviti", -1, 11),
  A("tional", -1, 1),
  A("ational", 14, 7),
  A("alism", -1, 8),
  A("ation", -1, 7),
  A("ization", 17, 6),
  A("izer", -1, 6),
  A("ator", -1, 7),
  A("iveness", -1, 11),
  A("fulness", -1, 9),
  A("ousness", -1, 10),
  A("ogist", -1, 13),
];

const a_8: readonly Among[] = [
  A("icate", -1, 4),
  A("ative", -1, 6),
  A("alize", -1, 3),
  A("iciti", -1, 4),
  A("ical", -1, 4),
  A("tional", -1, 1),
  A("ational", 5, 2),
  A("ful", -1, 5),
  A("ness", -1, 5),
];

const a_9: readonly Among[] = [
  A("ic", -1, 1),
  A("ance", -1, 1),
  A("ence", -1, 1),
  A("able", -1, 1),
  A("ible", -1, 1),
  A("ate", -1, 1),
  A("ive", -1, 1),
  A("ize", -1, 1),
  A("iti", -1, 1),
  A("al", -1, 1),
  A("ism", -1, 1),
  A("ion", -1, 2),
  A("er", -1, 1),
  A("ous", -1, 1),
  A("ant", -1, 1),
  A("ent", -1, 1),
  A("ment", 15, 1),
  A("ement", 16, 1),
];

const a_10: readonly Among[] = [A("e", -1, 1), A("l", -1, 2)];

const a_11: readonly Among[] = [
  A("andes", -1, -1),
  A("atlas", -1, -1),
  A("bias", -1, -1),
  A("cosmos", -1, -1),
  A("early", -1, 6),
  A("gently", -1, 4),
  A("howe", -1, -1),
  A("idly", -1, 3),
  A("news", -1, -1),
  A("only", -1, 7),
  A("singly", -1, 8),
  A("skies", -1, 2),
  A("skis", -1, 1),
  A("sky", -1, -1),
  A("ugly", -1, 5),
];
const as_11: readonly string[] = ["ski", "sky", "idl", "gentl", "ugli", "earli", "onli", "singl"];

// Groupings as ASCII lookup tables. Every grouping member is ASCII, so any
// char code >= 128 is "not in" every grouping, matching Python's `in` test.
function grouping(chars: string): Uint8Array {
  const t = new Uint8Array(128);
  for (let i = 0; i < chars.length; i++) t[chars.charCodeAt(i)] = 1;
  return t;
}
const g_aeo = grouping("aeo");
const g_v = grouping("aeiouy");
const g_v_WXY = grouping("Yaeiouwxy");
const g_valid_LI = grouping("cdeghkmnrt");

const inG = (g: Uint8Array, ch: number): boolean => ch < 128 && g[ch] === 1;

const CH_APOS = 39; // '
const CH_y = 121;
const CH_Y = 89;
const CH_l = 108;
const CH_s = 115;
const CH_t = 116;

class EnglishStemmer {
  current = "";
  cursor = 0;
  limit = 0;
  limit_backward = 0;
  bra = 0;
  ket = 0;
  B_Y_found = false;
  I_p1 = 0;
  I_p2 = 0;

  // ---- BaseStemmer ----

  set_current(value: string): void {
    this.current = value;
    this.cursor = 0;
    this.limit = value.length;
    this.limit_backward = 0;
    this.bra = this.cursor;
    this.ket = this.limit;
  }

  in_grouping(g: Uint8Array): boolean {
    if (this.cursor >= this.limit) return false;
    if (!inG(g, this.current.charCodeAt(this.cursor))) return false;
    this.cursor += 1;
    return true;
  }

  go_in_grouping(g: Uint8Array): boolean {
    while (this.cursor < this.limit) {
      if (!inG(g, this.current.charCodeAt(this.cursor))) return true;
      this.cursor += 1;
    }
    return false;
  }

  in_grouping_b(g: Uint8Array): boolean {
    if (this.cursor <= this.limit_backward) return false;
    if (!inG(g, this.current.charCodeAt(this.cursor - 1))) return false;
    this.cursor -= 1;
    return true;
  }

  go_out_grouping(g: Uint8Array): boolean {
    while (this.cursor < this.limit) {
      if (inG(g, this.current.charCodeAt(this.cursor))) return true;
      this.cursor += 1;
    }
    return false;
  }

  out_grouping_b(g: Uint8Array): boolean {
    if (this.cursor <= this.limit_backward) return false;
    if (!inG(g, this.current.charCodeAt(this.cursor - 1))) {
      this.cursor -= 1;
      return true;
    }
    return false;
  }

  go_out_grouping_b(g: Uint8Array): boolean {
    while (this.cursor > this.limit_backward) {
      if (inG(g, this.current.charCodeAt(this.cursor - 1))) return true;
      this.cursor -= 1;
    }
    return false;
  }

  /** current.endswith(s, limit_backward, cursor) */
  eq_s_b(s: string): boolean {
    const start = this.cursor - s.length;
    if (start < this.limit_backward) return false;
    if (this.current.slice(start, this.cursor) !== s) return false;
    this.cursor -= s.length;
    return true;
  }

  find_among(v: readonly Among[]): number {
    let i = 0;
    let j = v.length;
    const c = this.cursor;
    const l = this.limit;
    let common_i = 0;
    let common_j = 0;
    let first_key_inspected = false;
    for (;;) {
      const k = i + ((j - i) >> 1);
      let diff = 0;
      let common = common_i < common_j ? common_i : common_j;
      const w = v[k];
      for (let i2 = common; i2 < w.s.length; i2++) {
        if (c + common === l) {
          diff = -1;
          break;
        }
        diff = this.current.charCodeAt(c + common) - w.s.charCodeAt(i2);
        if (diff !== 0) break;
        common += 1;
      }
      if (diff < 0) {
        j = k;
        common_j = common;
      } else {
        i = k;
        common_i = common;
      }
      if (j - i <= 1) {
        if (i > 0) break;
        if (j === i) break;
        if (first_key_inspected) break;
        first_key_inspected = true;
      }
    }
    for (;;) {
      const w = v[i];
      if (common_i >= w.s.length) {
        this.cursor = c + w.s.length;
        return w.result;
      }
      i = w.substringI;
      if (i < 0) return 0;
    }
  }

  find_among_b(v: readonly Among[]): number {
    let i = 0;
    let j = v.length;
    const c = this.cursor;
    const lb = this.limit_backward;
    let common_i = 0;
    let common_j = 0;
    let first_key_inspected = false;
    for (;;) {
      const k = i + ((j - i) >> 1);
      let diff = 0;
      let common = common_i < common_j ? common_i : common_j;
      const w = v[k];
      for (let i2 = w.s.length - 1 - common; i2 >= 0; i2--) {
        if (c - common === lb) {
          diff = -1;
          break;
        }
        diff = this.current.charCodeAt(c - 1 - common) - w.s.charCodeAt(i2);
        if (diff !== 0) break;
        common += 1;
      }
      if (diff < 0) {
        j = k;
        common_j = common;
      } else {
        i = k;
        common_i = common;
      }
      if (j - i <= 1) {
        if (i > 0) break;
        if (j === i) break;
        if (first_key_inspected) break;
        first_key_inspected = true;
      }
    }
    for (;;) {
      const w = v[i];
      if (common_i >= w.s.length) {
        this.cursor = c - w.s.length;
        return w.result;
      }
      i = w.substringI;
      if (i < 0) return 0;
    }
  }

  replace_s(c_bra: number, c_ket: number, s: string): number {
    const adjustment = s.length - (c_ket - c_bra);
    this.current = this.current.slice(0, c_bra) + s + this.current.slice(c_ket);
    this.limit += adjustment;
    if (this.cursor >= c_ket) this.cursor += adjustment;
    else if (this.cursor > c_bra) this.cursor = c_bra;
    return adjustment;
  }

  slice_from(s: string): void {
    this.replace_s(this.bra, this.ket, s);
    this.ket = this.bra + s.length;
  }

  slice_del(): void {
    this.slice_from("");
  }

  /** current[cursor] == ch (forward literal test) */
  private chAt(ch: number): boolean {
    return this.cursor !== this.limit && this.current.charCodeAt(this.cursor) === ch;
  }

  /** current[cursor - 1] == ch (backward literal test) */
  private chBefore(ch: number): boolean {
    return this.cursor > this.limit_backward && this.current.charCodeAt(this.cursor - 1) === ch;
  }

  // ---- english_stemmer ----

  r_prelude(): boolean {
    this.B_Y_found = false;
    const v_1 = this.cursor;
    lab0: {
      this.bra = this.cursor;
      if (!this.chAt(CH_APOS)) break lab0;
      this.cursor += 1;
      this.ket = this.cursor;
      this.slice_del();
    }
    this.cursor = v_1;
    const v_2 = this.cursor;
    lab0: {
      this.bra = this.cursor;
      if (!this.chAt(CH_y)) break lab0;
      this.cursor += 1;
      this.ket = this.cursor;
      this.slice_from("Y");
      this.B_Y_found = true;
    }
    this.cursor = v_2;
    const v_3 = this.cursor;
    outer: for (;;) {
      const v_4 = this.cursor;
      lab1: {
        inner: for (;;) {
          const v_5 = this.cursor;
          lab2: {
            if (!this.in_grouping(g_v)) break lab2;
            this.bra = this.cursor;
            if (!this.chAt(CH_y)) break lab2;
            this.cursor += 1;
            this.ket = this.cursor;
            this.cursor = v_5;
            break inner;
          }
          this.cursor = v_5;
          if (this.cursor >= this.limit) break lab1;
          this.cursor += 1;
        }
        this.slice_from("Y");
        this.B_Y_found = true;
        continue outer;
      }
      this.cursor = v_4;
      break;
    }
    this.cursor = v_3;
    return true;
  }

  r_mark_regions(): boolean {
    this.I_p1 = this.limit;
    this.I_p2 = this.limit;
    const v_1 = this.cursor;
    lab0: {
      const v_2 = this.cursor;
      if (this.find_among(a_0) === 0) {
        this.cursor = v_2;
        if (!this.go_out_grouping(g_v)) break lab0;
        this.cursor += 1;
        if (!this.go_in_grouping(g_v)) break lab0;
        this.cursor += 1;
      }
      this.I_p1 = this.cursor;
      if (!this.go_out_grouping(g_v)) break lab0;
      this.cursor += 1;
      if (!this.go_in_grouping(g_v)) break lab0;
      this.cursor += 1;
      this.I_p2 = this.cursor;
    }
    this.cursor = v_1;
    return true;
  }

  r_shortv(): boolean {
    const v_1 = this.limit - this.cursor;
    if (this.out_grouping_b(g_v_WXY) && this.in_grouping_b(g_v) && this.out_grouping_b(g_v)) {
      return true;
    }
    this.cursor = this.limit - v_1;
    if (this.out_grouping_b(g_v) && this.in_grouping_b(g_v) && !(this.cursor > this.limit_backward)) {
      return true;
    }
    this.cursor = this.limit - v_1;
    if (!this.eq_s_b("past")) return false;
    return true;
  }

  r_R1(): boolean {
    return this.I_p1 <= this.cursor;
  }

  r_R2(): boolean {
    return this.I_p2 <= this.cursor;
  }

  r_Step_1a(): boolean {
    const v_1 = this.limit - this.cursor;
    this.ket = this.cursor;
    if (this.find_among_b(a_1) === 0) {
      this.cursor = this.limit - v_1;
    } else {
      this.bra = this.cursor;
      this.slice_del();
    }
    this.ket = this.cursor;
    const among_var = this.find_among_b(a_2);
    if (among_var === 0) return false;
    this.bra = this.cursor;
    if (among_var === 1) {
      this.slice_from("ss");
    } else if (among_var === 2) {
      const v_2 = this.limit - this.cursor;
      if (!(this.cursor - 2 < this.limit_backward)) {
        this.cursor -= 2;
        this.slice_from("i");
      } else {
        this.cursor = this.limit - v_2;
        this.slice_from("ie");
      }
    } else if (among_var === 3) {
      if (this.cursor <= this.limit_backward) return false;
      this.cursor -= 1;
      if (!this.go_out_grouping_b(g_v)) return false;
      this.cursor -= 1;
      this.slice_del();
    }
    return true;
  }

  r_Step_1b(): boolean {
    this.ket = this.cursor;
    let among_var = this.find_among_b(a_5);
    this.bra = this.cursor;
    const v_1 = this.limit - this.cursor;
    lab0: {
      if (among_var === 1) {
        const v_2 = this.limit - this.cursor;
        lab1: {
          if (!this.r_R1()) break lab1;
          const v_3 = this.limit - this.cursor;
          if (this.find_among_b(a_3) !== 0 && !(this.cursor > this.limit_backward)) {
            // matched succ/proc/exc as the whole stem: leave as is
          } else {
            this.cursor = this.limit - v_3;
            this.slice_from("ee");
          }
        }
        this.cursor = this.limit - v_2;
      } else if (among_var === 2) {
        break lab0;
      } else if (among_var === 3) {
        among_var = this.find_among_b(a_4);
        if (among_var === 0) break lab0;
        if (among_var === 1) {
          const v_4 = this.limit - this.cursor;
          if (!this.out_grouping_b(g_v)) break lab0;
          if (this.cursor > this.limit_backward) break lab0;
          this.cursor = this.limit - v_4;
          this.bra = this.cursor;
          this.slice_from("ie");
        } else {
          if (this.cursor > this.limit_backward) break lab0;
        }
      }
      return true;
    }
    this.cursor = this.limit - v_1;
    const v_5 = this.limit - this.cursor;
    if (!this.go_out_grouping_b(g_v)) return false;
    this.cursor -= 1;
    this.cursor = this.limit - v_5;
    this.slice_del();
    this.ket = this.cursor;
    this.bra = this.cursor;
    const v_6 = this.limit - this.cursor;
    among_var = this.find_among_b(a_6);
    if (among_var === 1) {
      this.slice_from("e");
      return false;
    } else if (among_var === 2) {
      const v_7 = this.limit - this.cursor;
      if (this.in_grouping_b(g_aeo) && !(this.cursor > this.limit_backward)) return false;
      this.cursor = this.limit - v_7;
    } else {
      if (this.cursor !== this.I_p1) return false;
      const v_8 = this.limit - this.cursor;
      if (!this.r_shortv()) return false;
      this.cursor = this.limit - v_8;
      this.slice_from("e");
      return false;
    }
    this.cursor = this.limit - v_6;
    this.ket = this.cursor;
    if (this.cursor <= this.limit_backward) return false;
    this.cursor -= 1;
    this.bra = this.cursor;
    this.slice_del();
    return true;
  }

  r_Step_1c(): boolean {
    this.ket = this.cursor;
    if (this.chBefore(CH_y)) {
      this.cursor -= 1;
    } else if (this.chBefore(CH_Y)) {
      this.cursor -= 1;
    } else {
      return false;
    }
    this.bra = this.cursor;
    if (!this.out_grouping_b(g_v)) return false;
    if (this.cursor <= this.limit_backward) return false;
    this.slice_from("i");
    return true;
  }

  r_Step_2(): boolean {
    this.ket = this.cursor;
    const among_var = this.find_among_b(a_7);
    if (among_var === 0) return false;
    this.bra = this.cursor;
    if (!this.r_R1()) return false;
    switch (among_var) {
      case 1: this.slice_from("tion"); break;
      case 2: this.slice_from("ence"); break;
      case 3: this.slice_from("ance"); break;
      case 4: this.slice_from("able"); break;
      case 5: this.slice_from("ent"); break;
      case 6: this.slice_from("ize"); break;
      case 7: this.slice_from("ate"); break;
      case 8: this.slice_from("al"); break;
      case 9: this.slice_from("ful"); break;
      case 10: this.slice_from("ous"); break;
      case 11: this.slice_from("ive"); break;
      case 12: this.slice_from("ble"); break;
      case 13: this.slice_from("og"); break;
      case 14:
        if (!this.chBefore(CH_l)) return false;
        this.cursor -= 1;
        this.slice_from("og");
        break;
      case 15: this.slice_from("less"); break;
      default:
        if (!this.in_grouping_b(g_valid_LI)) return false;
        this.slice_del();
    }
    return true;
  }

  r_Step_3(): boolean {
    this.ket = this.cursor;
    const among_var = this.find_among_b(a_8);
    if (among_var === 0) return false;
    this.bra = this.cursor;
    if (!this.r_R1()) return false;
    switch (among_var) {
      case 1: this.slice_from("tion"); break;
      case 2: this.slice_from("ate"); break;
      case 3: this.slice_from("al"); break;
      case 4: this.slice_from("ic"); break;
      case 5: this.slice_del(); break;
      default:
        if (!this.r_R2()) return false;
        this.slice_del();
    }
    return true;
  }

  r_Step_4(): boolean {
    this.ket = this.cursor;
    const among_var = this.find_among_b(a_9);
    if (among_var === 0) return false;
    this.bra = this.cursor;
    if (!this.r_R2()) return false;
    if (among_var === 1) {
      this.slice_del();
    } else {
      if (this.chBefore(CH_s)) {
        this.cursor -= 1;
      } else if (this.chBefore(CH_t)) {
        this.cursor -= 1;
      } else {
        return false;
      }
      this.slice_del();
    }
    return true;
  }

  r_Step_5(): boolean {
    this.ket = this.cursor;
    const among_var = this.find_among_b(a_10);
    if (among_var === 0) return false;
    this.bra = this.cursor;
    if (among_var === 1) {
      if (!this.r_R2()) {
        if (!this.r_R1()) return false;
        const v_1 = this.limit - this.cursor;
        if (this.r_shortv()) return false;
        this.cursor = this.limit - v_1;
      }
      this.slice_del();
    } else {
      if (!this.r_R2()) return false;
      if (!this.chBefore(CH_l)) return false;
      this.cursor -= 1;
      this.slice_del();
    }
    return true;
  }

  r_exception1(): boolean {
    this.bra = this.cursor;
    const among_var = this.find_among(a_11);
    if (among_var === 0) return false;
    this.ket = this.cursor;
    if (this.cursor < this.limit) return false;
    if (among_var > 0) this.slice_from(as_11[among_var - 1]);
    return true;
  }

  r_postlude(): boolean {
    if (!this.B_Y_found) return false;
    outer: for (;;) {
      const v_1 = this.cursor;
      lab0: {
        inner: for (;;) {
          const v_2 = this.cursor;
          this.bra = this.cursor;
          if (this.chAt(CH_Y)) {
            this.cursor += 1;
            this.ket = this.cursor;
            this.cursor = v_2;
            break inner;
          }
          this.cursor = v_2;
          if (this.cursor >= this.limit) break lab0;
          this.cursor += 1;
        }
        this.slice_from("y");
        continue outer;
      }
      this.cursor = v_1;
      break;
    }
    return true;
  }

  stem(): void {
    const v_1 = this.cursor;
    if (this.r_exception1()) return;
    this.cursor = v_1;
    // Words shorter than 3 characters are left untouched.
    if (this.cursor + 3 > this.limit) return;
    this.cursor = v_1;
    this.r_prelude();
    this.r_mark_regions();
    this.limit_backward = this.cursor;
    this.cursor = this.limit;
    const v_2 = this.limit - this.cursor;
    this.r_Step_1a();
    this.cursor = this.limit - v_2;
    const v_3 = this.limit - this.cursor;
    this.r_Step_1b();
    this.cursor = this.limit - v_3;
    const v_4 = this.limit - this.cursor;
    this.r_Step_1c();
    this.cursor = this.limit - v_4;
    const v_5 = this.limit - this.cursor;
    this.r_Step_2();
    this.cursor = this.limit - v_5;
    const v_6 = this.limit - this.cursor;
    this.r_Step_3();
    this.cursor = this.limit - v_6;
    const v_7 = this.limit - this.cursor;
    this.r_Step_4();
    this.cursor = this.limit - v_7;
    const v_8 = this.limit - this.cursor;
    this.r_Step_5();
    this.cursor = this.limit - v_8;
    this.cursor = this.limit_backward;
    const v_9 = this.cursor;
    this.r_postlude();
    this.cursor = v_9;
  }

  stemWord(word: string): string {
    this.set_current(word);
    this.stem();
    return this.current;
  }
}

const stemmer = new EnglishStemmer();

// Python indexes strings by code point; JS by UTF-16 unit. They only diverge
// for surrogates (astral characters, or lone surrogates). The algorithm only
// ever compares against ASCII, and never deletes or inserts a non-ASCII
// character, so we swap each code point that would be 2 units (plus any
// existing placeholder char) for a single BMP placeholder, stem, and swap the
// originals back in order.
const SURROGATE = /[\uD800-\uDFFF]/;
const PLACEHOLDER = "";

function stemWithSurrogates(word: string): string {
  const originals: string[] = [];
  let mapped = "";
  for (const cp of Array.from(word)) {
    if (cp.length > 1 || SURROGATE.test(cp) || cp === PLACEHOLDER) {
      originals.push(cp);
      mapped += PLACEHOLDER;
    } else {
      mapped += cp;
    }
  }
  const stemmed = stemmer.stemWord(mapped);
  let k = 0;
  let out = "";
  for (let i = 0; i < stemmed.length; i++) {
    const ch = stemmed[i];
    out += ch === PLACEHOLDER ? originals[k++] : ch;
  }
  return out;
}

/**
 * Equivalent to Python `snowballstemmer.stemmer("english").stemWord(word)`
 * (snowballstemmer 3.1.1).
 */
export function stemEnglish(word: string): string {
  if (SURROGATE.test(word)) return stemWithSurrogates(word);
  return stemmer.stemWord(word);
}
