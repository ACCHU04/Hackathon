type Claim = {
  id: string;
  text: string;
  original_span: [number, number];
};

type Props = {
  claims: Claim[];
};

const VERDICT_PLACEHOLDER = "Pending verification";
const CONFIDENCE_PLACEHOLDER = "—";

export default function ClaimList({ claims }: Props) {
  if (!claims.length) {
    return (
      <div style={{ color: "#64748b", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
        No verifiable claims extracted.
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Extracted Claims ({claims.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {claims.map((claim, idx) => (
          <ClaimCard key={claim.id} claim={claim} index={idx} />
        ))}
      </div>
    </div>
  );
}

function ClaimCard({ claim, index }: { claim: Claim; index: number }) {
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "16px 18px",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{
          background: "#334155",
          color: "#94a3b8",
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "monospace",
        }}>
          {claim.id.toUpperCase()}
        </span>

        {/* Verdict badge (stub) */}
        <span style={{
          background: "#1c1917",
          color: "#a8a29e",
          padding: "2px 10px",
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 600,
          border: "1px solid #292524",
        }}>
          ⏳ {VERDICT_PLACEHOLDER}
        </span>
      </div>

      {/* Claim text */}
      <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.65, color: "#e2e8f0" }}>
        {claim.text}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#475569" }}>
        <span>
          Span: [{claim.original_span[0]}, {claim.original_span[1]}]
        </span>
        <span>Confidence: {CONFIDENCE_PLACEHOLDER}</span>
        <span>Sources: —</span>
      </div>
    </div>
  );
}
