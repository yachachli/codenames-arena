import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { benchGame, benchSlugs } from "@/lib/data";
import Replay from "@/components/Replay";
import { resultText } from "@/lib/result";
import ModelLabel from "@/components/ModelLabel";
import { modelName } from "@/lib/models";

export function generateStaticParams() { return benchSlugs().map(slug => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = benchGame(slug);
  return { title: `${modelName(g.cluer)} clues for ${modelName(g.guesser)}, board ${g.seed}`, description: resultText(g) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!benchSlugs().includes(slug)) notFound();
  const g = benchGame(slug);
  return (
    <div className="wrap" style={{ paddingTop: 32 }}>
      <p className="small"><Link href="/benchmark">← Benchmark</Link></p>
      <div className="kicker">Board {g.seed} · single-team game</div>
      <h1 style={{ fontSize: 30 }}><ModelLabel k={g.cluer} /> gives clues to <ModelLabel k={g.guesser} /></h1>
      <p className="secondary narrow">One team, nine red words to find. Blue words belong to an absent opponent; revealing one ends the turn. The score is turns taken, or 25 for a loss.</p>
      <div className="card"><Replay game={g} startAt="end" /></div>
    </div>
  );
}
