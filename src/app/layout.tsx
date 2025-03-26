import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter, Roboto } from 'next/font/google';
import Navigation from './components/navigation';
import Footer from './components/footer';
import { fetchDrupalData } from './utils/drupalFetcher';
import { getImageUrl } from './utils/contentProcessor';

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
    process.env.NEXT_PUBLIC_SITE_URL || 'https://rcr-v2.vercel.app'
  ),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the logo for the navigation
  const logoUrl = await fetchLogoUrl();

  // Get footer content (could be moved to a separate component if needed)
  const footerContent = {
    contactEmail: 'contact@rcr.org',
    contactPhone: '(800) 555-1234',
  };

  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <body className="font-body flex min-h-screen flex-col antialiased">
        {/* Header with Navigation */}
        <Navigation logoUrl={logoUrl} />

        {/* Main content area */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <Footer {...footerContent} />
      </body>
    </html>
  );
}

/**
 * Helper function to fetch logo URL from Drupal
 */
async function fetchLogoUrl(): Promise<string> {
  try {
    console.log('Fetching logo for site layout...');

    // Fetch logo from homepage data
    const homeData = await fetchDrupalData('node/home_page', {
      fields: ['field_rcr_logo'],
      include: ['field_rcr_logo', 'field_rcr_logo.field_media_image'],
      revalidate: 3600, // Cache for 1 hour
    });

    const baseURL =
      process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] || '';

    // Extract logo from homepage data
    if (homeData?.data) {
      const entity = Array.isArray(homeData.data)
        ? homeData.data[0]
        : homeData.data;

      if (entity?.relationships?.field_rcr_logo?.data) {
        const logoData = entity.relationships.field_rcr_logo.data;
        const logoId = Array.isArray(logoData) ? logoData[0]?.id : logoData?.id;

        if (logoId) {
          const logoUrl = getImageUrl(homeData, logoId, baseURL);

          if (logoUrl) {
            console.log('Layout fetched logo URL:', logoUrl);
            return logoUrl;
          }
        }
      }
    }

    console.warn('Could not find logo in Drupal data, using fallback');
    return '/images/rcr_logo.png'; // Fallback to static logo
  } catch (error) {
    console.error('Error fetching logo:', error);
    return '/images/rcr_logo.png'; // Fallback to static logo on error
  }
}
