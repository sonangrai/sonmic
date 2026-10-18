import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only the homepage should appear in search. The app pages carry a noindex tag
// (privatePageMetadata) instead of being blocked here: a crawler blocked by robots.txt
// never sees that tag, and may list the bare URL anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
