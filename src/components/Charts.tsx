"use client";
import { MODELS, modelName } from "@/lib/models";
import { useTip } from "./useTip";
import ModelLabel from "./ModelLabel";

const pct = (x: number | null | undefined) => (x == null || Number.isNaN(x) ? "–" : `${Math.round(x * 100)}%`);
const f2 = (x: number | null | undefined) => (x == null ? "–" : x.toFixed(2));
const SEQ = ["--seq-100", "--seq-200", "--seq-300", "--seq-400", "--seq-500", "--seq-600", "--seq-700"];

export interface TeamRow { key: string; wins: number; games: number; rate: number; ci: [number, number]; red: string; blue: string; assassin_losses: number }

export function WinRateBars({ teams }: { teams: TeamRow[] }) {
  const { bind, node } = useTip();
  const rows = [...teams].sort((a, b) => b.rate - a.rate);
  return (
    <div className="bars">
      {rows.map(s => (
        <div key={s.key} className="barrow" {...bind(<>
          <b>{modelName(s.key)}</b><br />Won {s.wins} of {s.games}, 95% interval {pct(s.ci[0])} to {pct(s.ci[1])}<br />
          Moving first {s.red.replace("/", " of ")} · second {s.blue.replace("/", " of ")}<br />Lost to its own assassin {s.assassin_losses} times
        </>)}>
          <span className="name"><ModelLabel k={s.key} /></span>
          <div className="barwrap">
            <div className="bg" />
            <div className="fill" style={{ width: `${100 * s.rate}%`, background: MODELS[s.key].color }} />
            <div className="ci" style={{ left: `${100 * s.ci[0]}%`, width: `${100 * (s.ci[1] - s.ci[0])}%` }} />
            <div className="half" />
          </div>
          <span className="val">{s.wins} of {s.games} · {pct(s.rate)}</span>
        </div>
      ))}
      {node}
    </div>
  );
}

export function HeadToHead({ order, h2h }: { order: string[]; h2h: Record<string, Record<string, string>> }) {
  return (
    <div className="scroll">
      <table>
        <thead><tr><th />{order.map(k => <th key={k}><ModelLabel k={k} /></th>)}</tr></thead>
        <tbody>
          {order.map(a => (
            <tr key={a}>
              <td><ModelLabel k={a} bold /></td>
              {order.map(b => <td key={b}>{a === b ? "" : h2h[a][b].replace("-", "–")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface PressureRow {
  key: string; name: string; moonshot_clues: number; moonshot_mean_number: number; matched_close_mean_number: number;
  close_share_3plus: number; moonshot_share_3plus: number; close_precision: number; moonshot_precision: number; swung_wins: string; held_wins: string;
}

export function PressureChart({ rows }: { rows: PressureRow[] }) {
  const { bind, node } = useTip();
  const W = 760, L = 150, R = 110, top = 34, rh = 46, H = top + rows.length * rh + 10;
  const lo = 1.5, hi = 3.75, x = (v: number) => L + ((v - lo) / (hi - lo)) * (W - L - R);
  const ticks = [1.5, 2, 2.5, 3, 3.5];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Average clue number in close games and long-shot moments, by model">
        {ticks.map(v => (
          <g key={v}><line className="gridline" x1={x(v)} x2={x(v)} y1={top - 8} y2={H - 6} /><text x={x(v)} y={top - 14} textAnchor="middle">{v.toFixed(1)}</text></g>
        ))}
        {rows.map((p, i) => {
          const y = top + i * rh + rh / 2, c = p.key === "all" ? "var(--text-primary)" : MODELS[p.key].color;
          const a = x(p.matched_close_mean_number), b = x(p.moonshot_mean_number);
          return (
            <g key={p.key} {...bind(<>
              <b>{p.key === "all" ? "All teams" : modelName(p.key)}</b><br />
              Close games: {f2(p.matched_close_mean_number)} words per clue<br />
              Long-shot moments: {f2(p.moonshot_mean_number)} per clue, over {p.moonshot_clues} clues<br />
              Clues of 3+: {pct(p.close_share_3plus)} close, {pct(p.moonshot_share_3plus)} long shot<br />
              Words found: {pct(p.close_precision)} close, {pct(p.moonshot_precision)} long shot
            </>)}>
              <rect x={0} y={y - rh / 2} width={W} height={rh} fill="transparent" />
              <text className="lab" x={0} y={y + 5}>{p.key === "all" ? "All teams" : modelName(p.key)}</text>
              <line x1={a} x2={b} y1={y} y2={y} stroke={c} strokeWidth={2} />
              <circle cx={a} cy={y} r={6} fill="var(--surface-1)" stroke={c} strokeWidth={2} />
              <circle cx={b} cy={y} r={7} fill={c} stroke="var(--surface-1)" strokeWidth={2} />
              <text x={b + 14} y={y + 4}>{f2(p.moonshot_mean_number)} · {p.moonshot_clues} clues</text>
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="var(--text-secondary)" strokeWidth="2" /></svg> close games, same words left</span>
        <span><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="var(--text-secondary)" /></svg> long-shot moments</span>
      </div>
      {node}
    </div>
  );
}

export function ScoreHeatmap({ grid }: { grid: Record<string, { mean: number; n: number }> }) {
  const { bind, node } = useTip();
  const step = (v: number) => Math.max(0, Math.min(6, Math.round(((v - 1) / 2.6) * 6)));
  const cells: React.ReactNode[] = [<div key="corner" className="h" />];
  for (let o = 1; o <= 9; o++) cells.push(<div key={`h${o}`} className="h">{o}</div>);
  for (let own = 9; own >= 1; own--) {
    cells.push(<div key={`r${own}`} className="h" style={{ justifyContent: "flex-start" }}>{own} left</div>);
    for (let opp = 1; opp <= 9; opp++) {
      const c = grid[`${own},${opp}`];
      const zone = opp <= 2 && own - opp >= 3;
      if (!c || c.n < 3) { cells.push(<div key={`${own}-${opp}`} className="c" style={{ background: "var(--surface-2)" }} />); continue; }
      const k = step(c.mean);
      cells.push(
        <div key={`${own}-${opp}`} className={"c" + (zone ? " zone" : "")} {...bind(<>{own} words left against {opp}<br />Average clue {c.mean.toFixed(2)} over {c.n} clues</>)}
          style={{ background: `var(${SEQ[k]})`, color: k >= 4 ? "#fff" : "#0b0b0b" }}>{c.mean.toFixed(1)}</div>,
      );
    }
  }
  return (
    <div>
      <div className="heat" style={{ gridTemplateColumns: "64px repeat(9, 1fr)" }}>{cells}</div>
      <div className="legend">
        <span>Columns: opponent&apos;s words left</span><span>Smaller clues</span>
        {SEQ.map(s => <span key={s} className="swatch" style={{ background: `var(${s})`, margin: 0 }} />)}
        <span>Bigger clues</span>
        <span><span className="swatch" style={{ outline: "2px solid var(--text-primary)", outlineOffset: -2 }} />Long-shot moment</span>
        <span>Blank: fewer than 3 clues</span>
      </div>
      {node}
    </div>
  );
}

export interface BenchCell { cluer: string; guesser: string; n: number; meanScore: number; ci: [number, number]; winRate: number; meanNumber: number; precision: number }

export function BenchMatrix({ models, cells }: { models: string[]; cells: BenchCell[] }) {
  const { bind, node } = useTip();
  const get = (c: string, g: string) => cells.find(x => x.cluer === c && x.guesser === g);
  // darker = fewer turns = better. Scores run 3 (GloVe with itself) to about 21.
  const step = (v: number) => 6 - Math.max(0, Math.min(6, Math.round(((v - 4) / 14) * 6)));
  return (
    <div>
      <div className="scroll">
        <div className="heat" style={{ gridTemplateColumns: `130px repeat(${models.length}, minmax(70px, 1fr))`, minWidth: 560 }}>
          <div className="h" style={{ justifyContent: "flex-start", fontWeight: 600 }}>Clue giver ↓</div>
          {models.map(g => <div key={g} className="h">{modelName(g)}</div>)}
          {models.map(c => [
            <div key={`r${c}`} className="h" style={{ justifyContent: "flex-start" }}><ModelLabel k={c} /></div>,
            ...models.map(g => {
              const x = get(c, g);
              if (!x) return <div key={`${c}${g}`} className="c" />;
              const k = step(x.meanScore);
              return (
                <div key={`${c}${g}`} className={"c" + (c === g ? " zone" : "")} style={{ background: `var(${SEQ[k]})`, color: k >= 4 ? "#fff" : "#0b0b0b", minHeight: 46 }}
                  {...bind(<><b>{modelName(c)}</b> gives clues, <b>{modelName(g)}</b> guesses<br />Average {x.meanScore.toFixed(2)} turns (95% CI {x.ci[0].toFixed(1)} to {x.ci[1].toFixed(1)})<br />
                    Won {pct(x.winRate)} of {x.n} games · {x.meanNumber.toFixed(2)} words per clue · {pct(x.precision)} found</>)}>
                  {x.meanScore.toFixed(1)}
                </div>
              );
            }),
          ])}
        </div>
      </div>
      <div className="legend">
        <span>Guesser across the top. Average turns to finish; a loss counts as 25.</span>
        <span>More turns</span>{[...SEQ].map(s => <span key={s} className="swatch" style={{ background: `var(${s})`, margin: 0 }} />)}<span>Fewer turns</span>
        <span><span className="swatch" style={{ outline: "2px solid var(--text-primary)", outlineOffset: -2 }} />Model paired with itself</span>
      </div>
      {node}
    </div>
  );
}
