"use client";
import dynamic from "next/dynamic";

/** These read browser-only state (localStorage, Math.random) on first render, so they skip server rendering. */
export const LiveGameClient = dynamic(() => import("./LiveGame"), { ssr: false, loading: () => <p className="muted">Loading the game…</p> });
export const QuizClient = dynamic(() => import("./Quiz"), { ssr: false, loading: () => <p className="muted">Loading clues…</p> });
