import Head from "next/head";
import Header from "../components/Header";

const API_ENDPOINTS = [
  { method: "POST", path: "/extract", desc: "Extract claims from text or URL", badge: "Core" },
  { method: "POST", path: "/verify", desc: "Full pipeline — extract + verify (blocking)", badge: "Core" },
  { method: "POST", path: "/stream", desc: "SSE streaming full pipeline with real-time results", badge: "Recommended" },
  { method: "POST", path: "/detect", desc: "AI-generated text detection only", badge: "Detection" },
  { method: "POST", path: "/detect-text", desc: "Enhanced AI text detection with perplexity + LLM", badge: "Detection" },
  { method: "POST", path: "/detect-media", desc: "AI-generated media detection (images, audio)", badge: "Detection" },
  { method: "POST", path: "/full-report", desc: "Complete pipeline: extract + verify + conflicts + AI", badge: "Complete" },
  { method: "GET", path: "/health", desc: "Health check endpoint", badge: "Meta" },
];

const methodColor: Record<string, string> = {
  POST: "#FFB800",
  GET: "#00FF88",
};

export default function DocsPage() {
  return (
    <>
      <Head>
        <title>Documentation — TruthLens</title>
        <meta name="description" content="API documentation for the TruthLens fact verification engine." />
      </Head>
      <div className="grid-bg" />
      <Header />
      <main>
        <div className="hero" style={{ marginBottom: 32 }}>
          <div className="hero-badge">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span>API Reference</span>
          </div>
          <h1>API<br /><em>Documentation</em></h1>
          <p>Integrate TruthLens into your workflow via our RESTful API. SSE streaming support for real-time results.</p>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Quick Start */}
          <div className="sb-label">Quick Start</div>
          <div className="sb-card" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "rgba(232,244,255,.6)", lineHeight: 1.7, marginBottom: 14 }}>
              Send a POST request with either a <code style={{ background: "rgba(0,212,255,.1)", padding: "2px 6px", borderRadius: 3, color: "#00D4FF", fontSize: 11 }}>url</code> or <code style={{ background: "rgba(0,212,255,.1)", padding: "2px 6px", borderRadius: 3, color: "#00D4FF", fontSize: 11 }}>text</code> field:
            </div>
            <div style={{
              background: "#070D18", borderRadius: 8, padding: "14px 16px",
              fontFamily: "'Courier New', monospace", fontSize: 11, color: "rgba(232,244,255,.7)",
              lineHeight: 1.8, border: "1px solid rgba(0,212,255,.1)", overflow: "auto",
            }}>
              <span style={{ color: "#00FF88" }}>curl</span> -X POST http://localhost:8000/stream \<br />
              {"  "}-H <span style={{ color: "#FFB800" }}>&quot;Content-Type: application/json&quot;</span> \<br />
              {"  "}-d <span style={{ color: "#FFB800" }}>&apos;{`{"text": "The Eiffel Tower is in London."}`}&apos;</span>
            </div>
          </div>

          {/* Architecture */}
          <div className="sb-label">5-Stage Pipeline</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {["1. Claim Extraction", "2. Evidence Retrieval", "3. NLI Verification", "4. Conflict Detection", "5. AI Content Check"].map((s, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 140, padding: "12px 14px", background: "#0A1220",
                border: "1px solid rgba(0,212,255,.15)", borderRadius: 10, textAlign: "center",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#00D4FF", marginBottom: 4 }}>{s.split(". ")[0]}.</div>
                <div style={{ fontSize: 10, color: "rgba(232,244,255,.5)" }}>{s.split(". ")[1]}</div>
              </div>
            ))}
          </div>

          {/* API Endpoints */}
          <div className="sb-label">API Endpoints</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {API_ENDPOINTS.map((ep, i) => (
              <div key={i} className="claim-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="claim-body" style={{ padding: "12px 16px 12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontFamily: "'Courier New', monospace", fontSize: 10, fontWeight: 700,
                      padding: "3px 8px", borderRadius: 4, minWidth: 38, textAlign: "center",
                      background: `${methodColor[ep.method]}15`, color: methodColor[ep.method],
                      border: `1px solid ${methodColor[ep.method]}35`,
                    }}>
                      {ep.method}
                    </span>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 600, color: "#E8F4FF" }}>
                      {ep.path}
                    </span>
                    <span style={{
                      marginLeft: "auto", fontSize: 8, padding: "2px 7px", borderRadius: 3,
                      background: "rgba(0,212,255,.06)", border: "1px solid rgba(0,212,255,.15)",
                      color: "rgba(0,212,255,.5)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600,
                    }}>
                      {ep.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(232,244,255,.4)", marginTop: 6, paddingLeft: 48 }}>
                    {ep.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SSE Events */}
          <div className="sb-label">SSE Stream Events</div>
          <div className="sb-card">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { event: "stage", desc: "Pipeline stage change", example: '{ stage, message }' },
                { event: "claims", desc: "Extracted claims list", example: '{ article, claims[] }' },
                { event: "verdict", desc: "Individual claim verdict", example: '{ verdict: ClaimVerdict }' },
                { event: "conflict", desc: "Conflict detection result", example: '{ conflict: ConflictInfo }' },
                { event: "ai", desc: "AI content detection", example: '{ detection: AIDetection }' },
                { event: "done", desc: "Pipeline complete", example: '{ meta }' },
                { event: "error", desc: "Error occurred", example: '{ detail }' },
              ].map(e => (
                <div key={e.event} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "8px 10px",
                  background: "#070D18", borderRadius: 6, border: "1px solid rgba(0,212,255,.06)",
                }}>
                  <code style={{
                    fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700,
                    color: "#00D4FF", minWidth: 70,
                  }}>
                    {e.event}
                  </code>
                  <span style={{ fontSize: 11, color: "rgba(232,244,255,.5)", flex: 1 }}>{e.desc}</span>
                  <code style={{
                    fontFamily: "'Courier New', monospace", fontSize: 9,
                    color: "rgba(232,244,255,.3)", background: "rgba(0,212,255,.04)",
                    padding: "2px 6px", borderRadius: 3,
                  }}>
                    {e.example}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Swagger link */}
          <div style={{ textAlign: "center", marginTop: 28, marginBottom: 20 }}>
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="run-btn"
              style={{ display: "inline-flex", textDecoration: "none", fontSize: 12, padding: "9px 20px" }}>
              Open Interactive Swagger Docs <span style={{ marginLeft: 6 }}>↗</span>
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
