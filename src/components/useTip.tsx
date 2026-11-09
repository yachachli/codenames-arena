"use client";
import { useCallback, useState } from "react";

/** Minimal hover tooltip: spread `bind(html)` on any element, render `node` once. */
export function useTip() {
  const [tip, setTip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  const bind = useCallback((content: React.ReactNode) => ({
    onMouseMove: (e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY, content }),
    onMouseLeave: () => setTip(null),
  }), []);
  const node = tip ? (
    <div className="tip" style={{ left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 330), top: tip.y + 14 }}>
      {tip.content}
    </div>
  ) : null;
  return { bind, node };
}
