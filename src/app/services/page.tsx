'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { RichTextContent } from '@/app/utils/richTextContent';
import { fetchServicesPageData } from '@/app/utils/drupalFetcher';
import { processServicesPageData } from '@/app/utils/contentProcessor';
import { ensureAbsoluteUrl, getFallbackImage } from '@/app/utils/urlHelper';

// Define interfaces for type safety
interface ServiceOffering {
  title: string;
  description: string;
  icon: string;
  linkHref: string;
  linkText: string;
}

interface DetailedService {
  title: string;
  description: string;
  icon?: string;
  image?: string;
  linkHref: string;
  linkText: string;
}

// Define icons for the service types
const SERVICE_ICONS = {
  phlebotomy: (
    <svg
      className="text-primary h-12 w-12"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  ),
  virtual: (
    <svg
      className="text-primary h-12 w-12"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  consultation: (
    <svg
      className="text-primary h-12 w-12"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  community: (
    <svg
      className="text-primary h-12 w-12"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
};

// Define type for Drupal API response content
interface DrupalNode {
  id: string;
  attributes?: {
    title?: string;
    body?: string | { value?: string; processed?: string };
    field_staggered_text?: string | any[];
    [key: string]: any;
  };
  relationships?: {
    field_article_image?: {
      data?: { id: string; type: string };
    };
    field_hero_image?: {
      data?: { id: string; type: string };
    };
    field_staggered_images?: {
      data?: { id: string; type: string }[] | { id: string; type: string };
    };
    [key: string]: any;
  };
  [key: string]: any;
}

// Interface for processed services page data
interface ServicesPageData {
  pageContent: DrupalNode | null;
  heroImageUrl: string | null;
  staggeredImages: string[];
  staggeredText: any[];
}

export default function Services() {
  // State for tracking image load failures
  const [heroImageError, setHeroImageError] = useState(false);
  const [serviceImageErrors, setServiceImageErrors] = useState<{
    [key: string]: boolean;
  }>({});

  // Get server data - fetch happens in useServicesData
  const {
    serviceOfferings,
    detailedServices,
    pageTitle,
    heroImageUrl,
    showApiError,
    staggeredImages,
  } = useServicesData();

  // Handler for service image errors
  const handleServiceImageError = (index: number) => {
    setServiceImageErrors((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  return (
    <>
      {/* Show API error notice if needed */}
      {showApiError && (
        <div className="mb-6 border-l-4 border-yellow-400 bg-yellow-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Using fallback content. We're experiencing issues with our
                content management system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Title */}
      <div className="relative h-[300px] w-full overflow-hidden md:h-[300px]">
        <Image
          src={
            heroImageError
              ? getFallbackImage('hero')
              : heroImageUrl || getFallbackImage('hero')
          }
          alt={`${pageTitle} Hero Image`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: 'center 10%' }}
          onError={() => {
            console.error('Failed to load hero image:', heroImageUrl);
            setHeroImageError(true);
          }}
        />
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent/50 via-transparent/25 to-white" />
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-shadow-lg max-w-4xl p-8 text-center text-gray-100">
            <h1 className="font-title mb-6 text-4xl font-bold md:text-6xl">
              {pageTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Staggered Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {detailedServices.map((service: DetailedService, index: number) => (
              <div
                key={index}
                className={`flex flex-col items-center gap-8 md:flex-row ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Image/Icon Column */}
                <div className="md:w-1/2">
                  {service.image && !serviceImageErrors[index] ? (
                    // Use actual image if available
                    <div className="overflow-hidden rounded-lg shadow-lg">
                      <div className="relative h-64 w-full md:h-80">
                        <Image
                          src={
                            ensureAbsoluteUrl(service.image) ||
                            getFallbackImage('thumbnail')
                          }
                          alt={service.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          onError={() => handleServiceImageError(index)}
                        />
                      </div>
                    </div>
                  ) : (
                    // Fallback to icon
                    <div className="flex h-64 w-full items-center justify-center rounded-lg bg-gray-100">
                      <div className="rounded-full bg-white p-6 shadow-lg">
                        {SERVICE_ICONS[
                          service.icon as keyof typeof SERVICE_ICONS
                        ] || SERVICE_ICONS['phlebotomy']}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Column */}
                <div className="md:w-1/2">
                  <div
                    className={`${index % 2 === 1 ? 'md:pr-12' : 'md:pl-12'}`}
                  >
                    <h3 className="text-primary mb-4 text-2xl font-bold">
                      {service.title}
                    </h3>
                    <div className="prose max-w-none text-gray-700">
                      {typeof service.description === 'string' &&
                      service.description.includes('<') &&
                      service.description.includes('</') ? (
                        // If it looks like HTML, use RichTextContent
                        <RichTextContent content={service.description} />
                      ) : (
                        // Otherwise use the paragraph splitting approach
                        service.description
                          .split('\n\n')
                          .map((paragraph: string, pIndex: number) => (
                            <p key={pIndex}>{paragraph}</p>
                          ))
                      )}
                    </div>
                    <div className="mt-6">
                      <Link
                        href={service.linkHref || '#'}
                        className="bg-primary hover:bg-primary/90 inline-flex items-center rounded-lg px-5 py-2.5 font-medium text-white shadow-sm transition-colors"
                      >
                        {service.linkText || 'Learn more'}
                        <svg
                          className="ml-2 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-title text-primary mb-12 text-center text-3xl font-bold md:text-4xl">
            How We Can Help
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {serviceOfferings.map((service: ServiceOffering, index: number) => (
              <div
                key={index}
                className="flex flex-col rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
              >
                <Link
                  href={service.linkHref}
                  className="group flex flex-1 flex-col p-6"
                >
                  <div className="bg-primary/10 group-hover:bg-primary/20 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full transition-colors">
                    {SERVICE_ICONS[
                      service.icon as keyof typeof SERVICE_ICONS
                    ] || <span className="text-primary text-2xl">●</span>}
                  </div>
                  <h3 className="text-primary group-hover:text-primary/80 mb-3 text-xl font-bold transition-colors">
                    {service.title}
                  </h3>
                  <p className="mb-6 text-gray-600">{service.description}</p>
                  <div className="mt-auto">
                    <span className="text-primary group-hover:text-primary/80 inline-flex items-center font-medium transition-colors">
                      {service.linkText}
                      <svg
                        className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-title mb-6 text-3xl font-bold text-white md:text-4xl">
              Ready to Connect Your Research to Rural Communities?
            </h2>
            <p className="mb-8 text-lg text-white/90">
              Schedule a no-cost consultation with our team to learn how RCR can
              support your clinical research initiatives.
            </p>
            <Link
              href="/consultation"
              className="text-primary inline-block rounded-lg bg-white px-8 py-3 text-lg font-medium shadow-lg transition-colors hover:bg-white/90"
            >
              Request a Consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// Helper function to fetch and prepare data
function useServicesData() {
  const [data, setData] = useState({
    serviceOfferings: [] as ServiceOffering[],
    detailedServices: [] as DetailedService[],
    pageTitle: 'Our Services',
    heroImageUrl: null as string | null,
    staggeredImages: [] as string[],
    staggeredText: [] as any[],
    showApiError: false,
  });

  // Use useEffect to fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      // Define hardcoded service offerings
      const serviceOfferings: ServiceOffering[] = [
        {
          title: 'Research Phlebotomy Collective',
          description:
            'Our network of rural phlebotomy sites allows study participants to complete blood draws locally, without traveling to distant academic centers.',
          icon: 'phlebotomy',
          linkHref: '/research_sites',
          linkText: 'Find a location',
        },
        {
          title: 'Virtual Trial Support',
          description:
            'We provide technology and support for participants to complete study visits from home, with remote monitoring and telehealth capabilities.',
          icon: 'virtual',
          linkHref: '/toolbox',
          linkText: 'Learn more',
        },
        {
          title: 'Investigator Consultation',
          description:
            'We offer consultation services for researchers looking to expand their studies to rural areas, with expertise in recruitment and compliance.',
          icon: 'consultation',
          linkHref: '/consultation',
          linkText: 'Schedule a consultation',
        },
        {
          title: 'Community Engagement',
          description:
            'We build relationships with rural healthcare providers and communities to increase awareness and participation in clinical trials.',
          icon: 'community',
          linkHref: '/about',
          linkText: 'Our approach',
        },
      ];

      // Define detailed service descriptions
      const detailedServices: DetailedService[] = [
        {
          title: 'Research Phlebotomy Collective',
          description: `Our Research Phlebotomy Collective connects rural participants with convenient local phlebotomy sites. This network eliminates the need for long-distance travel to research centers, making participation in clinical trials more accessible.
          
          Participants can have their blood drawn at a facility near their home, with samples properly processed and shipped to the study team. This approach not only increases participation rates but also improves retention by reducing participant burden.`,
          icon: 'phlebotomy',
          linkHref: '/research_sites',
          linkText: 'Find a location near you',
        },
        {
          title: 'Virtual Trial Support',
          description: `Our comprehensive virtual trial platform enables participants to complete many study visits remotely. Through secure video conferencing, electronic consent processes, and remote monitoring tools, we're reducing barriers to participation.
          
          Our team provides technical support to both participants and researchers, ensuring a seamless experience. We can help with study design, implementation of virtual visits, and training for both staff and participants on using virtual research tools.`,
          icon: 'virtual',
          linkHref: '/toolbox',
          linkText: 'Explore our virtual toolbox',
        },
        {
          title: 'Investigator Consultation',
          description: `Expanding clinical trials to rural areas requires specialized knowledge and experience. Our consultation services provide researchers with guidance on study design, recruitment strategies, regulatory considerations, and operational logistics.
          
          We work with investigators to adapt their protocols for rural implementation, helping them navigate challenges related to distance, technology limitations, and unique community needs. Our goal is to ensure that rural participation doesn't compromise study integrity or data quality.`,
          icon: 'consultation',
          linkHref: '/consultation',
          linkText: 'Schedule a no-cost consultation',
        },
      ];

      // Variables to store dynamic content
      let pageContent: DrupalNode | null = null;
      let heroImageUrl: string | null = null;
      let pageTitle = 'Our Services';
      let staggeredImages: string[] = [];
      let staggeredText: any[] = [];
      let showApiError = false;

      try {
        const servicesData = await fetchServicesPageData();
        const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL?.replace(
          /[/]+$/,
          ''
        );

        if (servicesData?.data) {
          const result = processServicesPageData(servicesData, baseUrl);

          if (result.pageContent) {
            pageContent = result.pageContent;
            heroImageUrl = ensureAbsoluteUrl(result.heroImageUrl);
            staggeredImages = result.staggeredImages.map(
              (img) => ensureAbsoluteUrl(img) || getFallbackImage('thumbnail')
            );
            staggeredText = result.staggeredText;

            // Update title if available
            if (pageContent && pageContent.attributes?.title) {
              pageTitle = pageContent.attributes.title;
            }

            // Apply staggered text and images to detailed services
            if (staggeredText.length > 0) {
              staggeredText.forEach((item, index) => {
                if (index < detailedServices.length) {
                  if (item.description) {
                    detailedServices[index].description = item.description;
                  } else if (item.text) {
                    detailedServices[index].description = item.text;
                  } else if (item.value) {
                    detailedServices[index].description = item.value;
                  } else if (typeof item === 'string') {
                    detailedServices[index].description = item;
                  }

                  if (item.title) {
                    detailedServices[index].title = item.title;
                  }

                  if (item.linkHref) {
                    detailedServices[index].linkHref = item.linkHref;
                  } else if (item.link && typeof item.link === 'string') {
                    detailedServices[index].linkHref = item.link;
                  }

                  if (item.linkText) {
                    detailedServices[index].linkText = item.linkText;
                  } else if (item.link_text) {
                    detailedServices[index].linkText = item.link_text;
                  }
                }
              });
            }

            if (staggeredImages.length > 0) {
              staggeredImages.forEach((imageUrl, index) => {
                if (index < detailedServices.length) {
                  detailedServices[index].image = imageUrl;
                }
              });
            }
          } else {
            showApiError = true;
          }
        } else {
          showApiError = true;
        }
      } catch (error) {
        console.error(
          'Error loading services page:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        showApiError = true;
      }

      setData({
        serviceOfferings,
        detailedServices,
        pageTitle,
        heroImageUrl,
        staggeredImages,
        staggeredText,
        showApiError,
      });
    }

    fetchData();
  }, []);

  return data;
}
