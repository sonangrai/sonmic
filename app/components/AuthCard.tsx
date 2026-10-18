import type { ReactNode } from "react";
import { Text } from "sonahang-ui";
import { MusicIcon } from "./icons";
import "./auth-card.css";

/** Centered card shared by the first-launch setup and login screens. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <span className="auth-logo" aria-hidden>
          <MusicIcon />
        </span>
        <div className="auth-intro">
          <Text as="h1" variant="heading-2">
            {title}
          </Text>
          <Text variant="body-sm" color="subtle">
            {subtitle}
          </Text>
        </div>
        {children}
      </div>
    </main>
  );
}
