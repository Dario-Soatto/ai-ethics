import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader } from "next/font/google";
import Link from "next/link";
import { dilemmas } from "@/lib/dilemmas";
import { models } from "@/lib/models";
import "./globals.css";

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const serif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Model Ethics Catalog",
  description:
    "How frontier AI models respond to classic ethical and game-theoretic dilemmas. 10 samples per (dilemma, model) at temperature 1.0.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="px-8 py-6 border-b border-[var(--color-rule)]">
          <div className="mx-auto max-w-6xl flex items-baseline justify-between">
            <Link
              href="/"
              className="text-xs tracking-widest text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              M.E.C. <span className="text-[var(--color-ink-mute)]">/ catalog</span>
            </Link>
            <span className="text-[10px] tracking-wider text-[var(--color-ink-mute)]">
              n=10 · temp=1.0 · {models.length} models · {dilemmas.length} dilemmas
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--color-rule)] mt-24 py-6 px-8">
          <div className="mx-auto max-w-6xl text-[10px] tracking-wider text-[var(--color-ink-mute)] flex items-baseline justify-between">
            <span>generated via vercel ai gateway</span>
            <span>data: ./data/results/&lt;dilemma&gt;/&lt;model&gt;.json</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
