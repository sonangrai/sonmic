import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// The preview shown when a sonmic link is shared (chat apps, social sites, search).
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
          padding: "0 96px",
          background: "linear-gradient(135deg, #2a0d5c 0%, #0d0b12 70%)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "linear-gradient(135deg, #8b4dff, #5d1fb8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Same shape as MusicIcon in app/components/icons.tsx. */}
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M8 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" fill="#fff" />
              <circle cx="18" cy="16" r="3" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
        </div>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ fontSize: 30, color: "#c8b8e8" }}>
          A private, installable music app for families.
        </div>
      </div>
    ),
    size,
  );
}
