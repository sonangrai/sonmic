import type { CSSProperties, ReactNode } from "react";
import { Text } from "sonahang-ui";
import "./track-label.css";

// No artwork comes with the audio, so derive a stable gradient from the title.
function coverStyle(seed: string): CSSProperties {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 50) % 360} 70% 35%))`,
  };
}

/** Gradient cover, title (accent when active), and an optional second line. */
export function TrackLabel({
  title,
  active = false,
  subtitle,
}: {
  title: string;
  active?: boolean;
  subtitle?: ReactNode;
}) {
  return (
    <span className="track-label">
      <span className="cover cover-sm" style={coverStyle(title)} aria-hidden />
      <span className="track-label-text">
        <Text
          as="span"
          variant="body-sm"
          weight="medium"
          color={active ? "accent" : "default"}
          className="truncate"
        >
          {title}
        </Text>
        {subtitle && (
          <Text as="span" variant="caption" color="subtle">
            {subtitle}
          </Text>
        )}
      </span>
    </span>
  );
}
