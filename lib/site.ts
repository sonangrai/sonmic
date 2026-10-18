import type { Metadata } from "next";

export const SITE_NAME = "sonmic";
export const SITE_TAGLINE = "Save YouTube audio for offline listening";
export const SITE_DESCRIPTION =
  "sonmic saves the audio from YouTube links to your own devices so you can listen offline. A private, installable music app for families, running on your own computer.";

/**
 * Absolute site address for canonical links and the sitemap. Set NEXT_PUBLIC_SITE_URL
 * for a custom domain; on Vercel it falls back to the production domain, locally to :3000.
 */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

/** In-app pages are private and gated by login, so keep them out of search results. */
export function privatePageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}
