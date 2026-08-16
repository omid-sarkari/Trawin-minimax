import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Trawin — پلتفرم ارزیابی، مسابقه و استخدام برنامه‌نویسان",
  description:
    "Trawin؛ مطمئن‌ترین پلتفرم ارزیابی مهارت برنامه‌نویسی در ایران و فارسی‌زبان. آزمون، مسابقه، رزومه زنده و استخدام.",
  keywords: [
    "Trawin",
    "ترافین",
    "ارزیابی برنامه‌نویس",
    "مسابقه برنامه‌نویسی",
    "استخدام برنامه‌نویس",
    "رزومه زنده",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}