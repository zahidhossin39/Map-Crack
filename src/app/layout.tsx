import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
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
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
