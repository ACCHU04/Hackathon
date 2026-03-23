export type Claim = { id: string; text: string; original_span: [number, number] };

type Verdict = "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "UNVERIFIABLE" | "PENDING";

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; border: string; bar: string }> = {
  TRUE:           { label: "True",         color: "#2DC653", bg: "rgba(45,198,83,0.08)",    border: "rgba(45,198,83,0.25)",    bar: "#2DC653" },
  FALSE:          { label: "False",        color: "#E63946", bg: "rgba(230,57,70,0.08)",    border: "rgba(230,57,70,0.25)",    bar: "#E63946" },
  PARTIALLY_TRUE: { label: "Partial",      color: "#F5A623", bg: "rgba(245,166,35,0.08)",   border: "rgba(245,166,35,0.25)",   bar: "#F5A623" },
  UNVERIFIABLE:   { label: "Unverifiable", color: "rgba(245,240,227,0.4)", bg: "rgba(245,240,227,0.04)", border: "rgba(245,240,227,0.12)", bar: "rgba(245,240,227,0.2)" },
  PENDING:        { label: "Pending",      color: "rgba(245,240,227,0.3)", bg: "rgba(245,240,227,0.03)", border: "rgba(245,240,227,0.08)", bar: "rgba(245,240,227,0.1)" },
};

type Props = { claim: Claim; index: number; verdict?: Verdict; confidence?: number };

export default function ClaimCard({ claim, index, verdict = "PENDING", confidence }: Props) {
  const vm = VERDICT_META[verdict];
  const pct = confidence != null ? Math.round(confidence * 100) : null;

  return (
    <div style={{
      position: "relative",
      background: "rgba(245,240,227,0.03)",
      border: "1px solid rgba(245,240,227,0.08)",
      borderRadius: 14,
      overflow: "hidden",
      animation: `rowSlide 0.5s ${0.55 + index * 0.1}s ease both`,
      transition: "border-color 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,240,227,0.18)"; (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,240,227,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)"; }}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: vm.bar, borderRadius: "4px 0 0 4px",
        opacity: verdict === "PENDING" ? 0.3 : 1,
      }} />

      <div style={{ paddingLeft: 20, paddingRight: 18, paddingTop: 16, paddingBottom: 14 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Index badge */}
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(245,240,227,0.06)",
              border: "1px solid rgba(245,240,227,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne Mono', monospace", fontSize: 11, color: "rgba(245,240,227,0.4)",
              flexShrink: 0,
            }}>
              {String(index + 1).padStart(2, "0")}
            </div>
          </div>

          {/* Verdict badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 99,
            background: vm.bg, border: `1px solid ${vm.border}`,
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: vm.color, flexShrink: 0,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: vm.color, display: "inline-block" }} />
            {vm.label}
          </div>
        </div>

        {/* Claim text */}
        <p style={{
          fontSize: 15, lineHeight: 1.7,
          color: "rgba(245,240,227,0.85)",
          fontWeight: 300, marginBottom: 14,
        }}>
          {claim.text}
        </p>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
          paddingTop: 12, borderTop: "1px solid rgba(245,240,227,0.06)",
        }}>
          <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: 10, color: "rgba(245,240,227,0.22)" }}>
            [{claim.original_span[0]}—{claim.original_span[1]}]
          </span>

          {pct != null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(245,240,227,0.25)" }}>conf</span>
              <div style={{ width: 64, height: 3, background: "rgba(245,240,227,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: vm.bar, borderRadius: 2, transition: "width 0.8s ease" }} />
              </div>
              <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: 10, color: vm.color, fontWeight: 700 }}>
                {(pct / 100).toFixed(2)}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(245,240,227,0.2)" }}>conf —</span>
          )}

          <span style={{
            marginLeft: "auto",
            fontSize: 10, color: "rgba(245,240,227,0.2)",
            background: "rgba(245,240,227,0.04)",
            border: "1px solid rgba(245,240,227,0.08)",
            borderRadius: 99, padding: "3px 10px",
          }}>
            sources —
          </span>
        </div>
      </div>
    </div>
  );
}
