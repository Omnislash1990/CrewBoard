import type { Metadata, Viewport } from "next";
import { Barlow, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CrewBoard",
    template: "%s · CrewBoard",
  },
  description: "Job dispatch and rota for trades teams.",
  applicationName: "CrewBoard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CrewBoard",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  // Next.js 16 emits mobile-web-app-capable from appleWebApp.capable.
  // Older iOS still reads the Apple-prefixed tag when adding to the home screen.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body className={`${sourceSans.variable} ${barlow.variable} antialiased`}>
        <AuthProvider>
          {children}
          <RegisterServiceWorker />
        </AuthProvider>
      </body>
    </html>
  );
}
