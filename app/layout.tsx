import type { Metadata, Viewport } from "next";
import "sonahang-ui/style.css";
import "./globals.css";
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
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
