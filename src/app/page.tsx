import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import VideoPlayer from './components/videoPlayer';
import { fetchHomePageData } from './utils/drupalFetcher';
import {
  processHomePageData,
  adaptPartnersForLogoBar,
} from './utils/contentProcessor';
import Tile from './components/tile';
import LogoBar from './components/logoBar';
import LinkCards from './components/linkCards';
import { RichTextContent } from './utils/richTextContent';

// Component for rendering rich text fields safely

export const metadata: Metadata = {
  title: 'Rural Connections to Research | Expanding Clinical Trials Access',
  description:
    'Rural Connections to Research (RCR) bridges the gap between rural communities and clinical research opportunities across the Mountain West.',
  keywords:
    'clinical trials, rural healthcare, research, mountain west, medical access',
  openGraph: {
    title: 'Rural Connections to Research',
    description: 'Expanding access to clinical research in rural communities',
    images: ['/images/rcr_logo.png'],
  },
};

export default async function Home() {
  try {
    // Fetch and process home data
    const homeData = await fetchHomePageData();
    const {
      homePage,
      heroImageUrl,
      articleImageUrl,
      mapImageUrl,
      cards,
      cardTitle,
      partners,
    } = processHomePageData(homeData);

    if (!homePage) {
      return (
        <div className="container mx-auto p-8">
          <div className="rounded-lg bg-yellow-50 p-6 text-yellow-800">
            <h2 className="mb-2 text-xl font-bold">Content Unavailable</h2>
            <p>
              We're having trouble accessing the homepage content. Please try
              again later.
            </p>
          </div>
        </div>
      );
    }

    console.log('Available data:', {
      hasHeroImage: !!heroImageUrl,
      hasArticleImage: !!articleImageUrl,
      hasMapImage: !!mapImageUrl,
      cardCount: cards?.length || 0,
      partnerCount: partners?.length || 0,
    });

    return (
      <>
        {/* 1. Hero Section with Title */}
        {heroImageUrl && (
          <div className="relative h-[300px] w-full overflow-hidden">
            <Image
              src={heroImageUrl}
              alt="Rural Connections to Research Hero"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'center 40%' }}
            />
            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent/50 via-transparent/25 to-white" />
            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-shadow-lg max-w-4xl p-8 text-center text-gray-100">
                <div className="font-title mb-6 text-4xl font-bold md:text-6xl">
                  {homePage.attributes?.title ||
                    'Rural Connections to Research'}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mx-auto flex items-center justify-center px-4 py-8">
          {homePage.attributes?.body && (
            <RichTextContent
              content={homePage.attributes.body}
              className="text-black"
            />
          )}
        </div>

        {/* 2. Three Buttons to Other Pages (Tiles) */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
        </div>

        {/* 3. Partner Logos */}
        {partners && partners.length > 0 && (
          <LogoBar partners={adaptPartnersForLogoBar(partners)} />
        )}

        {/* 4. Link Cards */}
        {cards && cards.length > 0 && <LinkCards cards={cards} />}

        {/* 5. Why RCR Section */}
        <section className="bg-primary/70 py-16">
          <div className="container mx-auto px-4">
            <div className="overflow-hidden rounded-xl bg-white shadow-lg">
              <div className="md:flex">
                {/* Left column - Content */}
                <div className="p-8 md:w-1/2 md:p-12">
                  <h2 className="font-body text-primary mb-6 text-3xl md:text-4xl">
                    Why RCR?
                  </h2>
                  <div className="prose prose-lg mb-8 max-w-none text-gray-700">
                    {homePage.attributes?.field_why_rcr_description ? (
                      <RichTextContent
                        content={homePage.attributes.field_why_rcr_description}
                        className="prose prose-lg"
                      />
                    ) : (
                      <p>
                        Join us in our mission to connect rural communities with
                        clinical research. We are bringing research closer to
                        home through strong partnerships and expanded access.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right column - Image */}
                <div className="relative md:w-1/2">
                  {articleImageUrl ? (
                    <div className="relative h-64 min-h-[400px] md:h-full">
                      <Image
                        src={articleImageUrl}
                        alt="Why RCR?"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      {/* Optional overlay for visual appeal */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="flex h-64 min-h-[400px] items-center justify-center bg-gray-200">
                      <p className="text-gray-500">Image not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Map Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-primary font-body mb-12 text-center text-3xl md:text-4xl">
              Our Research Network
            </h2>

            <div className="flex flex-col items-start justify-center md:flex-row">
              {/* Left Column Locations */}
              <div className="mb-8 md:mb-0 md:w-1/4 md:pr-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>
                      St. Mary's Regional Hospital, Grand Junction, CO
                    </span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Ashton Memorial, Ashton, ID</span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Island Park Medical Clinic, Island Park, ID</span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Madison Memorial Hospital, Rexburg, ID</span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>St. Peter's Health, Helena, MT</span>
                  </li>
                </ul>
              </div>

              {/* Center Map */}
              <div className="flex justify-center md:w-1/2">
                <div className="relative w-full max-w-md">
                  {mapImageUrl ? (
                    <Image
                      src={mapImageUrl}
                      alt="RCR Partner Locations Map"
                      width={600}
                      height={450}
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-100 p-8">
                      <p className="text-center text-gray-500">
                        Map image not available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Locations */}
              <div className="mt-8 md:mt-0 md:w-1/4 md:pl-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>
                      Memorial Hospital of Sweetwater, Rock Springs, WY
                    </span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>St. John's Health, Jackson, WY</span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Intermountain Deserts Region, NV</span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Carson Tahoe Health, Carson City, NV</span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Intermountain Deserts Region, UT</span>
                  </li>
                  <li className="flex items-start py-2">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Ashley Regional Medical Center, Vernal, UT</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/locations"
                className="text-primary hover:text-primary/80 inline-flex items-center gap-2 font-medium transition-colors"
              >
                View detailed location information
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Video Section */}
        <section className="">
          <div className="container max-w-full">
            <VideoPlayer
              videoId="Kieha1QED1U"
              title="RCR Introduction"
              imageName="rcr_wheat.png"
            />
          </div>
        </section>

        {/* Footer is now moved to the layout component */}
      </>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in Home page:', errorMessage);

    return (
      <div className="container mx-auto p-8">
        <div className="rounded-lg bg-red-50 p-6 text-red-800">
          <h2 className="mb-2 text-xl font-bold">Something Went Wrong</h2>
          <p>
            We encountered an error loading the page content. Please try again
            later.
          </p>
          <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
        </div>
      </div>
    );
  }
}
