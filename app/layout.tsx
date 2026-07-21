import type { Metadata, Viewport } from "next";
import { Merriweather, Playfair_Display, Rye } from "next/font/google";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const western = Rye({
  variable: "--font-western",
  subsets: ["latin"],
  weight: ["400"],
});

const body = Merriweather({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Homeless Twenty 1904 | Magic Valley Historical Society",
    template: "%s | Homeless Twenty 1904",
  },
  description:
    "Homeless Twenty 1904 preserves western heritage across Southern and Eastern Idaho. Discover Magic Valley history, historical plaques, and upcoming heritage events.",
  keywords: [
    "Homeless Twenty 1904",
    "Southeast Idaho Historical Society",
    "Magic Valley History Preservation",
    "Eastern Idaho history",
    "historical plaques",
    "western heritage",
  ],
  authors: [{ name: "Homeless Twenty 1904" }],
  metadataBase: new URL("https://homelesstwenty1904.org"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://homelesstwenty1904.org/",
    siteName: "Homeless Twenty 1904",
    title: "Homeless Twenty 1904 | Preserving Western Heritage & Magic Valley History",
    description:
      "A historical society dedicated to safeguarding local lore and preserving the rugged western heritage of Southern and Eastern Idaho.",
    images: [{ url: "/assets/hero-oval.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Homeless Twenty 1904 | Magic Valley History Preservation",
    description:
      "Preserving western heritage, historical plaques, and community events across Eastern Idaho and the Magic Valley.",
    images: ["/assets/hero-oval.png"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#990000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${display.variable} ${western.variable} ${body.variable} antialiased`}
      >
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-crimson focus:text-parchment focus:px-4 focus:py-2 focus:font-body focus:text-sm"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main" className="min-h-[70vh] overflow-x-hidden">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
