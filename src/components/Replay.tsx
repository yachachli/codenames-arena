"use client";
import { useEffect, useMemo, useState } from "react";
import Board from "./Board";
import ModelLabel from "./ModelLabel";
import { REASON_TEXT } from "@/lib/reasons";
import type { BenchGame, Role, Team, Turn, VersusGame } from "@/lib/types";
import { resultText } from "@/lib/result";

function TurnLine({ t, versus }: { t: Turn; versus: boolean }) {
  return (
    <>
      {versus ? <span className={`badge ${t.team}`}>{t.team.toUpperCase()}</span> : <span className="muted small">Turn {t.n}</span>}{" "}
      {t.clue ? <span className="cl">{t.clue} {t.number}</span> : <span className="cl">No valid clue</span>}{" "}
      {versus && t.ownLeft != null && <span className="muted small">at {t.ownLeft} to {t.oppLeft}</span>}
      {t.rejected?.length ? (
        <div className="rej">
          Rejected first:{" "}
          {t.rejected.map((r, i) => (
            <span key={i}>{i ? ", " : ""}<s>{(r.word ?? "?").toUpperCase()} {r.number ?? ""}</s> ({REASON_TEXT[r.reason ?? ""] ?? r.reason})</span>
          ))}
        </div>
      ) : null}
      <div>
        {t.picks.map((p, i) => <span key={i}>{i ? ", " : ""}<span className={`pk ${p.r}`}>{p.w}</span></span>)}
        {t.stopped && <span className="muted small"> · stopped</span>}
        {t.forfeit && <span className="muted small">Turn forfeited after ten invalid tries</span>}
      </div>
    </>
  );
}

export default function Replay({ game, startAt = "end", showKeyDefault = false }: {
  game: VersusGame | BenchGame; startAt?: "start" | "end"; showKeyDefault?: boolean;
}) {
  const versus = game.mode === "versus";
  const T = game.turns.length;
  const [step, setStep] = useState(startAt === "end" ? T : 0);
  const [playing, setPlaying] = useState(false);
  const [showKey, setShowKey] = useState(showKeyDefault);

  const isPlaying = playing && step < T;
  useEffect(() => {
    if (!isPlaying) return;
    const id = setTimeout(() => setStep(s => s + 1), 1300);
    return () => clearTimeout(id);
  }, [isPlaying, step]);

  const { revealed, now } = useMemo(() => {
    const rv: Record<string, Role> = {};
    game.turns.slice(0, step).forEach(t => t.picks.forEach(p => { rv[p.w] = p.r; }));
    return { revealed: rv, now: new Set(step ? game.turns[step - 1].picks.map(p => p.w) : []) };
  }, [game, step]);
  const left = (team: Team) => game.key.filter((k, i) => k === team && !revealed[game.words[i]]).length;

  const play = () => {
    if (isPlaying) { setPlaying(false); return; }
    if (step >= T) setStep(0);
    setPlaying(true);
  };

  return (
    <div className="replay" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,1fr)", gap: 24 }}>
      <div>
        <Board words={game.words} keyRoles={game.key} revealed={revealed} showKey={showKey} highlight={now} />
        <div className="row" style={{ marginTop: 10, fontSize: 14, color: "var(--text-secondary)", gap: 16 }}>
          {versus ? (
            <>
              <span><span className="badge red">RED</span> <ModelLabel k={(game as VersusGame).red} />: <b>{left("red")}</b> left</span>
              <span><span className="badge blue">BLUE</span> <ModelLabel k={(game as VersusGame).blue} />: <b>{left("blue")}</b> left</span>
            </>
          ) : (
            <span>Team words left: <b>{left("red")}</b> of 9</span>
          )}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={() => { setPlaying(false); setStep(0); }}>Start</button>
          <button onClick={() => { setPlaying(false); setStep(s => Math.max(0, s - 1)); }}>Back</button>
          <button onClick={() => { setPlaying(false); setStep(s => Math.min(T, s + 1)); }}>Next turn</button>
          <button className="btn-primary" onClick={play}>{isPlaying ? "Pause" : "Play"}</button>
          <span className="muted small">{step ? `Turn ${step} of ${T}` : "Before the first clue"}</span>
          <label className="secondary" style={{ marginLeft: "auto", cursor: "pointer" }}>
            <input type="checkbox" checked={showKey} onChange={e => setShowKey(e.target.checked)} /> Show the key
          </label>
        </div>
      </div>
      <div>
        <ol className="log">
          {game.turns.map((t, i) => (
            <li key={i} className={"click " + (i + 1 === step ? "cur" : i + 1 > step ? "future" : "")}
              onClick={() => { setPlaying(false); setStep(i + 1); }}>
              <TurnLine t={t} versus={versus} />
            </li>
          ))}
        </ol>
        <p style={{ fontWeight: 600, marginTop: 12 }}>{resultText(game)}</p>
      </div>
      <style>{`@media (max-width: 860px) { .replay { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
