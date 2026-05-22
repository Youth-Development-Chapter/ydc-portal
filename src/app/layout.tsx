import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const coolveticaRg = localFont({
  src: './fonts/Coolvetica Rg.otf',
  variable: '--font-coolvetica',
  weight: '400',
});

const coolveticaComp = localFont({
  src: './fonts/Coolvetica Hv Comp.otf',
  variable: '--font-coolvetica-comp',
  weight: '800',
});

const coolveticaCond = localFont({
  src: './fonts/Coolvetica Rg Cond.otf',
  variable: '--font-coolvetica-cond',
  weight: '400',
});

export const metadata: Metadata = {
  title: "YDC",
  description: "Youth Development Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${coolveticaRg.variable} ${coolveticaComp.variable} ${coolveticaCond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative font-sans tracking-wide">
        {children}
      </body>
    </html>
  );
}
