'use client';

import React, { useState, useMemo } from 'react';
import { RichTextContent } from '@/app/utils/richTextContent';
import { ProcessedToolboxResource } from '@/types/drupal';

// Define props interface
interface ToolboxFilterProps {
  initialCategories: string[];
  initialResources: ProcessedToolboxResource[];
}

// Re-define interface locally or import if preferred
interface ToolboxResource extends ProcessedToolboxResource {}

export default function ToolboxFilter({
  initialCategories,
  initialResources,
}: ToolboxFilterProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<string>('All Resources');

  // Memoize filtered resources to avoid re-calculation on every render
  const filteredResources = useMemo(() => {
    if (selectedCategory === 'All Resources') {
      return initialResources;
    }
    return initialResources.filter(
      (resource) => resource.category === selectedCategory
    );
  }, [selectedCategory, initialResources]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  // Combine 'All Resources' with fetched categories
  const displayCategories = ['All Resources', ...initialCategories];

  return (
    <div>
      {/* Resource Categories */}
      {displayCategories.length > 1 && ( // Only show filters if there are categories
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {displayCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resource Cards */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource: ToolboxResource) => (
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

              <h3 className="mb-2 text-xl font-bold">{resource.title}</h3>

              <div className="mb-6 flex-grow">
                <RichTextContent
                  content={resource.description}
                  className="text-gray-600"
                />
              </div>

              <div className="mt-auto">
                <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {resource.fileType.toUpperCase()} • {resource.fileSize}
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
            {selectedCategory === 'All Resources'
              ? 'There are currently no resources available.'
              : `No resources found in the "${selectedCategory}" category.`}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Helper Functions (Copied from RCRToolboxPage) ---

// NOTE: Consider moving these to a shared utility file if used elsewhere

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
