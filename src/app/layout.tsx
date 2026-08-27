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
  title: {
    default: "Trawin — اثبات واقعی مهارت برنامه‌نویسی",
    template: "%s | Trawin",
  },
  description:
    "Trawin توانایی واقعی برنامه‌نویس را با آزمون تطبیقی، رفتارشناسی کد و رزومه زنده اثبات می‌کند؛ و شرکت‌ها را با مهارتِ اثبات‌شده — نه ادعا — به توسعه‌دهندگان وصل می‌کند.",
  keywords: [
    "Trawin",
    "ترافین",
    "ارزیابی برنامه‌نویس",
    "آزمون برنامه‌نویسی",
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
      className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
