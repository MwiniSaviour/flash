import type { Metadata, Viewport } from "next";

import "@fontsource-variable/inter";
import "./globals.css";

import { CapacitorBackButton } from "@/components/CapacitorBackButton";
import { PushRegistrationBridge } from "@/components/flash/PushRegistrationBridge";
import { ToastProvider } from "@/components/flash/ToastProvider";
import { SessionProvider } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(getEnv().siteUrl),
  title: {
    default: "Flash — tickets, rides and food in one app",
    template: "%s · Flash",
  },
  description:
    "Flash books event tickets, rides and food in one place. Find what is on in Accra, get a ride to it, and have dinner waiting when you arrive.",
  applicationName: "Flash",
  appleWebApp: {
    capable: true,
    title: "Flash",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "Flash",
    title: "Flash — tickets, rides and food in one app",
    description:
      "Flash books event tickets, rides and food in one place. Find what is on in Accra, get a ride to it, and have dinner waiting when you arrive.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f5f1",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <SessionProvider>
          <ToastProvider>
            <PushRegistrationBridge />
            {children}
          </ToastProvider>
        </SessionProvider>
        <CapacitorBackButton />
      </body>
    </html>
  );
}
