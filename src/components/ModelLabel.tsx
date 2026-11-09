import { MODELS } from "@/lib/models";

export default function ModelLabel({ k, bold = false }: { k: string | null | undefined; bold?: boolean }) {
  if (!k) return <span>Nobody</span>;
  const m = MODELS[k];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontWeight: bold ? 600 : undefined }}>
      <span className="dot" style={{ background: m?.color ?? "var(--text-muted)" }} />
      {m?.name ?? k}
    </span>
  );
}
