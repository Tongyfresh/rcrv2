import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter, Roboto } from 'next/font/google';
import Navigation from './components/navigation';
import Footer from './components/footer';

// Load fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

// Define viewport settings (moved from metadata)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Define base metadata
export const metadata: Metadata = {
  title: {
    template: '%s | Rural Connections to Research',
    default: 'Rural Connections to Research',
  },
  description:
    'Connecting rural communities with clinical research opportunities across the Mountain West',
  keywords: [
    'rural healthcare',
    'clinical research',
    'mountain west',
    'healthcare access',
  ],
  authors: [{ name: 'RCR Team' }],

  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'https://rcr-v2.vercel.app'
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
