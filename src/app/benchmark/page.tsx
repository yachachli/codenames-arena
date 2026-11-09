import type { Metadata } from "next";
import { benchIndex, stats } from "@/lib/data";
import { BenchMatrix } from "@/components/Charts";
import { BenchBrowser } from "@/components/GameBrowser";
import { BENCH } from "@/lib/models";

export const metadata: Metadata = { title: "Benchmark", description: "Single-team Codenames cross-play: every model gives clues to every other model on 50 shared boards." };

const SHORT: Record<string, string> = { Opus: "Opus 5.5", Sonnet: "Sonnet 5.5", "GPT-5.5": "GPT-5.5", Sol: "GPT-5.6 Sol", GloVe: "GloVe" };

export default function Benchmark() {
  const b = stats().bench;
  const sp = b.selfplay;
  const fc = Object.entries(b.firstClue as Record<string, { agree: number; n: number }>)
    .filter(([k]) => !k.includes("GloVe")).sort((x, y) => y[1].agree - x[1].agree);
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <div className="kicker">Single-team cross-play · {b.games.toLocaleString()} games</div>
      <h1>The benchmark</h1>
      <p className="lede">
        One model gives clues, another guesses, on the same 50 boards, for every pairing of four language models and a GloVe word-vector baseline.
        The score is the number of turns to find all nine words; hitting the assassin counts as 25. Lower is better.
      </p>
      <div className="callout">
        <b>Headline:</b> once each model&apos;s skill as clue giver and as guesser is accounted for, playing with a copy of itself is worth{" "}
        {sp.mean.toFixed(2)} turns, 95% CI {sp.ci[0].toFixed(2)} to +{sp.ci[1].toFixed(2)}. Teammates of the same model don&apos;t read each other any better.
      </div>
      <div className="card">
        <h3>Average turns to finish, by clue giver and guesser</h3>
        <p className="note">Hover a cell for the interval and details. GloVe paired with itself scores 3 because its clues are a private code; with a language model guessing, it collapses.</p>
        <BenchMatrix models={BENCH} cells={b.cells} />
      </div>
      <h2>The clue giver matters, the guesser barely does</h2>
      <p className="narrow">Splitting the variance in scores across the language-model games: the clue giver explains {(b.variance.cluer * 100).toFixed(1)}%, the guesser{" "}
        {(b.variance.guesser * 100).toFixed(1)}%, and their interaction {(b.variance.interaction * 100).toFixed(1)}%. The board and luck explain the rest.</p>
      <h2>Same associations, different companies</h2>
      <p className="narrow">How often two models, given the same board, opened with the exact same clue word, out of 50 boards.</p>
      <div className="card scroll">
        <table>
          <thead><tr><th>Pair</th><th>Same first clue</th></tr></thead>
          <tbody>{fc.map(([k, x]) => (
            <tr key={k}><td>{k.split("|").map(n => SHORT[n] ?? n).join(" and ")}</td><td>{x.agree} of {x.n}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <h2>Every game</h2>
      <BenchBrowser rows={benchIndex()} models={BENCH} />
    </div>
  );
}
