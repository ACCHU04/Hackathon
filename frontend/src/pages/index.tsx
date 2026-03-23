import { useEffect } from "react";
import Head from "next/head";

export default function Home() {
  useEffect(() => {
    // Redirect to the standalone TruthLens UI
    window.location.href = "/truthlens.html";
  }, []);

  return (
    <>
      <Head>
        <title>TruthLens — AI-Powered Fact Verification</title>
        <meta name="description" content="Every claim. Verified." />
      </Head>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "'Space Grotesk', sans-serif",
        color: "#00D4FF",
        fontSize: 14,
      }}>
        Loading TruthLens…
      </div>
    </>
  );
}
