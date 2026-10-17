import type { Metadata, Viewport } from "next";
import "sonahang-ui/style.css";
import "./globals.css";
import { themeInitScript } from "@/lib/theme";
import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "sonmic",
  description: "Save YouTube audio in your browser and play it offline.",
  applicationName: "sonmic",
  appleWebApp: {
    capable: true,
    title: "sonmic",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#7429e0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets data-theme before React hydrates, hence the warning suppression.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
