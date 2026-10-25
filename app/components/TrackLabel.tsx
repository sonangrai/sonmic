import type { CSSProperties, ReactNode } from "react";
import { Text } from "sonahang-ui";
import "./track-label.css";

// Tracks without a thumbnail get a stable gradient derived from the title.
function coverStyle(seed: string): CSSProperties {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 50) % 360} 70% 35%))`,
  };
}

/** Cover (thumbnail, else a gradient), title (accent when active), and an optional second line. */
export function TrackLabel({
  title,
  cover,
  active = false,
  subtitle,
}: {
  title: string;
  /** Object URL of the track's thumbnail. */
  cover?: string;
  active?: boolean;
  subtitle?: ReactNode;
}) {
  return (
    <span className="track-label">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local object URL; nothing to optimize
        <img className="cover cover-sm" src={cover} alt="" />
      ) : (
        <span className="cover cover-sm" style={coverStyle(title)} aria-hidden />
      )}
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
