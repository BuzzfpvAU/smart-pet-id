import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tagz.au — Smart QR & NFC Tags for Pets, Keys & Luggage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#fbbf24",
            marginBottom: 16,
            letterSpacing: "-2px",
          }}
        >
          Tagz.au
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#ffffff",
            textAlign: "center",
            marginBottom: 24,
            maxWidth: 800,
          }}
        >
          Smart QR & NFC Tags for Pets, Keys & Luggage
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Scan alerts with GPS location. No subscription fees. Australian made.
        </div>
      </div>
    ),
    { ...size }
  );
}
