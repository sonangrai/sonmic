import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

// Shared frame: 24×24 grid, sized by `size` (defaults to the surrounding font size).
function Icon({ size = "1em", children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
    </Icon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon size={20} {...props}>
      <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon size={18} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <Icon size={20} {...props}>
      <path d="M4 3v18M9 3v18M14 4l6 16" />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon fill="currentColor" stroke="none" {...props}>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
    </Icon>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Icon fill="currentColor" stroke="none" {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </Icon>
  );
}

export function PlayPauseIcon({ playing, ...props }: IconProps & { playing: boolean }) {
  return playing ? <PauseIcon {...props} /> : <PlayIcon {...props} />;
}
