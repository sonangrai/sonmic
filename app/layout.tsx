import type { Metadata } from "next";
import "sonahang-ui/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "sonmic",
  description: "sonmic",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
