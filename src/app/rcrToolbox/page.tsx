import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { RichTextContent } from '@/app/utils/richTextContent';
import { fetchToolboxResources } from '@/app/utils/drupalFetcher';
import { processToolboxResourceData } from '@/app/utils/contentProcessor';
import { ProcessedToolboxData, ProcessedToolboxResource } from '@/types/drupal';

export const metadata: Metadata = {
  title: 'RCR Toolbox | Rural Connections to Research',
  description:
    'Access resources, templates, and guides for implementing clinical research in rural healthcare settings.',
};

export default async function RCRToolboxPage() {
  try {
    const rawToolboxData = await fetchToolboxResources();

    const processedData: ProcessedToolboxData =
      processToolboxResourceData(rawToolboxData);

    const pageTitle = processedData.title || 'RCR Toolbox';
    const pageContent = processedData.pageContent || null;
    const heroImageUrl = processedData.heroImageUrl || null;

    const categories = processedData.categories || [];
    const resources: ProcessedToolboxResource[] = processedData.resources || [];

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
                <h1 className="font-title text-shadow-lg mb-6 text-4xl font-bold text-white md:text-6xl">
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
                Access resources and tools for rural clinical research
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              {pageContent ? (
                <div className="prose prose-lg max-w-none text-black">
                  <RichTextContent content={pageContent} />
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p>
                    <strong>Fallback description:</strong> This is placeholder
                    content for the toolbox page.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-12">
              {/* Resource Categories */}
              {categories.length > 0 && (
                <div className="mb-8">
                  <div className="flex flex-wrap gap-2">
                    <button className="bg-primary rounded-full px-4 py-1 text-sm font-medium text-white">
                      All Resources
                    </button>
                    {categories.map((category: string) => (
                      <button
                        key={category}
                        className="rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource Cards */}
              {resources.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {resources.map((resource: ProcessedToolboxResource) => (
                    <div
                      key={resource.id}
                      className="flex flex-col rounded-lg border border-gray-100 bg-white p-6 text-black shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="mb-4 flex items-center">
                        <div
                          className={`mr-3 rounded p-2 ${getFileTypeColor(
                            resource.fileType
                          )}`}
                        >
                          {getFileTypeIcon(resource.fileType)}
                        </div>
                        <span className="text-sm font-medium text-gray-500 uppercase">
                          {resource.category}
                        </span>
                      </div>

                      <h3 className="mb-2 text-xl font-bold">
                        {resource.title}
                      </h3>

                      <div className="mb-6 flex-grow">
                        <RichTextContent
                          content={resource.description}
                          className="text-gray-600"
                        />
                      </div>

                      <div className="mt-auto">
                        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {resource.fileType.toUpperCase()} •{' '}
                            {resource.fileSize}
                          </span>
                          <span>Updated: {resource.lastUpdated}</span>
                        </div>

                        <a
                          href={resource.fileUrl}
                          download
                          className="bg-primary hover:bg-primary-dark flex w-full items-center justify-center rounded-lg px-4 py-2 font-medium text-white transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-2 h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 p-6 text-center">
                  <h2 className="mb-2 text-xl font-medium text-yellow-800">
                    No Resources Found
                  </h2>
                  <p className="text-yellow-700">
                    Fallback message - This is a placeholder when no resources
                    are available.
                  </p>
                </div>
              )}

              {/* Contact section */}
              <div className="mt-16 rounded-lg bg-gray-50 p-8">
                <h3 className="mb-4 text-2xl font-bold text-black">
                  Need a Custom Resource?
                </h3>
                <p className="mb-6 text-gray-700">
                  If you need a specific document or have questions about
                  implementing these resources, our team is ready to assist you.
                </p>
                <Link
                  href="/contact"
                  className="bg-primary hover:bg-primary-dark inline-flex items-center rounded px-6 py-3 font-medium text-white"
                >
                  Contact the RCR Team
                  <svg
                    className="ml-2 h-5 w-5"
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
          </div>
        </div>

        {/* Additional Content */}
        {/* articleImageUrl is not part of ProcessedToolboxData, remove or adjust if needed */}
      </>
    );
  } catch (error) {
    console.error('Error rendering RCR Toolbox page:', error);
    return notFound();
  }
}

/**
 * Get color class based on file type
 */
function getFileTypeColor(fileType: string): string {
  const type = fileType.toLowerCase();
  switch (type) {
    case 'pdf':
      return 'bg-red-100 text-red-600';
    case 'doc':
    case 'docx':
      return 'bg-blue-100 text-blue-600';
    case 'xls':
    case 'xlsx':
      return 'bg-green-100 text-green-600';
    case 'ppt':
    case 'pptx':
      return 'bg-orange-100 text-orange-600';
    case 'mp4':
    case 'webm':
    case 'mov':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Get icon based on file type
 */
function getFileTypeIcon(fileType: string): React.ReactNode {
  const type = fileType.toLowerCase();
  switch (type) {
    case 'pdf':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    case 'doc':
    case 'docx':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'xls':
    case 'xlsx':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'mp4':
    case 'webm':
    case 'mov':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'ppt':
    case 'pptx':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4m4 4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16l4-4z"
          />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
      );
  }
}
