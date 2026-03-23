import Head from "next/head";
import Header from "../components/Header";

export default function ReportsPage() {
  return (
    <>
      <Head>
        <title>Reports — TruthLens</title>
        <meta name="description" content="View your past fact-verification reports and analysis history." />
      </Head>
      <div className="grid-bg" />
      <Header />
      <main>
        <div className="hero" style={{ marginBottom: 32 }}>
          <div className="hero-badge">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span>Analysis History</span>
          </div>
          <h1>Your<br /><em>Reports</em></h1>
          <p>View past analyses, compare verdicts across sessions, and export your verification reports.</p>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Empty state */}
          <div className="empty-state" style={{ padding: "64px 20px" }}>
            <div className="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#00D4FF" strokeWidth="1.5" opacity=".5" />
                <line x1="7" y1="8" x2="17" y2="8" stroke="#00D4FF" strokeWidth="1.5" opacity=".3" />
                <line x1="7" y1="12" x2="14" y2="12" stroke="#00D4FF" strokeWidth="1.5" opacity=".3" />
                <line x1="7" y1="16" x2="11" y2="16" stroke="#00D4FF" strokeWidth="1.5" opacity=".3" />
              </svg>
            </div>
            <div className="empty-title">No Reports Yet</div>
            <div className="empty-sub">Run your first analysis to generate a report. All past verifications will appear here with full verdicts, evidence, and conflict data.</div>
            <a href="/" className="run-btn" style={{ display: "inline-flex", marginTop: 20, fontSize: 12, padding: "9px 20px", textDecoration: "none" }}>
              Start Analyzing <span style={{ marginLeft: 6 }}>→</span>
            </a>
          </div>

          {/* Feature preview cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 24 }}>
            {[
              { icon: "📊", title: "Full History", desc: "Every analysis stored with timestamps" },
              { icon: "📥", title: "Export PDF", desc: "Download reports as formatted PDFs" },
              { icon: "🔍", title: "Compare", desc: "Side-by-side verdict comparison" },
            ].map(f => (
              <div key={f.title} className="sb-card" style={{ textAlign: "center", padding: "20px 14px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 10, color: "rgba(232,244,255,.4)", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
