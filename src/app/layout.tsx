import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  display: "swap",
});

const display = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ZEE MEDIA",
    template: "%s · ZEE MEDIA",
  },
  description: "Watch the latest posts on ZEE MEDIA.",
  applicationName: "ZEE MEDIA",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${sans.className} ${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-foreground">{children}</body>
    </html>
  );
}
