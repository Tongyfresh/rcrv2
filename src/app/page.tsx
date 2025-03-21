import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import VideoPlayer from './components/videoPlayer';
import { fetchDrupalData } from './utils/drupalFetcher';
import Tile from './components/tile';
import LogoBar from './components/logoBar';
import LinkCards from './components/linkCards';
import {
  getDrupalImageUrl,
  processPartnerLogosFromHome,
  processCardImages,
} from './utils/imageProcessor';
import {
  FaMapMarkerAlt,
  FaToolbox,
  FaEnvelope,
  FaPhone,
  FaExternalLinkAlt,
} from 'react-icons/fa';

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
    // Single fetch for all homepage content
    const homeData = await fetchDrupalData('node/home_page', {
      fields: [
        'title',
        'body',
        'field_hero_image',
        'field_links',
        'field_partner_logo',
        'field_rcr_card_description',
        'field_rcr_card_images',
        'field_rcr_logo',
        'field_why_rcr_description',
        'field_article_image',
      ],
      include: [
        'field_hero_image',
        'field_hero_image.field_media_image',
        'field_partner_logo',
        'field_partner_logo.field_media_image',
        'field_rcr_card_images',
        'field_rcr_card_images.field_media_image',
        'field_rcr_logo',
        'field_rcr_logo.field_media_image',
        'field_article_image',
        'field_article_image.field_media_image',
      ],
      revalidate: 3600,
    });

    if (!homeData.data?.[0]) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
            Homepage content not found
          </div>
        </div>
      );
    }

    const homePage = homeData.data[0];
    const baseURL =
      process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] || '';

    // Process all images
    const heroImageUrl = homePage.relationships?.field_hero_image?.data?.id
      ? getDrupalImageUrl(
          homeData,
          homePage.relationships.field_hero_image.data.id,
          baseURL
        )
      : null;

    let articleImageUrl = null;
    if (homePage.relationships?.field_article_image?.data?.id) {
      articleImageUrl = getDrupalImageUrl(
        homeData,
        homePage.relationships.field_article_image.data.id,
        baseURL
      );
    }

    // Process map image (you might need to update this based on your data structure)
    let mapImageUrl = null;
    const mapImage = await fetchDrupalData(
      'media/image/5258db78-718f-447c-9ce0-baca56988aac',
      {
        include: ['field_media_image'],
        revalidate: 3600,
      }
    );

    if (mapImage?.data?.id) {
      mapImageUrl = getDrupalImageUrl(mapImage, mapImage.data.id, baseURL);
    }

    // Process partner logos
    const partnerLogos = homePage.relationships?.field_partner_logo?.data || [];
    const processedPartners = processPartnerLogosFromHome(
      homeData,
      partnerLogos,
      baseURL
    );

    // Process card images
    const cardImageData = homePage.relationships?.field_rcr_card_images?.data;
    const processedCardImages = cardImageData
      ? processCardImages(homeData, cardImageData, baseURL)
      : [];

    // Process RCR logo
    let rcrLogoUrl = null;
    if (homePage.relationships?.field_rcr_logo?.data?.id) {
      const logoId = homePage.relationships.field_rcr_logo.data.id;
      rcrLogoUrl = getDrupalImageUrl(homeData, logoId, baseURL);
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
              sizes="100vw" // Full viewport width since it's a hero image
              className="[mask-image:linear-gradient(to_bottom,transparent,white_50)]"
              style={{
                objectFit: 'cover',
                objectPosition: 'center 35%',
              }}
            />
            <div
              className="absolute inset-0"
              style={
                {
                  // background: 'linear-gradient(0deg, white 0%, transparent 30%)',
                }
              }
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
        </div>
        {/* Logo Bar */}
        <LogoBar partners={processedPartners} />

        {/* Link Cards */}
        <LinkCards
          homeData={homeData}
          baseURL={baseURL}
          cardImages={processedCardImages}
        />

        {/* Why RCR Article */}
        <section className="bg-primary/70 py-16">
          <div className="container mx-auto px-4">
            <div className="overflow-hidden rounded-xl bg-white shadow-lg">
              <div className="md:flex">
                {/* Left column - Content */}
                <div className="p-8 md:w-1/2 md:p-12">
                  <h2 className="font-body text-primary mb-6 text-3xl md:text-4xl">
                    Why RCR?
                  </h2>

                  <div className="font-body mb-8 max-w-none text-gray-700">
                    {homePage.attributes?.field_why_rcr_description?.value ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            homePage.attributes.field_why_rcr_description.value,
                        }}
                      />
                    ) : (
                      <p>
                        Rural Connections to Research (RCR) bridges the gap
                        between rural communities and clinical research
                        opportunities. By creating infrastructures for
                        collaboration, we're transforming how research reaches
                        underserved populations across the Mountain West.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right column - Image and Buttons */}
                <div className="relative md:w-1/2">
                  {articleImageUrl && (
                    <div className="relative h-64 min-h-[400px] md:h-full">
                      <Image
                        src={articleImageUrl}
                        alt="Why RCR?"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw" // Half viewport on desktop, full on mobile
                        className="object-cover"
                      />

                      {/* Overlay for buttons */}
                      <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 to-transparent p-8">
                        <div className="mb-4 flex flex-wrap gap-4">
                          {/* Buttons as before */}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section with Location Listings */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-primary font-body mb-12 text-center text-3xl md:text-4xl">
              Our Research Network
            </h2>

            <div className="flex flex-col items-start justify-center md:flex-row">
              {/* Left Column Locations */}
              <div className="mb-8 md:mb-0 md:w-1/4 md:pr-6">
                <ul className="my-10 space-y-3 text-gray-700">
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>
                      St. Mary's Regional Hospital, Grand Junction, CO
                    </span>
                  </li>
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Ashton Memorial, Ashton, ID</span>
                  </li>
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Island Park Medical Clinic, Island Park, ID</span>
                  </li>
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Madison Memorial Hospital, Rexburg, ID</span>
                  </li>
                  <li className="my-10 flex items-start">
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
                    // Fallback if map image not found
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
                <ul className="my-10 space-y-3 text-gray-700 md:my-0">
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>
                      Memorial Hospital of Sweetwater, Rock Springs, WY
                    </span>
                  </li>
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>St. John's Health, Jackson, WY</span>
                  </li>
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Intermountain Deserts Region, NV</span>
                  </li>
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Carson Tahoe Health, Carson City, NV</span>
                  </li>
                  <li className="my-10 flex items-start">
                    <div className="bg-primary mt-2 mr-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
                    <span>Intermountain Deserts Region, UT</span>
                  </li>
                  <li className="my-10 flex items-start">
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

        {/* Video Section */}
        <VideoPlayer
          videoId="Kieha1QED1U"
          title="RCR Introduction"
          imageName="rcr_wheat.png"
        />

        {/* Footer with Quick Links */}
        <footer className="mt-0 bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Quick Links Column */}
              <div>
                <h2 className="font-body text-primary mb-6 text-2xl font-medium">
                  Quick Links
                </h2>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/locations"
                      className="hover:text-highlight flex items-center gap-2 text-gray-700 transition-colors"
                    >
                      <FaMapMarkerAlt className="text-primary" />
                      <span>Locations</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/toolbox"
                      className="hover:text-highlight flex items-center gap-2 text-gray-700 transition-colors"
                    >
                      <FaToolbox className="text-primary" />
                      <span>Toolbox Resources</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/partnerships"
                      className="hover:text-highlight flex items-center gap-2 text-gray-700 transition-colors"
                    >
                      <FaExternalLinkAlt className="text-primary" />
                      <span>Partnership Opportunities</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Information Column */}
              <div>
                <h2 className="font-body text-primary mb-6 text-2xl font-medium">
                  Contact Us
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-center gap-2">
                    <FaEnvelope className="text-primary" />
                    <Link
                      href="mailto:contact@rcr.org"
                      className="hover:text-highlight text-gray-700 transition-colors"
                    >
                      contact@rcr.org
                    </Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaPhone className="text-primary" />
                    <Link
                      href="tel:+18005551234"
                      className="hover:text-highlight text-gray-700 transition-colors"
                    >
                      (800) 555-1234
                    </Link>
                  </li>
                </ul>
              </div>

              {/* About Column */}
              <div>
                <h2 className="font-body text-primary mb-6 text-2xl font-medium">
                  About RCR
                </h2>
                <p className="mb-4 text-gray-700">
                  Rural Connections to Research (RCR) is dedicated to expanding
                  access to clinical trials and research opportunities for rural
                  communities across the Mountain West.
                </p>
                <Link
                  href="/about"
                  className="text-primary hover:text-highlight inline-flex items-center gap-1 transition-colors"
                >
                  Learn more about our mission
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-300 pt-8 text-center text-gray-600">
              <p>
                © {new Date().getFullYear()} Rural Connections to Research. All
                rights reserved.
              </p>
            </div>
          </div>
        </footer>
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
