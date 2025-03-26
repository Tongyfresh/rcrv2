import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
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

// Define key values that are important to our mission
const coreValues = [
  {
    title: 'Health Equity',
    description:
      'Ensuring all communities have equal access to clinical research opportunities regardless of location.',
    icon: (
      <svg
        className="text-primary h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: 'Community Collaboration',
    description:
      'Building strong partnerships with rural healthcare providers and community organizations.',
    icon: (
      <svg
        className="text-primary h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Scientific Innovation',
    description:
      'Developing creative solutions to overcome challenges in rural healthcare research.',
    icon: (
      <svg
        className="text-primary h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    title: 'Rural Empowerment',
    description:
      'Giving rural communities a voice in the advancement of healthcare research and treatments.',
    icon: (
      <svg
        className="text-primary h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    ),
  },
];

// Define team members
const teamMembers = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Program Director',
    bio: 'With over 15 years of experience in rural healthcare initiatives, Dr. Johnson leads our mission to connect communities with clinical research.',
    image: '/images/team/placeholder-1.jpg', // Replace with actual image paths
  },
  {
    name: 'Michael Chen',
    role: 'Community Outreach Manager',
    bio: 'Michael works directly with rural healthcare providers to establish and maintain our network of research sites.',
    image: '/images/team/placeholder-2.jpg',
  },
  {
    name: 'Dr. Emily Rodriguez',
    role: 'Research Coordinator',
    bio: 'Emily oversees the implementation of clinical trials across our network, ensuring protocol adherence and data quality.',
    image: '/images/team/placeholder-3.jpg',
  },
];

// Stats about our impact
const impactStats = [
  { number: '25+', label: 'Rural Communities Served' },
  { number: '500+', label: 'Research Participants' },
  { number: '30+', label: 'Clinical Trials Supported' },
  { number: '12', label: 'Research Phlebotomy Sites' },
];

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

    // Extract page content
    const pageTitle =
      pageContent.attributes?.title || 'About Rural Connections to Research';
    const pageBodyContent = pageContent.attributes?.body || '';

    return (
      <>
        {/* Hero Section with Title */}
        {heroImageUrl ? (
          <div className="relative h-[400px] w-full overflow-hidden">
            <Image
              src={heroImageUrl}
              alt={`${pageTitle} Hero Image`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'center 65%' }}
            />
            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white" />
            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-shadow-lg max-w-4xl p-8 text-center text-white">
                <h1 className="font-title mb-4 text-4xl font-bold md:text-6xl">
                  {pageTitle}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          // Fallback hero when no image is available
          <div className="bg-primary/10 py-20">
            <div className="container mx-auto px-4">
              <h1 className="font-title text-primary mb-6 text-center text-4xl font-bold md:text-6xl">
                {pageTitle}
              </h1>
              <p className="mx-auto max-w-3xl text-center text-lg text-gray-700">
                Bridging the gap between rural communities and medical research
              </p>
            </div>
          </div>
        )}

        {/* Mission Statement Section */}
        <section className="bg-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-title text-primary mb-8 text-center text-3xl font-bold">
                Our Mission
              </h2>
              <div className="prose-lg">
                {pageBodyContent ? (
                  <RichTextContent
                    content={pageBodyContent}
                    className="text-gray-700"
                  />
                ) : (
                  <>
                    <p className="mb-6 text-lg">
                      The <strong>Rural Connections to Research (RCR)</strong>{' '}
                      program is a pioneering initiative by the University of
                      Utah designed to bring clinical research opportunities to
                      rural communities. We believe that everyone, regardless of
                      where they live, should have access to the benefits of
                      cutting-edge medical research.
                    </p>
                    <p className="text-lg">
                      Through innovative virtual engagement tools and a network
                      of local research phlebotomy sites, RCR eliminates
                      barriers to participation in clinical trials. Our mission
                      is to empower rural residents to contribute to
                      advancements in healthcare while ensuring that their
                      unique needs and perspectives are represented in research.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-title text-primary mb-12 text-center text-3xl font-bold">
              Our Core Values
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {coreValues.map((value, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center rounded-lg bg-white p-6 text-center shadow-md"
                >
                  <div className="mb-4">{value.icon}</div>
                  <h3 className="text-primary mb-4 text-xl font-bold">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="bg-primary py-16 text-white">
          <div className="container mx-auto px-4">
            <h2 className="font-title mb-12 text-center text-3xl font-bold">
              Our Impact
            </h2>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {impactStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="mb-2 text-4xl font-bold md:text-5xl">
                    {stat.number}
                  </p>
                  <p className="text-sm opacity-80 md:text-base">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section (if needed) */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-title text-primary mb-12 text-center text-3xl font-bold">
              Our Team
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg bg-white shadow-md"
                >
                  <div className="relative h-60 w-full overflow-hidden bg-gray-200">
                    {/* You can replace this with actual team member photos */}
                    <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center">
                      <svg
                        className="h-24 w-24"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-primary mb-1 text-xl font-bold">
                      {member.name}
                    </h3>
                    <p className="mb-4 text-sm font-medium text-gray-500">
                      {member.role}
                    </p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-title text-primary mb-6 text-3xl font-bold">
                Join Our Mission
              </h2>
              <p className="mb-8 text-lg text-gray-700">
                Whether you're a researcher looking to expand your clinical
                trials to rural areas, a healthcare provider interested in
                joining our network, or someone who wants to participate in
                research, we'd love to connect with you.
              </p>
              <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Link
                  href="/services"
                  className="bg-primary hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-medium text-white shadow-md transition-colors"
                >
                  Explore Our Services
                </Link>
                <Link
                  href="/consultation"
                  className="text-primary border-primary hover:bg-primary/5 inline-flex items-center rounded-lg border-2 px-6 py-[10px] font-medium transition-colors"
                >
                  Request a Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>
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
