// =============================================================================
// app/opengraph-image.tsx — Root OG Image (Next.js ImageResponse)
// Generates a 1200×630 OG image for the home page using Vercel's
// @vercel/og / next/og ImageResponse API.
// Each page can have its own opengraph-image.tsx alongside the page.tsx.
// =============================================================================

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt     = "Isaac Paha — Technologist, Entrepreneur & Thinker";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background:  "#08080f",
          width:       "100%",
          height:      "100%",
          display:     "flex",
          flexDirection:"column",
          justifyContent:"center",
          padding:     "80px",
          fontFamily:  "system-ui, sans-serif",
          position:    "relative",
          overflow:    "hidden",
        }}
      >
        {/* ── Grid ── */}
        <div style={{
          position:  "absolute",
          inset:     0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

        {/* ── Amber orb ── */}
        <div style={{
          position: "absolute",
          top:      -120, right: -80,
          width:    560, height: 560,
          background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 65%)",
          filter:   "blur(60px)",
          borderRadius: "50%",
        }} />

        {/* ── Top hairline ── */}
        <div style={{
          position:   "absolute",
          top:        0, left: 0, right: 0,
          height:     3,
          background: "linear-gradient(90deg, transparent, #f59e0b 30%, rgba(245,158,11,0.5) 100%)",
        }} />

        {/* ── Content ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>

          {/* Eyebrow */}
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            marginBottom: 8,
          }}>
            <div style={{
              width:  8, height: 8, borderRadius: "50%",
              background: "#f59e0b",
              boxShadow: "0 0 12px #f59e0b",
            }} />
            <span style={{
              fontSize:      13,
              fontWeight:    700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color:         "#f59e0b",
            }}>
              isaacpaha.com
            </span>
          </div>

          {/* Headline */}
          <div style={{
            fontSize:      72,
            fontWeight:    900,
            lineHeight:    0.9,
            letterSpacing: "-0.04em",
            color:         "rgba(255,255,255,0.92)",
          }}>
            Isaac Paha
          </div>
          <div style={{
            fontSize:      36,
            fontWeight:    700,
            color:         "#f59e0b",
            letterSpacing: "-0.02em",
            fontStyle:     "italic",
          }}>
            Technologist, Entrepreneur & Builder
          </div>

          {/* Tags */}
          <div style={{
            display:   "flex",
            gap:       10,
            marginTop: 20,
          }}>
            {["iPaha Ltd", "UK & Africa", "AI Products", "30+ Tools", "30 Games"].map(tag => (
              <div key={tag} style={{
                padding:      "6px 16px",
                borderRadius: 4,
                background:   "rgba(245,158,11,0.12)",
                border:       "1px solid rgba(245,158,11,0.28)",
                color:        "rgba(255,255,255,0.7)",
                fontSize:     13,
                fontWeight:   600,
              }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}