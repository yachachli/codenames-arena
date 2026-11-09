"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Board from "./Board";
import { ClueValidator } from "@/lib/referee/validator";
import { REASON_TEXT } from "@/lib/referee/reasons";
import { VersusEngine, RuleError } from "@/lib/referee/versus";
import { FatalApiError, PRESETS, modelClue, modelGuess, type CallLog, type Effort, type Keys, type Seat } from "@/lib/live/players";
import type { Role, Team } from "@/lib/types";

type SeatId = "redSpy" | "redGuess" | "blueSpy" | "blueGuess";
const SEAT_LABEL: Record<SeatId, string> = { redSpy: "Red spymaster", redGuess: "Red guesser", blueSpy: "Blue spymaster", blueGuess: "Blue guesser" };
interface SeatChoice { preset: string; custom: string }
interface BoardDef { seed: number; words: string[]; key: Role[] }
type HumanAsk = { kind: "clue"; error?: string } | { kind: "guess" } | null;

const seatFrom = (c: SeatChoice): Seat => {
  const p = PRESETS.find(x => x.id === c.preset)!;
  const model = p.model || c.custom.trim();
  return { preset: p.id, kind: p.kind, model, label: p.kind === "human" ? "You" : p.model ? p.label : model };
};

export default function LiveGame() {
  const [dict, setDict] = useState<Set<string> | null>(null);
  const [boards, setBoards] = useState<BoardDef[]>([]);
  const [seats, setSeats] = useState<Record<SeatId, SeatChoice>>({
    redSpy: { preset: "opus", custom: "" }, redGuess: { preset: "opus", custom: "" },
    blueSpy: { preset: "astra", custom: "" }, blueGuess: { preset: "astra", custom: "" },
  });
  const saved = (() => { try { return JSON.parse(localStorage.getItem("arena-keys") ?? "null") as Keys | null; } catch { return null; } })();
  const [keys, setKeys] = useState<Keys>(() => saved ?? { anthropic: "", openai: "" });
  const [remember, setRemember] = useState(() => !!saved);
  const [effort, setEffort] = useState<Effort>("medium");
  const [seed, setSeed] = useState(0);
  const [running, setRunning] = useState(false);
  const [, setTick] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [rejections, setRejections] = useState<Record<number, { word: string | null; number: number | null; reason: string }[]>>({});
  const [ask, setAsk] = useState<HumanAsk>(null);
  const [showKey, setShowKey] = useState(false);
  const [clueWord, setClueWord] = useState(""); const [clueNum, setClueNum] = useState(1);
  const engine = useRef<VersusEngine | null>(null);
  const cancel = useRef(false);
  const resolver = useRef<((v: { word?: string; number?: number; stop?: boolean }) => void) | null>(null);
  const rerender = () => setTick(t => t + 1);

  useEffect(() => {
    fetch("/live/boards.json").then(r => r.json()).then(setBoards);
    fetch("/live/dictionary.txt").then(r => r.text()).then(t => setDict(new Set(t.split("\n"))));
  }, []);
  useEffect(() => {
    if (remember) localStorage.setItem("arena-keys", JSON.stringify(keys)); else localStorage.removeItem("arena-keys");
  }, [remember, keys]);
  useEffect(() => () => { cancel.current = true; }, []);

  const resolved: Record<SeatId, Seat> = {
    redSpy: seatFrom(seats.redSpy), redGuess: seatFrom(seats.redGuess), blueSpy: seatFrom(seats.blueSpy), blueGuess: seatFrom(seats.blueGuess),
  };
  const humans = (Object.keys(resolved) as SeatId[]).filter(k => resolved[k].kind === "human");
  const needs = { anthropic: Object.values(resolved).some(s => s.kind === "claude"), openai: Object.values(resolved).some(s => s.kind === "openai") };
  const problems: string[] = [];
  if (humans.length > 1) problems.push("Only one seat can be you: two human seats would let one player see both the key and the guesses.");
  if (needs.anthropic && !keys.anthropic.trim()) problems.push("Add an Anthropic API key for the Claude seats.");
  if (needs.openai && !keys.openai.trim()) problems.push("Add an OpenAI API key for the GPT seats.");
  if (Object.values(resolved).some(s => s.kind !== "human" && !s.model)) problems.push("Enter a model id for each \"other model\" seat.");
  const humanSeat = humans[0];
  const humanIsGuesser = humanSeat === "redGuess" || humanSeat === "blueGuess";
  const humanIsSpy = humanSeat === "redSpy" || humanSeat === "blueSpy";

  const waitHuman = (a: HumanAsk) => new Promise<{ word?: string; number?: number; stop?: boolean }>(res => { setAsk(a); resolver.current = res; });

  const run = useCallback(async () => {
    if (!dict) return;
    const b = boards.find(x => x.seed === seed)!;
    const g = new VersusEngine(b.words, b.key, new ClueValidator(dict));
    engine.current = g; cancel.current = false;
    setCalls([]); setRejections({}); setError(""); setRunning(true); rerender();
    const log = (c: CallLog) => setCalls(cs => [...cs, c]);
    try {
      while (g.phase !== "over" && !cancel.current) {
        const team: Team = g.current;
        const spy = resolved[team === "red" ? "redSpy" : "blueSpy"], gu = resolved[team === "red" ? "redGuess" : "blueGuess"];
        setStatus(`${team === "red" ? "Red" : "Blue"} spymaster (${spy.label}) is thinking of a clue`);
        if (spy.kind === "human") {
          let err: string | undefined;
          for (;;) {
            const a = await waitHuman({ kind: "clue", error: err });
            if (cancel.current) break;
            const v = g.validateClue(a.word ?? "", a.number ?? 0);
            if (v.ok) { g.giveClue(a.word!, a.number!); break; }
            err = v.detail ?? "That clue isn't allowed.";
          }
          setAsk(null);
        } else {
          const rej = await modelClue(g, spy, keys, effort, log, () => cancel.current);
          if (rej.length) setRejections(r => ({ ...r, [g.turnNo]: rej }));
        }
        rerender();
        while (g.phase === "guess" && !cancel.current) {
          setStatus(`${team === "red" ? "Red" : "Blue"} guesser (${gu.label}) is choosing`);
          if (gu.kind === "human") {
            const a = await waitHuman({ kind: "guess" });
            if (cancel.current) break;
            try { if (a.stop) g.stop(); else g.guess(a.word!); } catch (e) { if (!(e instanceof RuleError)) throw e; }
            setAsk(null);
          } else {
            await modelGuess(g, gu, keys, effort, log, () => cancel.current);
          }
          rerender();
        }
      }
      setStatus(g.phase === "over" ? "" : "Stopped.");
    } catch (e) {
      setError(e instanceof FatalApiError ? e.message : `Something went wrong: ${e instanceof Error ? e.message : String(e)}`);
      setStatus("");
    } finally {
      setRunning(false); setAsk(null); rerender();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dict, boards, seed, keys, effort, seats]);

  const stop = () => { cancel.current = true; resolver.current?.({}); setRunning(false); setAsk(null); };
  const g = engine.current;
  const revealed = g ? Object.fromEntries(g.revealed) : {};
  const keyVisible = humanIsSpy ? true : humanIsGuesser ? false : showKey;
  const download = () => {
    if (!g) return;
    const blob = new Blob([JSON.stringify({
      board: { seed, words: g.words, key: g.key }, seats: Object.fromEntries(Object.entries(resolved).map(([k, s]) => [k, { kind: s.kind, model: s.model }])),
      effort, winner: g.winner, outcome: g.outcome, turns: g.turns, rejections, calls,
    }, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `codenames-live-board-${seed}.json`; a.click();
  };
  const left = (t: Team) => (g ? g.remaining(t).length : t === "red" ? 9 : 8);
  const tokens = calls.reduce((s, c) => s + (c.inputTokens ?? 0) + (c.outputTokens ?? 0), 0);

  return (
    <div>
      <div className="card">
        <h3>Set up the game</h3>
        <div className="grid2" style={{ marginTop: 10 }}>
          {(["red", "blue"] as Team[]).map(team => (
            <div key={team}>
              <div style={{ marginBottom: 6 }}><span className={`badge ${team}`}>{team.toUpperCase()}</span> {team === "red" ? "moves first, nine words" : "eight words"}</div>
              {(team === "red" ? ["redSpy", "redGuess"] : ["blueSpy", "blueGuess"] as SeatId[]).map(id => (
                <div key={id} className="row" style={{ marginBottom: 8 }}>
                  <label style={{ width: 92 }} className="secondary">{SEAT_LABEL[id as SeatId].split(" ")[1]}</label>
                  <select disabled={running} value={seats[id as SeatId].preset}
                    onChange={e => setSeats(s => ({ ...s, [id]: { ...s[id as SeatId], preset: e.target.value } }))}>
                    {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  {PRESETS.find(p => p.id === seats[id as SeatId].preset)!.id.endsWith("custom") && (
                    <input type="text" placeholder="model id" disabled={running} value={seats[id as SeatId].custom} style={{ width: 170 }}
                      onChange={e => setSeats(s => ({ ...s, [id]: { ...s[id as SeatId], custom: e.target.value } }))} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <label className="secondary">Board</label>
          <select disabled={running} value={seed} onChange={e => setSeed(+e.target.value)}>
            {Array.from({ length: 100 }, (_, i) => <option key={i} value={i}>{i}{i < 25 ? " (tournament board)" : ""}</option>)}
          </select>
          <button disabled={running} onClick={() => setSeed(Math.floor(Math.random() * 100))}>Random board</button>
          <label className="secondary" style={{ marginLeft: 12 }}>Reasoning effort</label>
          <select disabled={running} value={effort} onChange={e => setEffort(e.target.value as Effort)}>
            <option value="low">low</option><option value="medium">medium</option><option value="high">high</option>
          </select>
        </div>
        {(needs.anthropic || needs.openai) && (
          <div style={{ marginTop: 14 }}>
            <div className="row">
              {needs.anthropic && <input type="password" placeholder="Anthropic API key" autoComplete="off" value={keys.anthropic} disabled={running}
                onChange={e => setKeys(k => ({ ...k, anthropic: e.target.value }))} style={{ width: 280 }} />}
              {needs.openai && <input type="password" placeholder="OpenAI API key" autoComplete="off" value={keys.openai} disabled={running}
                onChange={e => setKeys(k => ({ ...k, openai: e.target.value }))} style={{ width: 280 }} />}
              <label className="secondary"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember on this device</label>
            </div>
            <p className="note" style={{ marginTop: 8 }}>
              Keys stay in your browser and go straight to Anthropic or OpenAI. This site has no server that sees them. A game is usually 30 to 60 model calls of about 1,500 input tokens each, billed to your account.
            </p>
          </div>
        )}
        {problems.length > 0 && <ul className="small" style={{ color: "var(--critical)", margin: "8px 0 0" }}>{problems.map(p => <li key={p}>{p}</li>)}</ul>}
        <div className="row" style={{ marginTop: 14 }}>
          {!running ? (
            <button className="btn-primary" disabled={!dict || !boards.length || problems.length > 0} onClick={run}>
              {!dict ? "Loading the referee's dictionary…" : g ? "Start a new game" : "Start the game"}
            </button>
          ) : <button onClick={stop}>Stop</button>}
          {g && !running && <button onClick={download}>Download the game log</button>}
          {calls.length > 0 && <span className="muted small">{calls.length} model calls · {tokens.toLocaleString()} tokens</span>}
        </div>
      </div>

      {error && <div className="callout warn"><b>The game stopped.</b> {error}</div>}

      {g && (
        <div className="card">
          <div className="replay" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,1fr)", gap: 24 }}>
            <div>
              <Board words={g.words} keyRoles={g.key} revealed={revealed} showKey={keyVisible}
                highlight={new Set(g.turns.length ? g.turn.picks.map(p => p.w) : [])}
                onPick={ask?.kind === "guess" ? w => { resolver.current?.({ word: w }); } : undefined} />
              <div className="row" style={{ marginTop: 10, fontSize: 14, color: "var(--text-secondary)", gap: 16 }}>
                <span><span className="badge red">RED</span> {resolved.redSpy.label}{resolved.redGuess.label !== resolved.redSpy.label ? ` + ${resolved.redGuess.label}` : ""}: <b>{left("red")}</b> left</span>
                <span><span className="badge blue">BLUE</span> {resolved.blueSpy.label}{resolved.blueGuess.label !== resolved.blueSpy.label ? ` + ${resolved.blueGuess.label}` : ""}: <b>{left("blue")}</b> left</span>
                {!humanSeat && <label style={{ marginLeft: "auto", cursor: "pointer" }}><input type="checkbox" checked={showKey} onChange={e => setShowKey(e.target.checked)} /> Show the key</label>}
              </div>
              {status && running && <p className="secondary small" style={{ marginTop: 10 }}>⏳ {status}…</p>}
              {ask?.kind === "clue" && (
                <div className="callout" style={{ marginTop: 12 }}>
                  <b>Your clue.</b> The coloured edges show the key. Give one word and how many of your words it points to.
                  <div className="row" style={{ marginTop: 8 }}>
                    <input type="text" value={clueWord} onChange={e => setClueWord(e.target.value)} placeholder="clue" autoFocus />
                    <input type="number" min={1} max={9} value={clueNum} onChange={e => setClueNum(+e.target.value)} style={{ width: 64 }} />
                    <button className="btn-primary" onClick={() => { resolver.current?.({ word: clueWord, number: clueNum }); setClueWord(""); }}>Give clue</button>
                  </div>
                  {ask.error && <p className="small" style={{ color: "var(--critical)", margin: "8px 0 0" }}>{ask.error}</p>}
                </div>
              )}
              {ask?.kind === "guess" && (
                <div className="callout" style={{ marginTop: 12 }}>
                  <b>Your guess.</b> Clue: <span className="cl">{g.turn.clue?.toUpperCase()} {g.turn.number}</span>. Click a word, up to {g.guessesRemaining()} more.
                  <div style={{ marginTop: 8 }}><button disabled={!g.turn.picks.length} onClick={() => resolver.current?.({ stop: true })}>End my turn</button></div>
                </div>
              )}
              {g.phase === "over" && (
                <p style={{ fontWeight: 650, marginTop: 14 }}>
                  {g.winner ? `${g.winner === "red" ? "Red" : "Blue"} wins` : "No winner"}
                  {g.outcome === "assassin" ? `: ${g.winner === "red" ? "Blue" : "Red"} revealed the assassin.` : g.outcome === "cleared" ? "." : ": turn limit reached."}
                </p>
              )}
            </div>
            <div>
              <ol className="log">
                {g.turns.map(t => (
                  <li key={t.n}>
                    <span className={`badge ${t.team}`}>{t.team.toUpperCase()}</span>{" "}
                    {t.clue ? <span className="cl">{t.clue.toUpperCase()} {t.number}</span> : <span className="cl">No valid clue</span>}{" "}
                    <span className="muted small">at {t.ownLeft} to {t.oppLeft}</span>
                    {rejections[t.n]?.length ? (
                      <div className="rej">Rejected first: {rejections[t.n].map((r, i) => (
                        <span key={i}>{i ? ", " : ""}<s>{(r.word ?? "?").toUpperCase()} {r.number ?? ""}</s> ({REASON_TEXT[r.reason] ?? r.reason})</span>))}</div>
                    ) : null}
                    <div>{t.picks.map((p, i) => <span key={i}>{i ? ", " : ""}<span className={`pk ${p.r}`}>{p.w}</span></span>)}
                      {t.stopped && <span className="muted small"> · stopped</span>}</div>
                  </li>
                ))}
              </ol>
              {calls.length > 0 && (
                <details style={{ marginTop: 14 }}>
                  <summary className="small secondary" style={{ cursor: "pointer" }}>Model calls ({calls.length})</summary>
                  <ol className="small" style={{ paddingLeft: 18 }}>
                    {calls.map((c, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        Turn {c.turn} {c.team} {c.role}, {c.seat}{c.servedBy && c.servedBy !== c.seat ? ` (served by ${c.servedBy})` : ""}:{" "}
                        <code>{c.answer.slice(0, 80)}</code> {c.ok ? "" : <span style={{ color: "var(--critical)" }}>rejected ({REASON_TEXT[c.reason ?? ""] ?? c.reason})</span>}
                        <span className="muted"> · {Math.round((c.ms ?? 0) / 100) / 10}s</span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          </div>
          <style>{`@media (max-width: 860px) { .replay { grid-template-columns: 1fr !important; } }`}</style>
        </div>
      )}
    </div>
  );
}
