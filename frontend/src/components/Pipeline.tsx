type Stage = "idle" | "extracting" | "done" | "error";

const STEPS = [
  { id: "extracting", label: "Claim Extraction",     sub: "GPT-4o · JSON output",        n: "01" },
  { id: "searching",  label: "Evidence Retrieval",   sub: "SerpAPI · top 5 per claim",   n: "02" },
  { id: "verifying",  label: "NLI Verification",     sub: "DeBERTa-v3 + LLM",            n: "03" },
];

export default function Pipeline({ stage, runtimeMs, claimsCount }: {
  stage: Stage; runtimeMs?: number; claimsCount?: number;
}) {
  const doneIdx = stage === "done" ? 0 : stage === "extracting" ? 0 : -1;

  return (
    <div style={{
      border: "1px solid rgba(245,240,227,0.1)",
      borderRadius: 16,
      overflow: "hidden",
      background: "rgba(245,240,227,0.03)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid rgba(245,240,227,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,240,227,0.35)", fontWeight: 500 }}>
          Pipeline Status
        </span>
        {stage === "done" && (
          <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: 11, color: "var(--amber)" }}>
            {claimsCount} claims · {runtimeMs}ms
          </span>
        )}
        {stage === "extracting" && (
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--amber)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", display: "inline-block", animation: "pulse 1s ease-in-out infinite" }} />
            Processing…
          </span>
        )}
      </div>

      {/* Steps */}
      {STEPS.map((step, i) => {
        const isDone    = stage === "done" && i <= doneIdx;
        const isActive  = stage === "extracting" && i === 0;
        const isWaiting = !isDone && !isActive;

        return (
          <div key={step.id} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "15px 20px",
            borderBottom: i < STEPS.length - 1 ? "1px solid rgba(245,240,227,0.06)" : "none",
            background: isActive ? "rgba(245,166,35,0.05)" : isDone ? "rgba(45,198,83,0.04)" : "transparent",
            transition: "background 0.4s",
          }}>
            {/* Node */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne Mono', monospace", fontSize: 11, fontWeight: 700,
              background: isDone  ? "rgba(45,198,83,0.15)"   :
                          isActive ? "rgba(245,166,35,0.15)"  : "rgba(245,240,227,0.04)",
              border: isDone  ? "1.5px solid rgba(45,198,83,0.5)"   :
                      isActive ? "1.5px solid rgba(245,166,35,0.5)"  :
                                 "1.5px dashed rgba(245,240,227,0.1)",
              color: isDone  ? "#2DC653"  :
                     isActive ? "#F5A623"  : "rgba(245,240,227,0.2)",
              boxShadow: isDone  ? "0 0 16px rgba(45,198,83,0.18)"   :
                         isActive ? "0 0 16px rgba(245,166,35,0.18)"  : "none",
              transition: "all 0.4s",
            }}>
              {isDone ? "✓" : isActive ? (
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>◌</span>
              ) : step.n}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: isWaiting ? "rgba(245,240,227,0.3)" : "var(--cream)" }}>
                {step.label}
              </div>
              <div style={{ fontSize: 11, color: "rgba(245,240,227,0.25)", marginTop: 2 }}>{step.sub}</div>
            </div>

            {/* Badge */}
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "4px 12px", borderRadius: 99,
              background: isDone  ? "rgba(45,198,83,0.1)"   :
                          isActive ? "rgba(245,166,35,0.1)"  : "rgba(245,240,227,0.05)",
              color: isDone  ? "#2DC653"  :
                     isActive ? "#F5A623"  : "rgba(245,240,227,0.2)",
              border: isDone  ? "1px solid rgba(45,198,83,0.25)"   :
                      isActive ? "1px solid rgba(245,166,35,0.25)"  :
                                 "1px dashed rgba(245,240,227,0.1)",
            }}>
              {isDone ? "Complete" : isActive ? "Running" : "Queued"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
