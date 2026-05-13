import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { LanguageProvider } from "@/lib/LanguageContext";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Tender Copilot — MSME Tender Intelligence",
  description: "AI-powered government tender analysis for MSMEs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="min-h-full antialiased"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
