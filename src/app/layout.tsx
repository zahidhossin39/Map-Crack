import type { Metadata, Viewport } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#020617',
};

export const metadata: Metadata = {
  title: 'Map Crack | Local Business & Lead Prospector',
  description:
    'Interactive map to drop a pin anywhere, discover local businesses, and automatically crack open opportunities for businesses with no website.',
  keywords: [
    'local business finder',
    'lead generation',
    'no website businesses',
    'google places finder',
    'map prospecting',
    'web agency leads',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${openSans.variable} font-sans dark`}>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-brand-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
