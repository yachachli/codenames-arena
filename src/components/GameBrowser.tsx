"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModelLabel from "./ModelLabel";
import { modelName } from "@/lib/models";
import type { BenchIndexRow, VersusIndexRow } from "@/lib/types";

const ENDINGS: Record<string, string> = { cleared: "Found its last word", assassin: "Assassin", gift: "Revealed the opponent's last word" };

export function VersusBrowser({ rows, models }: { rows: VersusIndexRow[]; models: string[] }) {
  const router = useRouter();
  const [model, setModel] = useState(""); const [opp, setOpp] = useState(""); const [board, setBoard] = useState("");
  const [ending, setEnding] = useState(""); const [special, setSpecial] = useState(""); const [limit, setLimit] = useState(40);
  const list = useMemo(() => rows.filter(r =>
    (!model || r.red === model || r.blue === model) &&
    (!opp || (model ? (r.red === model ? r.blue : r.red) === opp : r.red === opp || r.blue === opp)) &&
    (!board || r.seed === +board) && (!ending || r.ending === ending) &&
    (!special || (special === "longshot" ? r.longShots > 0 : special === "comeback" ? r.comeback : r.biggest >= 5))), [rows, model, opp, board, ending, special]);
  const winnerKey = (r: VersusIndexRow) => (r.winner === "red" ? r.red : r.winner === "blue" ? r.blue : null);
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={model} onChange={e => setModel(e.target.value)} aria-label="Model">
          <option value="">Any model</option>{models.map(m => <option key={m} value={m}>{modelName(m)}</option>)}
        </select>
        <select value={opp} onChange={e => setOpp(e.target.value)} aria-label="Opponent">
          <option value="">{model ? "Any opponent" : "And any other"}</option>{models.filter(m => m !== model).map(m => <option key={m} value={m}>{modelName(m)}</option>)}
        </select>
        <select value={board} onChange={e => setBoard(e.target.value)} aria-label="Board">
          <option value="">Any board</option>{Array.from({ length: 25 }, (_, i) => <option key={i} value={i}>Board {i}</option>)}
        </select>
        <select value={ending} onChange={e => setEnding(e.target.value)} aria-label="Ending">
          <option value="">Any ending</option>{Object.entries(ENDINGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={special} onChange={e => setSpecial(e.target.value)} aria-label="Highlights">
          <option value="">All games</option><option value="longshot">Had a long-shot moment</option>
          <option value="comeback">Comeback wins</option><option value="huge">A clue for 5 or more</option>
        </select>
        <span className="muted small">{list.length} games</span>
      </div>
      <div className="scroll">
        <table>
          <thead><tr><th className="l">Board</th><th className="l">Red (first)</th><th className="l">Blue</th><th className="l">Winner</th><th className="l">How it ended</th><th>Turns</th><th>Words left</th></tr></thead>
          <tbody>
            {list.slice(0, limit).map(r => (
              <tr key={r.slug} className="link" onClick={() => router.push(`/tournament/${r.slug}`)}>
                <td className="l"><Link href={`/tournament/${r.slug}`} onClick={e => e.stopPropagation()}>{r.seed}</Link></td>
                <td className="l"><ModelLabel k={r.red} /></td><td className="l"><ModelLabel k={r.blue} /></td>
                <td className="l"><ModelLabel k={winnerKey(r)} bold /></td>
                <td className="l">{ENDINGS[r.ending] ?? r.ending}{r.comeback && <span className="tag" style={{ marginLeft: 6 }}>comeback</span>}</td>
                <td>{r.turns}</td><td>{r.redLeft}–{r.blueLeft}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > limit && <div style={{ marginTop: 12 }}><button onClick={() => setLimit(l => l + 60)}>Show more</button></div>}
    </div>
  );
}

export function BenchBrowser({ rows, models }: { rows: BenchIndexRow[]; models: string[] }) {
  const router = useRouter();
  const [cluer, setCluer] = useState(""); const [guesser, setGuesser] = useState(""); const [board, setBoard] = useState("");
  const [outcome, setOutcome] = useState(""); const [limit, setLimit] = useState(40);
  const list = useMemo(() => rows.filter(r => (!cluer || r.cluer === cluer) && (!guesser || r.guesser === guesser) &&
    (!board || r.seed === +board) && (!outcome || r.outcome === outcome)), [rows, cluer, guesser, board, outcome]);
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={cluer} onChange={e => setCluer(e.target.value)} aria-label="Clue giver">
          <option value="">Any clue giver</option>{models.map(m => <option key={m} value={m}>{modelName(m)}</option>)}
        </select>
        <select value={guesser} onChange={e => setGuesser(e.target.value)} aria-label="Guesser">
          <option value="">Any guesser</option>{models.map(m => <option key={m} value={m}>{modelName(m)}</option>)}
        </select>
        <select value={board} onChange={e => setBoard(e.target.value)} aria-label="Board">
          <option value="">Any board</option>{Array.from({ length: 50 }, (_, i) => <option key={i} value={i}>Board {i}</option>)}
        </select>
        <select value={outcome} onChange={e => setOutcome(e.target.value)} aria-label="Outcome">
          <option value="">Any result</option><option value="win">Won</option><option value="assassin">Hit the assassin</option>
          <option value="opponent_cleared">Opponent words ran out</option>
        </select>
        <span className="muted small">{list.length} games</span>
      </div>
      <div className="scroll">
        <table>
          <thead><tr><th className="l">Board</th><th className="l">Clue giver</th><th className="l">Guesser</th><th className="l">Result</th><th>Score</th></tr></thead>
          <tbody>
            {list.slice(0, limit).map(r => (
              <tr key={r.slug} className="link" onClick={() => router.push(`/benchmark/${r.slug}`)}>
                <td className="l"><Link href={`/benchmark/${r.slug}`} onClick={e => e.stopPropagation()}>{r.seed}</Link></td>
                <td className="l"><ModelLabel k={r.cluer} /></td><td className="l"><ModelLabel k={r.guesser} /></td>
                <td className="l">{r.outcome === "win" ? `Won in ${r.turns} turns` : r.outcome === "assassin" ? "Hit the assassin" : "Opponent words ran out"}</td>
                <td>{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > limit && <div style={{ marginTop: 12 }}><button onClick={() => setLimit(l => l + 60)}>Show more</button></div>}
    </div>
  );
}
