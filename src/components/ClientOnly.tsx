"use client";
import dynamic from "next/dynamic";

/** The quiz shuffles with Math.random on first render, so it skips server rendering. */
export const QuizClient = dynamic(() => import("./Quiz"), { ssr: false, loading: () => <p className="muted">Loading clues…</p> });
