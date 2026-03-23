import Link from "next/link";
import { useRouter } from "next/router";

const NAV_ITEMS = [
  { label: "Analyze", href: "/", icon: "zap" },
  { label: "Reports", href: "/reports", icon: "bar-chart-2" },
  { label: "Docs", href: "/docs", icon: "book-open" },
];

export default function Header() {
  const router = useRouter();

  return (
    <header style={{ position: "relative", zIndex: 10, background: "rgba(7,13,24,.96)", borderBottom: "1px solid var(--bdr2)" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,var(--cyan),transparent)", opacity: 0.3, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", padding: "11px 20px", gap: 10, flexWrap: "wrap" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(0,212,255,.12)", border: "1px solid var(--bdr2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 1, lineHeight: 1 }}>TruthLens</div>
            <div style={{ fontSize: 8, letterSpacing: ".15em", color: "var(--cyan2)", textTransform: "uppercase", marginTop: 1 }}>FACT · CLAIM · VERIFY</div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 2, marginLeft: 8 }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
              <button className={`tab ${router.pathname === item.href ? "on" : ""}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
        </nav>
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <div className="live-badge" style={{ padding: "4px 8px", background: "rgba(0,255,136,.1)", border: "1px solid rgba(0,255,136,.3)", borderRadius: 4, fontSize: 10, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot" style={{ width: 6, height: 6, background: "var(--green)", borderRadius: 3 }} />LIVE · GPT-4o
          </div>
        </div>
      </div>
    </header>
  );
}
