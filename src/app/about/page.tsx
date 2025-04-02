import Image from 'next/image';
import { fetchAboutPageData } from '@/app/utils/drupalFetcher';
import { processAboutPageData } from '@/app/utils/contentProcessor';

// Icons for impact stats - we'll reuse these with dynamic data
const impactIcons = {
  communities: (
    <svg
      className="mx-auto mb-3 h-12 w-12"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  ),
  participants: (
    <svg
      className="mx-auto mb-3 h-12 w-12"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM6.75 9.75a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  trials: (
    <svg
      className="mx-auto mb-3 h-12 w-12"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
      />
    </svg>
  ),
  sites: (
    <svg
      className="mx-auto mb-3 h-12 w-12"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  ),
};

// Fallback data in case API fails
const fallbackImpactStats = [
  { id: '1', number: '25+', label: 'Rural Communities Served' },
  { id: '2', number: '500+', label: 'Research Participants' },
  { id: '3', number: '30+', label: 'Clinical Trials Supported' },
  { id: '4', number: '12', label: 'Research Phlebotomy Sites' },
];

const fallbackTeamMembers = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    role: 'Program Director',
    bio: 'With over 15 years of experience in rural healthcare initiatives, Dr. Johnson leads our mission to connect communities with clinical research.',
    image: '',
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Community Outreach Manager',
    bio: 'Michael works directly with rural healthcare providers to establish and maintain our network of research sites.',
    image: '',
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    role: 'Research Coordinator',
    bio: 'Emily oversees the implementation of clinical trials across our network, ensuring protocol adherence and data quality.',
    image: '',
  },
];

export default async function About() {
  try {
    // Fetch about page data with error handling
    let aboutData;
    try {
      aboutData = await fetchAboutPageData();
    } catch (fetchError) {
      console.error('Error fetching about page data:', fetchError);
      // Continue with empty data
      aboutData = { data: [], included: [] };
    }

    // Get the base URL from the environment
    const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || '';

    // Process the data with empty fallbacks
    let processedData;
    try {
      processedData = processAboutPageData(aboutData);
    } catch (processError) {
      console.error('Error processing about page data:', processError);
      processedData = {
        pageContent: null,
        heroImageUrl: null,
        impactStats: [],
        teamMembers: [],
      };
    }

    const {
      pageContent,
      heroImageUrl,
      impactStats: rawImpactStats,
      teamMembers: rawTeamMembers,
    } = processedData;

    // Use fallbacks if needed
    const impactStats =
      rawImpactStats.length > 0
        ? rawImpactStats.map((stat, index) => {
            // Associate icons with stats based on keywords in the label
            let icon;
            if (stat.label.toLowerCase().includes('communit'))
              icon = impactIcons.communities;
            else if (stat.label.toLowerCase().includes('participant'))
              icon = impactIcons.participants;
            else if (stat.label.toLowerCase().includes('trial'))
              icon = impactIcons.trials;
            else if (stat.label.toLowerCase().includes('site'))
              icon = impactIcons.sites;
            else
              icon =
                Object.values(impactIcons)[
                  index % Object.values(impactIcons).length
                ];

            return { ...stat, icon };
          })
        : fallbackImpactStats.map((stat, index) => {
            let icon;
            if (stat.label.toLowerCase().includes('communit'))
              icon = impactIcons.communities;
            else if (stat.label.toLowerCase().includes('participant'))
              icon = impactIcons.participants;
            else if (stat.label.toLowerCase().includes('trial'))
              icon = impactIcons.trials;
            else if (stat.label.toLowerCase().includes('site'))
              icon = impactIcons.sites;
            else
              icon =
                Object.values(impactIcons)[
                  index % Object.values(impactIcons).length
                ];

            return { ...stat, icon };
          });

    const teamMembers =
      rawTeamMembers.length > 0 ? rawTeamMembers : fallbackTeamMembers;

    // Handle missing content
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
    const pageBodyContent = pageContent.attributes?.body?.processed || '';

    return (
      <>
        {/* Hero Section with Title */}
        {heroImageUrl ? (
          <div className="relative h-[300px] w-full overflow-hidden">
            <Image
              src={heroImageUrl}
              alt={`${pageTitle} Hero Image`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: 'center 65%' }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container px-4 text-center">
                <h1 className="font-title text-shadow-lg mb-6 text-4xl font-bold text-white uppercase md:text-6xl">
                  {pageTitle}
                </h1>
                <p className="text-shadow mx-auto max-w-3xl text-lg text-white md:text-xl">
                  Bridging the gap between rural communities and medical
                  research
                </p>
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
        <section className="bg-secondary/10 py-16 text-gray-700">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="prose prose-lg mx-auto">
                <div dangerouslySetInnerHTML={{ __html: pageBodyContent }} />
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section - You can keep your existing static data for this */}
        {/* ... */}

        {/* Impact Stats - Now with dynamic data */}
        <section className="bg-primary py-16 text-white">
          <div className="container mx-auto px-4">
            <h2 className="font-title mb-12 text-center text-3xl font-bold">
              Our Impact
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {impactStats.map((stat) => (
                <div
                  key={stat.id}
                  className="transform rounded-lg bg-white/10 p-6 text-center transition-transform hover:scale-105 hover:bg-white/15"
                >
                  {stat.icon}
                  <p className="mb-2 text-4xl font-bold md:text-5xl">
                    {stat.number}
                  </p>
                  <p className="text-sm md:text-base">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section - Now with dynamic data */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-title text-primary mb-12 text-center text-3xl font-bold">
              Our Team
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="overflow-hidden rounded-lg bg-white shadow-md"
                >
                  <div className="relative h-60 w-full overflow-hidden bg-gray-200">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        style={{ objectPosition: 'center 50%' }}
                      />
                    ) : (
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
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-primary mb-1 text-xl font-bold">
                      {member.name}
                    </h3>
                    {member.role && (
                      <p className="mb-4 text-sm font-medium text-gray-500">
                        {member.role}
                      </p>
                    )}
                    <div
                      className="prose prose-sm text-gray-600"
                      dangerouslySetInnerHTML={{ __html: member.bio }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The rest of your existing content */}
        {/* ... */}
      </>
    );
  } catch (error) {
    console.error('Error in About page:', error);
    return (
      <div className="container mx-auto p-8">
        <div className="rounded-lg bg-red-50 p-6 text-red-800">
          <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
          <p>
            We encountered an error while loading this page. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }
}
