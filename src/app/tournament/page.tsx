import type { Metadata } from "next";
import { stats, versusIndex } from "@/lib/data";
import { HeadToHead, PressureChart, ScoreHeatmap, WinRateBars } from "@/components/Charts";
import { VersusBrowser } from "@/components/GameBrowser";
import ModelLabel from "@/components/ModelLabel";
import { TOURNAMENT } from "@/lib/models";

export const metadata: Metadata = { title: "Tournament", description: "300 games of two-team Codenames between Opus 5.5, Sonnet 5.5, GPT-6 Astra and GPT-6.1 Sol." };

export default function Tournament() {
  const v = stats().versus;
  const P = (k: string) => v.pressure.find((p: { key: string }) => p.key === k);
  const all = P("all");
  const [sw, swN] = all.swung_wins.split("/"), [hw, hwN] = all.held_wins.split("/");
  const fm = v.first_mover;
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <div className="kicker">Two-team Codenames · {v.games} games</div>
      <h1>The tournament</h1>
      <p className="lede">
        Four models, each playing as a full team. Every pair met on the same 25 boards twice, once moving first and once moving second.
        Red moves first and has nine words to find; Blue has eight. The first team to uncover all its words wins, and the assassin loses on the spot.
      </p>

      <h2>Who won</h2>
      <div className="card"><h3>Win rate</h3><p className="note">Share of 150 games won, with a 95% interval. The thin line marks 50%.</p><WinRateBars teams={v.teams} /></div>
      <div className="card"><h3>Head to head</h3><p className="note">Row model&apos;s wins, then column model&apos;s wins, over 50 games per pair.</p><HeadToHead order={TOURNAMENT} h2h={v.h2h} /></div>
      <p className="narrow">Moving first barely mattered: Red won {fm.red_wins} of {fm.decided} games. The two GPT-6 models finished level with each other and both beat Opus clearly.</p>

      <h2 id="pressure">Do they feel the pressure?</h2>
      <p className="narrow">
        In real Codenames the score changes what a good clue is. If your opponent needs one more word and you need five, a safe clue for 2 loses.
        A <b>long-shot moment</b> here means the opponent has two or fewer words left and you trail by three or more. Each model&apos;s clues in those moments are
        compared with its own clues at the same number of words left in close games, so the only thing that changes is the race.
      </p>
      <div className="card">
        <h3>Average clue number: close games against long-shot moments</h3>
        <PressureChart rows={[...TOURNAMENT.map(P), all]} />
      </div>
      <p className="narrow">
        Every model moved right. Bigger clues cost accuracy: {Math.round(all.close_precision * 100)}% of a clue&apos;s words were found in close games and{" "}
        {Math.round(all.moonshot_precision * 100)}% in long-shot moments. Teams that swung for three or more came back {sw} times in {swN}; teams that stayed cautious, {hw} in {hwN}.
        The GPT models were rarely far enough behind to need a long shot, so their individual numbers rest on only a handful of clues.
      </p>
      <div className="card">
        <h3>Average clue number by score</h3>
        <p className="note">Rows: the clue-giving team&apos;s words left. Columns: the opponent&apos;s. Hover a cell for the count.</p>
        <ScoreHeatmap grid={v.grid} />
      </div>

      <h2>The bonus guess</h2>
      <p className="narrow">A guesser may take one more guess than the clue&apos;s number. Under race pressure both Claude models took it about once every ten clues; the GPT models about once in fifty.
        The single-team benchmark asked the guesser a separate &quot;keep guessing?&quot; question, so this prompt difference may explain part of the change from zero there.</p>
      <div className="card scroll">
        <table>
          <thead><tr><th>Model</th><th>Bonus guesses</th><th>Share of clues</th><th>Own word</th><th>Neutral</th><th>Opponent&apos;s word</th><th>Assassin</th></tr></thead>
          <tbody>{TOURNAMENT.map(m => { const b = v.bonus[m]; return (
            <tr key={m}><td><ModelLabel k={m} /></td><td>{b.taken}</td><td>{Math.round((100 * b.taken) / b.clues)}%</td><td>{b.own ?? 0}</td><td>{b.civilian ?? 0}</td><td>{b.opponent ?? 0}</td><td>{b.assassin ?? 0}</td></tr>
          ); })}</tbody>
        </table>
      </div>

      <h2>Same board, same opening</h2>
      <p className="narrow">Each board was opened twelve times, three times by each model. On some boards nearly every game started identically.</p>
      <div className="card scroll">
        <table>
          <thead><tr><th>Board</th><th className="l">Opening clue</th><th>Games that opened with it</th></tr></thead>
          <tbody>{v.unanimous.map((u: { seed: number; clue: string; n: number; of: number }) => (
            <tr key={u.seed}><td>{u.seed}</td><td className="l"><b>{u.clue}</b></td><td>{u.n} of {u.of}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <h2>Every game</h2>
      <p className="secondary">Pick any game to replay it turn by turn.</p>
      <VersusBrowser rows={versusIndex()} models={TOURNAMENT} />
    </div>
  );
}
