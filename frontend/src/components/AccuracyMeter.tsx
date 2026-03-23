type Props = { total: number; trueCount: number; falseCount: number; partialCount: number };

export default function AccuracyMeter({ total, trueCount, falseCount, partialCount }: Props) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.round((trueCount / total) * 100) : 0;

  const slices = total > 0 ? [
    { val: trueCount,   color: "#2DC653" },
    { val: partialCount, color: "#F5A623" },
    { val: falseCount,  color: "#E63946" },
    { val: total - trueCount - falseCount - partialCount, color: "rgba(245,240,227,0.1)" },
  ] : [{ val: 1, color: "rgba(245,240,227,0.08)" }];

  let offset = 0;
  const arcs = slices.map((s) => {
    const len = total > 0 ? (s.val / total) * circ : circ;
    const arc = { offset, len, color: s.color };
    offset += len;
    return arc;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 130, height: 130 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
          {arcs.map((a, i) => (
            <circle key={i}
              cx="65" cy="65" r={r}
              fill="none"
              stroke={a.color}
              strokeWidth="10"
              strokeDasharray={`${a.len} ${circ - a.len}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1, color: "var(--cream)" }}>
            {pct}<span style={{ fontSize: 14 }}>%</span>
          </span>
          <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,240,227,0.4)", marginTop: 2 }}>accurate</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { label: "True",    n: trueCount,   c: "#2DC653" },
          { label: "False",   n: falseCount,  c: "#E63946" },
          { label: "Partial", n: partialCount, c: "#F5A623" },
        ].map(({ label, n, c }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(245,240,227,0.55)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }} />
            {n} {label}
          </div>
        ))}
      </div>
    </div>
  );
}
