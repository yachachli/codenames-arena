# Codenames Arena

A website for an experiment in which language models play Codenames against each other.

- **Tournament:** 300 two-team games between Claude Opus 5.5, Claude Sonnet 5.5, GPT-6 Astra and GPT-6.1 Sol, with standings, head-to-head records and an analysis of how models play when they fall behind.
- **Benchmark:** 1,250 single-team cross-play games, every clue giver paired with every guesser on 50 shared boards.
- **Replays:** every game, turn by turn, including clues the referee rejected.
- **Play:** guess real model clues and compare yourself with the model's own guesser.
- **Live game:** run a new game in the browser with your own Anthropic or OpenAI API key, or take one seat yourself.

## Run it

```sh
npm install
npm run dev      # http://localhost:3000
npm test         # referee parity tests and simulated live games
npm run build
```

## Deploy

Import the repository in Vercel. It is a standard Next.js app with no environment variables or server secrets. The production URL for social cards is picked up from Vercel automatically; set `NEXT_PUBLIC_SITE_URL` to use a custom domain.

## Live games and API keys

Live games call `api.anthropic.com` and `api.openai.com` directly from the visitor's browser with the visitor's own keys. Nothing passes through this site's server. Keys live in memory, or in `localStorage` if the visitor ticks "Remember on this device". Claude calls have server-side refusal fallback enabled, and the call log shows which model served each reply.

## Data

`data/` and `public/live/` are generated from the benchmark harness, a separate Python project, by its `scripts/export_site.py`. Prompts, session ids and raw model text are not exported.

- `data/versus/` and `data/bench/`: one compact JSON file per game, plus an index.
- `data/stats.json`: the aggregates behind the charts.
- `public/live/boards.json`: seeded boards 0 to 99, identical to the benchmark's.
- `public/live/dictionary.txt`: the referee's dictionary.

## The referee

`src/lib/referee/` is a TypeScript port of the Python referee: the clue validator, a port of the Snowball 3.1 English stemmer, the two-team rules and the exact prompt text. `tests/referee.test.ts` checks it against the Python original on all 9,381 distinct clues proposed in the benchmark, and against the logged prompts character for character.
