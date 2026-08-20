import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Story Feature',
    template: '%s · Story Feature',
  },
  description: '在浏览器本地创建、保存和查看会在 24 小时后自动过期的图片 Story。',
  applicationName: 'Story Feature',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f8f5',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
