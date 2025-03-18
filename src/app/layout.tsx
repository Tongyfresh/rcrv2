import type { Metadata } from 'next';
import './globals.css';
import Navigation from './components/navigation';
import { fetchDrupalImage } from './utils/imageFetcher';

export const metadata: Metadata = {
  title: 'RCR',
  description: 'Rural Connections to Research',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch logo using imageFetcher
  const logoUrl = await fetchDrupalImage('rcr_logo.png');

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/zri4qdg.css" />
      </head>
      <body className="min-h-screen bg-white">
        <header>
          <Navigation logoUrl={logoUrl || ''} />
        </header>
        <main>{children}</main>
        <footer className="mt-auto bg-gray-50">
          {/* Add footer content here if needed */}
        </footer>
      </body>
    </html>
  );
}
