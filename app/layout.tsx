import "./globals.css";

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

import { SessionProvider } from "@/components/providers/session-provider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Travel Voice",
    template: "Travel Voice: %s",
  },
  description: "AI-powered voice assistant platform",
};

import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hubspotUrl = process.env.NEXT_PUBLIC_HUBSPOT_SCRIPT_URL || process.env.REACT_APP_HUBSPOT_SCRIPT_URL;
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} font-sans antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
        <SpeedInsights />
        <Analytics />
        {hubspotUrl && (
          <Script
            id="hs-script-loader"
            src={hubspotUrl?.startsWith('http')
              ? hubspotUrl
              : `https:${hubspotUrl}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
