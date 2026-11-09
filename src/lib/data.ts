import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { BenchGame, BenchIndexRow, VersusGame, VersusIndexRow } from "./types";

const DATA = path.join(process.cwd(), "data");
const read = <T,>(...p: string[]): T => JSON.parse(readFileSync(path.join(DATA, ...p), "utf-8"));

export const versusIndex = () => read<VersusIndexRow[]>("versus", "index.json");
export const benchIndex = () => read<BenchIndexRow[]>("bench", "index.json");
export const versusGame = (slug: string) => read<VersusGame>("versus", "games", `${slug}.json`);
export const benchGame = (slug: string) => read<BenchGame>("bench", "games", `${slug}.json`);
export const versusSlugs = () => readdirSync(path.join(DATA, "versus", "games")).map(f => f.replace(/\.json$/, ""));
export const benchSlugs = () => readdirSync(path.join(DATA, "bench", "games")).map(f => f.replace(/\.json$/, ""));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Stats = any;
export const stats = (): Stats => read("stats.json");
