"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Board from "./Board";
import ModelLabel from "./ModelLabel";
import type { Pick, Role, Team } from "@/lib/types";

export interface QuizItem {
  slug: string; seed: number; words: string[]; key: Role[]; revealed: Record<string, Role>;
  team: Team; spymaster: string; guesser: string; clue: string; number: number; modelPicks: Pick[];
}

/** Picks count in order until the first word that isn't the team's, as in the real game. */
const scoreRun = (picks: string[], roleOf: (w: string) => Role, team: Team) => {
  let n = 0;
  for (const w of picks) { if (roleOf(w) !== team) break; n++; }
  return n;
};

export default function Quiz({ items }: { items: QuizItem[] }) {
  const [order] = useState<number[]>(() => {
    const o = items.map((_, k) => k);
    for (let k = o.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [o[k], o[j]] = [o[j], o[k]]; }
    return o;
  });
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [tally, setTally] = useState({ you: 0, model: 0, rounds: 0 });

  const item = order.length ? items[order[i % order.length]] : null;
  const roleOf = useMemo(() => (item ? (w: string) => item.key[item.words.indexOf(w)] : () => "civilian" as Role), [item]);
  if (!item) return null;

  const you = scoreRun(sel, roleOf, item.team);
  const model = item.modelPicks.filter(p => p.r === item.team).length; // the game already stopped at the first miss
  const revealedNow: Record<string, Role> = { ...item.revealed, ...(done ? Object.fromEntries(sel.map(w => [w, roleOf(w)])) : {}) };

  const toggle = (w: string) => {
    if (done) return;
    setSel(s => (s.includes(w) ? s.filter(x => x !== w) : s.length < item.number ? [...s, w] : s));
  };
  const lockIn = () => {
    setDone(true);
    setTally(t => ({ you: t.you + you, model: t.model + model, rounds: t.rounds + 1 }));
  };
  const next = () => { setI(k => k + 1); setSel([]); setDone(false); };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <span className={`badge ${item.team}`}>{item.team.toUpperCase()}</span>{" "}
          <ModelLabel k={item.spymaster} /> is the spymaster. Its clue:
        </div>
        <div className="small secondary">
          {tally.rounds ? <>After {tally.rounds} clue{tally.rounds > 1 ? "s" : ""}: you found <b>{tally.you}</b>, the models found <b>{tally.model}</b></> : "Words found so far: none yet"}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 760, letterSpacing: ".02em", margin: "10px 0 14px" }}>{item.clue} {item.number}</div>
      <Board words={item.words} keyRoles={item.key} revealed={revealedNow} showKey={done} selected={done ? undefined : new Set(sel)} onPick={done ? undefined : toggle} />
      <p className="note" style={{ marginTop: 10 }}>
        {done ? "The coloured edges now show the full key." :
          `Pick up to ${item.number} word${item.number > 1 ? "s" : ""}, in order of confidence. Words count until your first miss, like the real game. Coloured tiles were revealed earlier in the game.`}
      </p>
      {!done ? (
        <div className="row">
          <button className="btn-primary" disabled={!sel.length} onClick={lockIn}>Lock in {sel.length ? `${sel.length} word${sel.length > 1 ? "s" : ""}` : ""}</button>
          {sel.length > 0 && <span className="small secondary">Your order: {sel.join(", ")}</span>}
          <button onClick={next} style={{ marginLeft: "auto" }}>Skip</button>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: 6 }}>
            <b>You found {you} of {item.number}.</b>{" "}
            {sel.map((w, k) => <span key={w}>{k ? ", " : ""}<span className={`pk ${roleOf(w)}`}>{w}</span></span>)}
          </p>
          <p>
            <b><ModelLabel k={item.guesser} />&apos;s guesser found {model}.</b>{" "}
            {item.modelPicks.map((p, k) => <span key={p.w}>{k ? ", " : ""}<span className={`pk ${p.r}`}>{p.w}</span></span>)}
            {" "}{you > model ? "You beat it." : you === model ? "A tie." : "The model wins this one."}
          </p>
          <div className="row">
            <button className="btn-primary" onClick={next}>Next clue</button>
            <Link className="small" href={`/tournament/${item.slug}`}>See the full game</Link>
          </div>
        </div>
      )}
    </div>
  );
}
