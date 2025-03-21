import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/app/components/navigation';
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
  let logoUrl = '';

  try {
    const homeData = await fetchDrupalData('node/home_page', {
      fields: ['title', 'field_rcr_logo'],
      include: ['field_rcr_logo', 'field_rcr_logo.field_media_image'],
    });

    const baseURL =
      process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] || '';

    // Extract logo from homepage data
    if (homeData?.data[0]?.relationships?.field_rcr_logo?.data?.id) {
      const logoId = homeData.data[0].relationships.field_rcr_logo.data.id;
      logoUrl = getDrupalImageUrl(homeData, logoId, baseURL) || '';
      console.log('Layout fetched logo URL from homepage:', logoUrl);
    } else {
      logoUrl = '/images/rcr_logo.png';
    }

    // Try without a name filter first
    const logoData = await fetchDrupalData('media--image', {
      fields: ['name', 'field_media_image'],
      include: ['field_media_image'],
      // No filter initially to see what's available
    });

    console.log(
      'Media entities found:',
      logoData.data.map(
        (item: { attributes: { name: any } }) => item.attributes.name
      )
    );

    // Then you can identify which one is your logo and use that specific ID
  } catch (error) {
    console.error('Error fetching logo:', error);
    // Fallback to a static image if API fails
    logoUrl = '/images/rcr_logo.png';
  }

  return (
    <html lang="en">
      <body className="font-body">
        <Navigation logoUrl={logoUrl} />
        {children}
      </body>
    </html>
  );
}
