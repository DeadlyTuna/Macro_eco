import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Schibsted_Grotesk, Martian_Mono, Noto_Sans_Thaana } from "next/font/google";
import "./globals.css";
import SceneRoot from "@/components/scene/SceneRoot";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { TransitionProvider } from "@/components/motion/Transition";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const bodoni = Bodoni_Moda({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-bodoni", display: "swap" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-schibsted", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin", "latin-ext", "cyrillic"], axes: ["wdth"], variable: "--font-martian", display: "swap" });
// Vietnamese and Cyrillic glyphs fall back to system faces (Times New Roman / Segoe UI / SF) that cover them.
// Thaana only downloads when the Maldives page shows Dhivehi script.
const thaana = Noto_Sans_Thaana({ subsets: ["thaana"], variable: "--font-thaana-face", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL("https://four-economies.vercel.app"),
  title: {
    default: "Four Economies — GNI, income per head and inflation, 2022–2024",
    template: "%s · Four Economies",
  },
  description:
    "An interactive macroeconomics study of Bosnia & Herzegovina, Seychelles, Viet Nam and the Maldives: national income, income per head and inflation from World Bank data, 2022–2024.",
  authors: [{ name: "Harsh · 25BEC0374" }],
  keywords: ["GNI", "GNI per capita", "inflation", "Bosnia and Herzegovina", "Seychelles", "Viet Nam", "Maldives", "World Bank", "macroeconomics", "Atlas method", "PPP"],
  openGraph: {
    type: "website",
    title: "Four Economies — who is actually better off?",
    description: "National income, income per head and inflation in four small, open economies, 2022–2024.",
    siteName: "Four Economies",
  },
  twitter: { card: "summary_large_image", title: "Four Economies — who is actually better off?" },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [bodoni, schibsted, martian, thaana].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={`${fonts} antialiased`}>
      <body>
        <a href="#main" className="sr-only z-[80] rounded bg-paper px-3 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <SceneRoot />
        <SmoothScroll />
        <TransitionProvider>
          <Nav />
          <main id="main" className="relative z-10">
            {children}
          </main>
          <Footer />
        </TransitionProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
