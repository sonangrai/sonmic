import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "sonmic",
    short_name: "sonmic",
    description: "Save YouTube audio in your browser and play it offline.",
    id: "/",
    start_url: "/player",
    scope: "/",
    display: "standalone",
    background_color: "#7429e0",
    theme_color: "#7429e0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
