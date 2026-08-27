import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 👇 تنظیمات Turbopack
  turbopack: {
    // (اختیاری) مسیر ریشه پروژه را به صورت دستی تنظیم کنید
    root: __dirname,

    // (اختیاری) برای alias دادن به ماژول‌ها
    // resolveAlias: {
    //   '@': '/src',
    // },

    // (اختیاری) برای پسوندهای فایل‌های قابل حل
    // resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],

    // (اختیاری) برای افزودن loaderهای سفارشی
    // rules: {
    //   '*.svg': {
    //     loaders: ['@svgr/webpack'],
    //     as: '*.js',
    //   },
    // },
  },
};

export default nextConfig;