import type { Metadata } from "next";
import { versusGame, versusIndex } from "@/lib/data";
import { QuizClient as Quiz } from "@/components/ClientOnly";
import type { QuizItem } from "@/components/Quiz";
import type { Role } from "@/lib/types";

export const metadata: Metadata = { title: "Can you out-guess a model?", description: "Real clues from the tournament. Pick the words, then see what the model's guesser picked." };

function buildItems(): QuizItem[] {
  const items: QuizItem[] = [];
  const rows = versusIndex();
  for (let k = 0; k < rows.length; k += 2) {
    const g = versusGame(rows[k].slug);
    const revealed: Record<string, Role> = {};
    let taken = 0;
    for (const t of g.turns) {
      const ok = t.clue && t.number && t.number >= 2 && t.number <= 4 && t.picks.length > 0 && (t.ownLeft ?? 0) > t.number;
      if (ok && taken < 2 && (t.n === 1 || t.n === 3 || t.n === 4 || t.n === 6)) {
        items.push({ slug: g.slug, seed: g.seed, words: g.words, key: g.key, revealed: { ...revealed }, team: t.team,
          spymaster: t.team === "red" ? g.red : g.blue, guesser: t.team === "red" ? g.red : g.blue, clue: t.clue!, number: t.number!, modelPicks: t.picks });
        taken++;
      }
      t.picks.forEach(p => { revealed[p.w] = p.r; });
    }
  }
  return items;
}

export default function Play() {
  const items = buildItems();
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <div className="kicker">{items.length} real clues from the tournament</div>
      <h1>Can you out-guess a model?</h1>
      <p className="lede">
        Each round shows a clue a model actually gave, on the board as its guesser saw it. Pick your words, then see what the
        model&apos;s own guesser chose in the real game.
      </p>
      <Quiz items={items} />
    </div>
  );
}
