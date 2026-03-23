import Head from "next/head";
import Header from "../components/Header";

const DEMOS = [
  {
    label: "Eiffel Tower — Location & History",
    text: "The Eiffel Tower is located in London and was built in 1950. It stands 330 metres tall and attracts over 7 million visitors annually. The tower was designed by Gustave Eiffel.",
    description: "Tests location, date, numeric, and attribution claims. Expect FALSE on location & date, TRUE on height, PARTIAL on designer.",
    badge: "MIXED",
    badgeBg: "rgba(255,184,0,.1)",
    badgeColor: "#FFB800",
    badgeBorder: "rgba(255,184,0,.3)",
  },
  {
    label: "JWST Facts — Space Science",
    text: "NASA's James Webb Space Telescope was launched on December 25, 2021 and cost approximately $10 billion to develop. It orbits the Sun at the L2 point, 1.5 million kilometres from Earth.",
    description: "Verifiable scientific claims — launch date, cost, orbital position. Expect mostly TRUE verdicts with high confidence.",
    badge: "TRUE",
    badgeBg: "rgba(0,255,136,.08)",
    badgeColor: "#00FF88",
    badgeBorder: "rgba(0,255,136,.3)",
  },
  {
    label: "US Economy — GDP & Employment",
    text: "The United States has the world's largest economy with a GDP of $25.46 trillion in 2022. The unemployment rate fell to 3.4% in early 2023, the lowest since 1969.",
    description: "Economic statistics that can be verified against official sources. Tests numeric accuracy and temporal fact-checking.",
    badge: "TRUE",
    badgeBg: "rgba(0,255,136,.08)",
    badgeColor: "#00FF88",
    badgeBorder: "rgba(0,255,136,.3)",
  },
  {
    label: "Health Misinformation",
    text: "Drinking bleach can cure COVID-19. Vaccines cause autism in 90% of children. The flu is more deadly than COVID-19 for all age groups.",
    description: "Blatant health misinformation — all claims should be flagged as FALSE with high confidence and strong contradictory evidence.",
    badge: "FALSE",
    badgeBg: "rgba(255,59,92,.08)",
    badgeColor: "#FF3B5C",
    badgeBorder: "rgba(255,59,92,.3)",
  },
  {
    label: "Conflicting Economic Claims",
    text: "China has the world's largest economy by GDP. The US dollar is the weakest major currency. Inflation in 2023 reached 15% in the United States.",
    description: "Economic claims with conflicting evidence — demonstrates the conflict detection and UNVERIFIABLE handling pipeline.",
    badge: "CONFLICT",
    badgeBg: "rgba(0,212,255,.08)",
    badgeColor: "#00D4FF",
    badgeBorder: "rgba(0,212,255,.3)",
  },
];

export default function DemoPage() {
  const handleRunDemo = (text: string) => {
    window.location.href = `/?demo=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <Head>
        <title>Demos — TruthLens</title>
        <meta name="description" content="Pre-configured demo scenarios for the TruthLens fact verification engine." />
      </Head>
      <div className="grid-bg" />
      <Header />
      <main>
        <div className="hero" style={{ marginBottom: 32 }}>
          <div className="hero-badge">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span>Pre-Configured Scenarios</span>
          </div>
          <h1>Demo<br /><em>Scenarios</em></h1>
          <p>Select a pre-configured demo to see TruthLens in action. Each scenario showcases different pipeline behaviors and verdict types.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720, margin: "0 auto" }}>
          {DEMOS.map((demo, i) => (
            <div key={i} className="claim-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="stripe" style={{ background: demo.badgeColor }} />
              <div className="claim-body">
                <div className="claim-top">
                  <div className="claim-meta-left">
                    <div className="claim-num">{String(i + 1).padStart(2, "0")}</div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{demo.label}</span>
                  </div>
                  <span className="stamp" style={{
                    background: demo.badgeBg, border: `1.5px solid ${demo.badgeBorder}`, color: demo.badgeColor,
                  }}>
                    {demo.badge}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(232,244,255,.45)", lineHeight: 1.65, marginBottom: 12 }}>
                  {demo.description}
                </div>
                <div style={{
                  fontSize: 12, color: "rgba(232,244,255,.65)", lineHeight: 1.7,
                  padding: "10px 12px", background: "rgba(0,212,255,.03)",
                  borderRadius: 8, borderLeft: "2px solid rgba(0,212,255,.15)", marginBottom: 14,
                  fontStyle: "italic",
                }}>
                  &quot;{demo.text}&quot;
                </div>
                <button onClick={() => handleRunDemo(demo.text)} className="run-btn" style={{ fontSize: 12, padding: "8px 18px" }}>
                  Run this demo <span style={{ marginLeft: 4 }}>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
