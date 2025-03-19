import type { Metadata } from 'next';
import './globals.css';
import Navigation from './components/navigation';
import { fetchDrupalData } from './utils/drupalFetcher';
import { getDrupalImageUrl } from './utils/imageProcessor';

export const metadata: Metadata = {
  title: 'RCR',
  description: 'Rural Connections to Research',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch logo using drupalFetcher
  const logoData = await fetchDrupalData('media/image', {
    fields: ['name', 'field_media_image'],
    include: ['field_media_image'],
    filter: {
      name: 'rcr_logo.png',
    },
  });

  const baseURL =
    process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] || '';
  const logoMediaId = logoData.data[0]?.id;
  const logoUrl = logoMediaId
    ? getDrupalImageUrl(logoData, logoMediaId, baseURL)
    : null;

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
