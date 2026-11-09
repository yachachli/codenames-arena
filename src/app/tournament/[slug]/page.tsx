import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stats, versusGame, versusIndex, versusSlugs } from "@/lib/data";
import Replay from "@/components/Replay";
import { resultText } from "@/lib/result";
import ModelLabel from "@/components/ModelLabel";
import { modelName } from "@/lib/models";

export function generateStaticParams() { return versusSlugs().map(slug => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = versusGame(slug);
  const f = stats().featured.find((x: { slug: string }) => x.slug === slug);
  return { title: f?.title ?? `${modelName(g.red)} vs ${modelName(g.blue)}, board ${g.seed}`, description: f?.blurb ?? resultText(g) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!versusSlugs().includes(slug)) notFound();
  const g = versusGame(slug);
  const f = stats().featured.find((x: { slug: string }) => x.slug === slug);
  const sameBoard = versusIndex().filter(r => r.seed === g.seed && r.slug !== slug);
  return (
    <div className="wrap" style={{ paddingTop: 32 }}>
      <p className="small"><Link href="/tournament">← Tournament</Link></p>
      <div className="kicker">Board {g.seed} · two-team game</div>
      <h1 style={{ fontSize: 30 }}>{f ? f.title : <><ModelLabel k={g.red} /> vs <ModelLabel k={g.blue} /></>}</h1>
      <p className="secondary">
        <span className="badge red">RED</span> <ModelLabel k={g.red} /> moves first with nine words. <span className="badge blue">BLUE</span> <ModelLabel k={g.blue} /> has eight.
      </p>
      {f && <p className="narrow">{f.blurb}</p>}
      <div className="card"><Replay game={g} startAt={f ? "start" : "end"} /></div>
      <p className="note">Each clue shows the score when it was given, as clue-giver&apos;s words left to opponent&apos;s. Struck-through clues were rejected by the referee and the spymaster tried again.</p>
      <h2 style={{ fontSize: 20 }}>Other games on board {g.seed}</h2>
      <ul className="small">
        {sameBoard.map(r => (
          <li key={r.slug}><Link href={`/tournament/${r.slug}`}>{modelName(r.red)} vs {modelName(r.blue)}</Link>{" "}
            <span className="muted">· {r.winner ? `${modelName(r.winner === "red" ? r.red : r.blue)} won` : "no winner"} in {r.turns} turns</span></li>
        ))}
      </ul>
    </div>
  );
}
