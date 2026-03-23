type Stage = "idle" | "extracting" | "searching" | "verifying" | "done" | "error";

type Step = {
  id: Stage;
  label: string;
  description: string;
  enabled: boolean;
};

const STEPS: Step[] = [
  {
    id: "extracting",
    label: "Extracting Claims",
    description: "Parsing article and identifying atomic verifiable statements via LLM.",
    enabled: true,
  },
  {
    id: "searching",
    label: "Searching Evidence",
    description: "Formulating queries and retrieving corroborating sources from the web.",
    enabled: false,
  },
  {
    id: "verifying",
    label: "Verifying Claims",
    description: "Cross-referencing claims against retrieved evidence using NLI model.",
    enabled: false,
  },
];

const STAGE_INDEX: Record<string, number> = {
  extracting: 0,
  searching: 1,
  verifying: 2,
  done: 3,
};

export default function StreamLog({ stage }: { stage: Stage }) {
  const currentIndex = STAGE_INDEX[stage] ?? -1;

  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 10,
      padding: "18px 20px",
      marginBottom: 28,
    }}>
      <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Pipeline
      </p>

      <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
        {STEPS.map((step, i) => {
          const isDone = currentIndex > i;
          const isActive = currentIndex === i;
          const isDisabled = !step.enabled && !isDone && !isActive;

          return (
            <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              {/* Step node */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  border: `2px solid ${isDone ? "#6366f1" : isActive ? "#8b5cf6" : "#334155"}`,
                  background: isDone ? "#6366f1" : isActive ? "#1e1b4b" : "#0f1117",
                  color: isDone ? "#fff" : isActive ? "#a5b4fc" : "#334155",
                  transition: "all 0.3s",
                  position: "relative",
                }}>
                  {isDone ? "✓" : isActive ? (
                    <span style={{ animation: "pulse 1s infinite" }}>◉</span>
                  ) : (
                    <span style={{ fontSize: 12 }}>{i + 1}</span>
                  )}
                </div>

                <span style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDone ? "#818cf8" : isActive ? "#a5b4fc" : "#334155",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}>
                  {step.label}
                </span>

                {isDisabled && (
                  <span style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>coming soon</span>
                )}
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  height: 2,
                  width: 40,
                  background: isDone ? "#6366f1" : "#1e293b",
                  borderTop: `2px ${isDone ? "solid" : "dashed"} ${isDone ? "#6366f1" : "#334155"}`,
                  marginBottom: 22,
                  transition: "all 0.3s",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage description */}
      {stage !== "done" && stage !== "error" && stage !== "idle" && (
        <div style={{
          marginTop: 14,
          padding: "8px 12px",
          background: "#0f1117",
          borderRadius: 6,
          fontSize: 12,
          color: "#94a3b8",
          borderLeft: "3px solid #6366f1",
        }}>
          {STEPS.find((s) => s.id === stage)?.description}
        </div>
      )}

      {stage === "done" && (
        <div style={{
          marginTop: 14,
          padding: "8px 12px",
          background: "#052e16",
          borderRadius: 6,
          fontSize: 12,
          color: "#4ade80",
          borderLeft: "3px solid #22c55e",
        }}>
          ✅ Claim extraction complete. Evidence retrieval and verification coming soon.
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
