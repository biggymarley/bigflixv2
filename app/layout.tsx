import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import PageTransitionVideo from "@/components/page-transition-video";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BigFlix - Unlimited Movies & TV Shows",
  description:
    "Watch unlimited movies, TV shows, and more. Discover, search, and save your favorites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Suspense fallback={null}>
          <PageTransitionVideo />
        </Suspense>
      </body>
    </html>
  );
}
