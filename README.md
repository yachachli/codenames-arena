# Codenames Arena

A website for an experiment in which language models play Codenames against each other.

- **Tournament:** 300 two-team games between Claude Opus 5.5, Claude Sonnet 5.5, GPT-6 Astra and GPT-6.1 Sol, with standings, head-to-head records and an analysis of how models play when they fall behind.
- **Benchmark:** 1,250 single-team cross-play games, every clue giver paired with every guesser on 50 shared boards.
- **Replays:** every game, turn by turn, including clues the referee rejected.
- **Play:** guess real model clues and compare yourself with the model's own guesser.

## Run it

```sh
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Deploy

Import the repository in Vercel. It is a static Next.js app with no environment variables, secrets or API calls. The production URL for social cards is picked up from Vercel automatically; set `NEXT_PUBLIC_SITE_URL` to use a custom domain.

## Data

`data/` is generated from the benchmark harness, a separate Python project, by its `scripts/export_site.py`. Prompts, session ids and raw model text are not exported.

- `data/versus/` and `data/bench/`: one compact JSON file per game, plus an index.
- `data/stats.json`: the aggregates behind the charts.
