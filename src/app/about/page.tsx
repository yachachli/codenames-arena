import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How it works", description: "Rules, referee, prompts, models and caveats behind Codenames Arena." };

export default function About() {
  return (
    <div className="wrap narrow" style={{ paddingTop: 40 }}>
      <div className="kicker">Method</div>
      <h1>How it works</h1>

      <h2>The game</h2>
      <p>Codenames is played on a 5 by 5 grid of words. Each team&apos;s spymaster sees a secret key of which words belong to which team and gives
        one-word clues with a number, like OCEAN 3. The guesser reveals words one at a time and may keep going after each correct pick, up to the number plus one.
        A neutral word or the other team&apos;s word ends the turn, and the assassin loses the game on the spot.</p>
      <p>Boards use the retail split: nine words for the team that moves first, eight for the other, seven neutral words and one assassin. Boards are
        generated from integer seeds with the same code as Stephenson et al. (2025), so board 0 matches their published logs exactly.</p>

      <h2>Two experiments</h2>
      <p><Link href="/benchmark">The benchmark</Link> is single-team play: one model gives clues, another guesses, on 50 shared boards, for every pairing.
        The score is turns to find all nine words, with any loss scored as 25. It asks whether models understand each other, and whether a model understands itself best.</p>
      <p><Link href="/tournament">The tournament</Link> is real two-team play. Each model plays both roles for its team, and every pair meets on 25 boards
        in both colours. It asks whether the race changes how models play, especially when they fall far behind.</p>

      <h2>The referee</h2>
      <p>Plain code decides everything; no model ever judges another. A clue must be one dictionary word and may not be a board word, a form of one,
        or a compound with one. The checks use stems, irregular plurals and word parts, not raw substrings, so EDUCATION is allowed next to CAT.
        An invalid clue or guess is sent back with the referee&apos;s message, up to ten times, before the turn is forfeited. Every attempt is logged, and replays
        show rejected clues struck through.</p>

      <h2>The prompts</h2>
      <p>The tournament prompt states the rules, both teams&apos; words left, and the full history of clues and reveals. It never gives strategic advice, so whether
        to take a risk is the model&apos;s own call. Spymasters answer with a JSON clue and number; guessers answer one guess at a time or stop. The benchmark used
        the shorter prompt of Stephenson et al., without history.</p>

      <h2>The models</h2>
      <p>Benchmark and tournament games ran through the Claude Code and Codex command-line tools at their default settings, with tools, memory and web access
        turned off, from an empty folder. GPT-6.1 Sol and GPT-5.6 Sol ran at medium reasoning effort. The GloVe baseline picks clues by word-vector similarity.</p>

      <h2>Caveats</h2>
      <ul>
        <li>Long-shot moments are rare for strong teams, so per-model pressure figures for Opus, Astra and Sol rest on 5 to 10 clues each.</li>
        <li>The pressure comparison holds the model and its words left fixed, but not the board. A team far behind may also be stuck on a hard board.</li>
        <li>The prompt shows the score every turn, so it can&apos;t separate reasoning about the race from reacting to the words &quot;1 word left&quot;.</li>
        <li>The command-line tools add their own system prompts, so results may differ slightly from calling the same models through their APIs.</li>
      </ul>

      <h2>Prior work</h2>
      <p>Stephenson et al. (2025) introduced the single-team protocol and seeds used here and reported two-team results. The Codenames AI Competition
        (Kim et al., 2019) set the original word-vector baselines.</p>
    </div>
  );
}
