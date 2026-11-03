import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";

const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "One-Button Log",
    template: "%s · One-Button Log",
  },
  description:
    "A shared board of big buttons. One tap logs who did it, and when. No account, no install, no ads.",
  applicationName: "One-Button Log",
  appleWebApp: {
    capable: true,
    title: "One-Button Log",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3efe4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-7 pb-28">
          {children}
        </div>
      </body>
    </html>
  );
}
