import Link from "next/link";
import { stats, versusIndex } from "@/lib/data";
import { WinRateBars } from "@/components/Charts";
import ModelLabel from "@/components/ModelLabel";
import { modelName } from "@/lib/models";

export default function Home() {
  const s = stats();
  const v = s.versus;
  const all = v.pressure.find((p: { key: string }) => p.key === "all");
  const [swungWins, swung] = all.swung_wins.split("/");
  const idx = versusIndex();
  const bySlug = Object.fromEntries(idx.map(r => [r.slug, r]));
  return (
    <div className="wrap">
      <section style={{ padding: "56px 0 8px" }}>
        <div className="kicker">An open experiment</div>
        <h1>Language models play Codenames<br />against each other</h1>
        <p className="lede">
          Claude Opus 5.5, Claude Sonnet 5.5, GPT-6 Astra and GPT-6.1 Sol played {v.games} games of two-team Codenames, plus a
          1,250-game single-team benchmark. A plain-code referee ran every game. Watch any of them, or test yourself against the models&apos; clues.
        </p>
        <div className="cta">
          <Link className="btn btn-primary" href="/tournament">See the tournament</Link>
          <Link className="btn" href="/play">Can you out-guess a model?</Link>
        </div>
        <div className="tiles">
          <div className="tile"><div className="v">{(v.games + s.bench.games).toLocaleString()}</div><div className="k">refereed games to replay</div></div>
          <div className="tile"><div className="v">{v.clues.toLocaleString()}</div><div className="k">clues in the tournament</div></div>
          <div className="tile"><div className="v">+{all.shift.toFixed(2)}</div><div className="k">extra words per clue when far behind</div></div>
          <div className="tile"><div className="v">{swungWins} of {swung}</div><div className="k">long-shot clues that led to a comeback</div></div>
        </div>
      </section>

      <h2>The tournament</h2>
      <p className="secondary narrow">Each model played as a whole team, spymaster and guesser both, against every other model on 25 boards, once moving first and once second.</p>
      <div className="card"><h3>Win rate</h3><p className="note">Share of 150 games won, with a 95% interval. Hover for details.</p><WinRateBars teams={v.teams} /></div>

      <h2>Games worth watching</h2>
      <div className="featured">
        {s.featured.map((f: { slug: string; title: string; blurb: string }) => {
          const r = bySlug[f.slug];
          return (
            <Link key={f.slug} href={`/tournament/${f.slug}`}>
              <h3>{f.title}</h3>
              <div className="small secondary" style={{ marginBottom: 8 }}>
                <ModelLabel k={r.red} /> vs <ModelLabel k={r.blue} /> · board {r.seed}
              </div>
              <p className="small" style={{ margin: 0 }}>{f.blurb}</p>
            </Link>
          );
        })}
      </div>

      <h2>What we found</h2>
      <div className="grid2">
        <div className="card">
          <h3>They feel the pressure</h3>
          <p className="small">Far behind late in a game, every model asked for more words per clue. Clues for three or more words went from {Math.round(all.close_share_3plus * 100)}% to {Math.round(all.moonshot_share_3plus * 100)}%. It rarely worked: {swungWins} comebacks in {swung} tries.</p>
          <Link href="/tournament#pressure" className="small">The pressure analysis</Link>
        </div>
        <div className="card">
          <h3>They share one brain</h3>
          <p className="small">On board 17, all twelve opening clues were SPACE 3, from four models by two companies. In the single-team benchmark, GPT-5.5 and GPT-5.6 Sol opened with the same clue on 44 of 50 boards.</p>
          <Link href="/benchmark" className="small">The benchmark</Link>
        </div>
        <div className="card">
          <h3>Teammates don&apos;t read each other</h3>
          <p className="small">In the single-team benchmark, pairing a model with a copy of itself was worth {s.bench.selfplay.mean.toFixed(2)} turns (95% CI {s.bench.selfplay.ci[0].toFixed(2)} to +{s.bench.selfplay.ci[1].toFixed(2)}). The clue giver matters; the guesser barely does.</p>
          <Link href="/benchmark" className="small">Cross-play results</Link>
        </div>
        <div className="card">
          <h3>{modelName("sonnet")} is the gambler</h3>
          <p className="small">Sonnet hit its own assassin {v.sonnet_assassin} times in 150 tournament games and gave the biggest clue of all: PAPER 6, with one word to spare. It won {Math.round(v.teams.find((t: { key: string }) => t.key === "sonnet").rate * 100)}% of its games.</p>
          <Link href="/tournament/sonnet-vs-sol61-board-12" className="small">Watch PAPER 6</Link>
        </div>
      </div>
    </div>
  );
}
