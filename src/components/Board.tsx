"use client";
import type { Role } from "@/lib/types";

export default function Board({ words, keyRoles, revealed, showKey, highlight, selected, onPick, disabled }: {
  words: string[]; keyRoles?: Role[]; revealed: Map<string, Role> | Record<string, Role>; showKey?: boolean;
  highlight?: Set<string>; selected?: Set<string>; onPick?: (w: string) => void; disabled?: boolean;
}) {
  const get = (w: string) => (revealed instanceof Map ? revealed.get(w) : revealed[w]);
  return (
    <div className="board">
      {words.map((w, i) => {
        const r = get(w);
        const cls = "w" + (r ? ` r-${r}` : showKey && keyRoles ? ` key-${keyRoles[i]}` : "") +
          (highlight?.has(w) ? " now" : "") + (selected?.has(w) ? " sel" : "");
        return onPick ? (
          <button key={w} className={cls} disabled={disabled || !!r} onClick={() => onPick(w)} title={w}>{w}</button>
        ) : (
          <div key={w} className={cls} title={w}>{w}</div>
        );
      })}
    </div>
  );
}
