import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { DrupalResponse } from '@/types/drupal';
import VideoPlayer from './components/videoPlayer';
import { fetchDrupalData } from './utils/drupalFetcher';
import Tile from './components/tile';

export const metadata: Metadata = {
  title: 'Rural Connections to Research',
  description: 'Supporting research initiatives in rural communities',
};

export default async function Home() {
  try {
    const data: DrupalResponse = await fetchDrupalData('node/home_page', {
      fields: ['title', 'body', 'field_hero_image'],
      include: ['field_hero_image', 'field_hero_image.field_media_image'],
      revalidate: 3600,
    });

    if (!data.data?.[0]) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
            Homepage content not found
          </div>
        </div>
      );
    }

    const homePage = data.data[0];

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Homepage relationships:', homePage.relationships);
      console.log('Included data:', data.included);
    }

    let heroImageUrl = null;
    const heroMediaId = homePage.relationships?.field_hero_image?.data?.id;

    if (heroMediaId) {
      const heroImage = data.included?.find(
        (item) => item.type === 'media--image' && item.id === heroMediaId
      );

      if (heroImage) {
        const fileId = heroImage.relationships?.field_media_image?.data?.id;
        const fileEntity = data.included?.find(
          (item) => item.type === 'file--file' && item.id === fileId
        );

        const baseURL = (
          process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] || ''
        ).replace(/[/]+$/, '');
        if (fileEntity?.attributes?.uri?.url) {
          heroImageUrl = new URL(fileEntity.attributes.uri.url, baseURL).href;
        }
      }
    }

    return (
      <main className="min-h-screen">
        {/* Hero Section */}
        {heroImageUrl && (
          <div className="relative h-100 w-full overflow-hidden">
            <Image
              src={heroImageUrl}
              alt="Hero Image"
              fill
              priority
              className="[mask-image:linear-gradient(to_bottom,transparent,white_50)]"
              style={{
                objectFit: 'cover',
                objectPosition: 'center 35%',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(0deg, secondary 0%, transparent 30%)',
              }}
            ></div>
            {/* Title overlay */}
            <div className="absolute top-10 right-0 left-0 px-4 pb-12">
              <div className="container mx-auto">
                <h1 className="font-title text-shadow-lg mx-auto max-w-3xl text-center text-6xl text-pretty text-white uppercase">
                  {homePage.attributes.title}
                </h1>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Main Content */}
          <article className="prose mx-auto mb-12 max-w-3xl text-center">
            {homePage.attributes.body?.value && (
              <div
                className="text-lg text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: homePage.attributes.body.value,
                }}
              />
            )}
          </article>

          {/* Tiles Grid */}
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Tile
              href="/toolbox"
              title="RCR Toolbox"
              description="A centralized resource for rural research, providing virtual tools, training materials, and essential resources to streamline studies and remote coordination."
              variant="primary"
            />
            <Tile
              href="/research_sites"
              title="Research Phlebotomy Collective Sites"
              description="Expanding access to clinical research, the Rural Research Phlebotomy Collective provides convenient, community-based blood draw services for rural participants."
              variant="secondary"
            />
            <Tile
              href="/consultation"
              title="No-Cost Consultation"
              description="Schedule a consultation to learn how your organization can collaborate with us to expand access to clinical research in rural communities."
              variant="highlight"
            />
          </div>

          {/* Video Section */}
          <VideoPlayer
            videoId="Kieha1QED1U"
            title="RCR Introduction"
            imageName="rcr_wheat.png"
          />

          {/* Quick Links */}
          <div className="mt-12">
            <h2 className="font-body text-primary mb-4 text-2xl">
              Quick Links
            </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/locations"
                  className="hover:text-highlight text-black transition-colors"
                >
                  Locations
                </Link>
              </li>
              <li>
                <Link
                  href="/toolbox"
                  className="hover:text-highlight text-black transition-colors"
                >
                  Toolbox Resources
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in Home page:', errorMessage);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {process.env.NODE_ENV === 'development'
            ? errorMessage
            : 'Error loading homepage content'}
        </div>
      </div>
    );
  }
}
