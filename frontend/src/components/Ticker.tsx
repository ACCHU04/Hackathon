export default function Ticker() {
  const items = [
    "VERITAS AI · CLAIM INTELLIGENCE PLATFORM",
    "GPT-4o POWERED EXTRACTION",
    "REAL-TIME FACT VERIFICATION",
    "SERPAPI EVIDENCE RETRIEVAL",
    "NLI VERDICT CLASSIFICATION",
    "TRUE · FALSE · PARTIAL · UNVERIFIABLE",
  ];
  const repeated = [...items, ...items];

  return (
    <div style={{
      background: "var(--amber)",
      overflow: "hidden",
      whiteSpace: "nowrap",
      height: 34,
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid rgba(10,46,26,0.2)",
    }}>
      <div style={{
        display: "inline-flex",
        gap: 0,
        animation: "ticker 28s linear infinite",
      }}>
        {repeated.map((t, i) => (
          <span key={i} style={{
            fontFamily: "'Syne Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "var(--ink)",
            padding: "0 32px",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 7, opacity: 0.5 }}>◆</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
