import { Metadata } from 'next';
import Image from 'next/image';
import { RichTextContent } from '@/app/utils/richTextContent';
import { fetchAboutPageData } from '@/app/utils/drupalFetcher';
import { processPageData } from '@/app/utils/contentProcessor';

export const metadata: Metadata = {
  title: 'About Us - Rural Connections to Research',
  description:
    'Learn about the Rural Connections to Research program and our mission to expand access to health research in rural communities.',
  keywords:
    'about rcr, rural health research, clinical trials, rural healthcare access',
  openGraph: {
    title: 'About Rural Connections to Research',
    description:
      'Our mission to expand access to health research in rural communities',
    images: ['/images/rcr_logo.png'],
  },
};

export default async function About() {
  try {
    // Fetch and process about page data
    const aboutData = await fetchAboutPageData();

    // Get the base URL from the environment
    const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split(
      '/jsonapi'
    )[0]?.replace(/[/]+$/, '');
    const { pageContent, heroImageUrl } = processPageData(
      aboutData,
      'page',
      baseUrl
    );

    if (!pageContent) {
      return (
        <div className="container mx-auto p-8">
          <div className="rounded-lg bg-yellow-50 p-6 text-yellow-800">
            <h2 className="mb-2 text-xl font-bold">Content Unavailable</h2>
            <p>
              We're having trouble accessing the about page content. Please try
              again later.
            </p>
          </div>
        </div>
      );
    }

    console.log('About page data loaded:', {
      hasHeroImage: !!heroImageUrl,
      title: pageContent.attributes?.title,
    });

    return (
      <>
        {/* Hero Section with Title */}
        {heroImageUrl && (
          <div className="relative h-[300px] w-full overflow-hidden">
            <Image
              src={heroImageUrl}
              alt={`${pageContent.attributes?.title || 'About Us'} Hero Image`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'center 60%' }}
            />
            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent/50 via-transparent/25 to-white" />
            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-shadow-lg max-w-4xl p-8 text-center text-gray-100">
                <h1 className="font-title mb-6 text-4xl font-bold md:text-6xl">
                  {pageContent.attributes?.title ||
                    'About Rural Connections to Research'}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <article className="prose lg:prose-lg mx-auto max-w-3xl">
            {/* Only show title here if there's no hero image */}
            {!heroImageUrl && (
              <h1 className="text-primary mb-6 text-3xl font-bold">
                {pageContent.attributes?.title ||
                  'About Rural Connections to Research'}
              </h1>
            )}

            {/* Body content using your rich text component */}
            {pageContent.attributes?.body ? (
              <div className="mx-auto my-8">
                <RichTextContent
                  content={pageContent.attributes.body}
                  className="text-gray-700"
                />
              </div>
            ) : (
              <div className="mx-auto my-8 text-gray-700">
                <p>
                  The <strong>Rural Connections to Research (RCR)</strong>{' '}
                  program is a pioneering initiative by the University of Utah
                  designed to bring clinical research opportunities to rural
                  communities. We believe that everyone, regardless of where
                  they live, should have access to the benefits of cutting-edge
                  medical research.
                </p>
                <p>
                  Through innovative virtual engagement tools and a network of
                  local research phlebotomy sites, RCR eliminates barriers to
                  participation in clinical trials. Our mission is to empower
                  rural residents to contribute to advancements in healthcare
                  while ensuring that their unique needs and perspectives are
                  represented in research.
                </p>
                <p>
                  At RCR, we are committed to health equity, community
                  collaboration, and scientific innovation. By connecting rural
                  communities with researchers, we aim to create a more
                  inclusive and impactful future for healthcare.
                </p>
                <p>
                  Join us in our mission to bridge the gap between rural
                  communities and the forefront of medical discovery. Together,
                  we can make a difference.
                </p>
              </div>
            )}
          </article>
        </main>
      </>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in About page:', errorMessage);

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
