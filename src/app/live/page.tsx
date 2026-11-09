import type { Metadata } from "next";
import { LiveGameClient as LiveGame } from "@/components/ClientOnly";

export const metadata: Metadata = { title: "Live game", description: "Run a new two-team Codenames game between Claude and GPT models, or take a seat yourself, with your own API keys." };

export default function Live() {
  return (
    <div className="wrap" style={{ paddingTop: 40 }}>
      <div className="kicker">Bring your own keys</div>
      <h1>Run a live game</h1>
      <p className="lede">
        Pick a model for each seat, or sit in one yourself, and watch a new game play out. The referee, the rules and the prompts are the
        same ones the tournament used, running in your browser.
      </p>
      <div className="callout small">
        Live games call the providers&apos; APIs directly. The tournament ran through the Claude Code and Codex command-line tools, which add their own
        system prompts, so live play is a fair game but not an exact rerun of the benchmark. Claude seats have server-side refusal fallback turned on;
        if a model ever declines and another serves the reply, the call log says so.
      </div>
      <LiveGame />
    </div>
  );
}
