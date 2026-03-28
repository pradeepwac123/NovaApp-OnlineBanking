import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "NovaPay - Digital Banking for Every Indian",
  description: "South India's digital-first bank. Instant transfers, zero fees, KYC in minutes.",
  manifest: "/manifest.json",
  themeColor: "#6C3CE1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
