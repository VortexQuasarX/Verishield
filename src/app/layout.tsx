import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeriShield - AI-Powered Background Verification Platform",
  description: "Enterprise-grade employee background verification and recruitment workflow platform with AI-driven verification and blockchain-secured audit trails.",
  keywords: ["VeriShield", "Background Verification", "Employee Screening", "AI Verification", "Enterprise SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
