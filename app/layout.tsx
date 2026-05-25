import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const malvian = localFont({
  src: "../public/fonts/Malvian.otf",
  variable: "--font-malvian",
  display: "swap",
});

const generalSans = localFont({
  src: [
    { path: "../public/fonts/GeneralSans-Extralight.otf", weight: "200", style: "normal" },
    { path: "../public/fonts/GeneralSans-Light.otf",      weight: "300", style: "normal" },
    { path: "../public/fonts/GeneralSans-Regular.otf",    weight: "400", style: "normal" },
    { path: "../public/fonts/GeneralSans-Medium.otf",     weight: "500", style: "normal" },
    { path: "../public/fonts/GeneralSans-Semibold.otf",   weight: "600", style: "normal" },
    { path: "../public/fonts/GeneralSans-Bold.otf",       weight: "700", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tanya AZA — AI Ali Zaenal Abidin",
  description: "Konsultasi langsung dengan AI Ali: akses wawasan, saran, dan pengalaman dari Ali Zaenal Abidin kapanpun kamu butuh.",
  icons: {
    icon: "/avatar-ali.png",
    apple: "/avatar-ali.png",
  },
  openGraph: {
    title: "Tanya AZA — AI Ali Zaenal Abidin",
    description: "Konsultasi langsung dengan AI Ali: akses wawasan, saran, dan pengalaman dari Ali Zaenal Abidin kapanpun kamu butuh.",
    images: [{ url: "/avatar-ali.png" }],
  },
  twitter: {
    card: "summary",
    images: ["/avatar-ali.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${bebasNeue.variable} ${malvian.variable} ${generalSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
