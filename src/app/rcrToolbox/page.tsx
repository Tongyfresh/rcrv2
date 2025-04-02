import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { RichTextContent } from '@/app/utils/richTextContent';
import { fetchToolboxResources } from '@/app/utils/drupalFetcher';
import { processToolboxResourceData } from '@/app/utils/contentProcessor';
import { ProcessedToolboxData, ProcessedToolboxResource } from '@/types/drupal';
import ToolboxFilter from '@/app/components/toolboxFilter';

export const metadata: Metadata = {
  title: 'RCR Toolbox | Rural Connections to Research',
  description:
    'Access our comprehensive collection of research tools, templates, and resources designed specifically for rural healthcare settings.',
};

export default async function RCRToolboxPage() {
  const data = await fetchToolboxResources();
  const processedData = processToolboxResourceData(data);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Title */}
      <div className="relative h-[300px] w-full">
        {processedData.heroImageUrl ? (
          <Image
            src={processedData.heroImageUrl}
            alt="RCR Toolbox Hero Background"
            fill
            className="object-cover"
            style={{ objectPosition: 'center 60%' }}
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            {/* Fallback display when no image */}
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent/50 via-transparent/25 to-white" />
        {/* Title Centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container px-4 text-center">
            <h1 className="font-title text-shadow-lg mb-6 text-4xl font-bold text-white uppercase md:text-6xl">
              {processedData.title}
            </h1>
            {/* Optional: Add a subtitle or description here if needed */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Page Content */}
        {processedData.pageContent && (
          <div className="prose mb-12 max-w-none text-black">
            <RichTextContent content={processedData.pageContent} />
          </div>
        )}

        {/* Dynamic Toolbox Filter */}
        <ToolboxFilter
          initialCategories={processedData.categories}
          initialResources={processedData.resources}
        />
      </div>
    </div>
  );
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
