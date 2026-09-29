import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaaSForge",
  description: "Compose a production-ready SaaS starter from modular building blocks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
