import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Fitted — Custom software for the AI era.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E0E10",
        }}
      >
        {/* Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="120"
          height="120"
        >
          <g
            fill="none"
            stroke="#D4734E"
            stroke-width="2"
            stroke-linejoin="round"
          >
            <path d="M16 2L30 2L30 16L26 16A3 3 0 0 0 20 16L16 16Z" />
            <path d="M2 16L16 16L16 20A3 3 0 0 0 16 26L16 30L2 30Z" />
            <path d="M16 16L20 16A3 3 0 0 1 26 16L30 16L30 30L16 30L16 26A3 3 0 0 1 16 20Z" />
          </g>
        </svg>
        {/* Title */}
        <div
          style={{
            marginTop: 40,
            fontSize: 64,
            fontWeight: 400,
            color: "#F5F0EB",
            letterSpacing: "-0.02em",
          }}
        >
          fitted.
        </div>
        {/* Tagline */}
        <div
          style={{
            marginTop: 12,
            fontSize: 24,
            color: "rgba(245,240,235,0.5)",
          }}
        >
          Custom software for the AI era.
        </div>
      </div>
    ),
    { ...size }
  );
}
