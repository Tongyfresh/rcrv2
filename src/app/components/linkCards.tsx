'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CardData } from '@/app/utils/contentProcessor';

interface LinkCardsProps {
  cards: CardData[];
  title?: string | any; // Optional section title - we'll ignore this
}

export default function LinkCards({ cards }: LinkCardsProps) {
  // Handle empty cards array
  if (!cards || cards.length === 0) {
    return null;
  }

  // Track image loading state for a better user experience
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  // Safely sanitize URLs
  const getSafeUrl = (url: string): string => {
    // Ensure URLs are safe to use in href
    if (!url || url === '#') return '/';

    // Check if it's a relative URL
    if (url.startsWith('/')) return url;

    try {
      // For absolute URLs, verify they're valid
      const urlObj = new URL(url);
      return url;
    } catch (e) {
      console.warn(`Invalid URL: ${url}, defaulting to homepage`);
      return '/';
    }
  };

  // Helper function to get text content from Drupal rich text field
  const getTextContent = (content: any): string => {
    if (!content) return '';

    if (typeof content === 'string') {
      return content;
    }

    // Handle array of objects (like in your JSON example)
    if (Array.isArray(content)) {
      if (content.length > 0) {
        const firstItem = content[0];
        if (firstItem.processed) {
          return firstItem.processed.replace(/<[^>]+>/g, '');
        }
        if (firstItem.value) {
          return firstItem.value.replace(/<[^>]+>/g, '');
        }
      }
      return '';
    }

    // Handle single object
    if (content.processed) {
      return content.processed.replace(/<[^>]+>/g, '');
    }

    if (content.value) {
      return content.value.replace(/<[^>]+>/g, '');
    }

    // If it's an object with unexpected format, convert to string for safety
    return String(content);
  };

  // Helper function to get HTML content from Drupal rich text field
  const getHtmlContent = (content: any): string => {
    if (!content) return '';

    if (typeof content === 'string') {
      return content;
    }

    // Handle array of objects (like in your JSON example)
    if (Array.isArray(content)) {
      if (content.length > 0) {
        const firstItem = content[0];
        if (firstItem.processed) {
          return firstItem.processed;
        }
        if (firstItem.value) {
          return firstItem.value;
        }
      }
      return '';
    }

    // Handle single object
    if (content.processed) {
      return content.processed;
    }

    if (content.value) {
      return content.value;
    }

    return '';
  };

  return (
    <section className="bg-gray-100 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => {
            // For debugging in development
            if (process.env.NODE_ENV !== 'production') {
              console.log(`Card ${index}:`, {
                title: card.title,
                description: card.description,
                link: card.link,
              });
            }

            return (
              <Link
                href={getSafeUrl(card.link)}
                key={`card-${index}`}
                className="group overflow-hidden rounded-lg bg-white shadow-lg transition-transform hover:scale-105"
                aria-labelledby={`card-title-${index}`}
              >
                <div className="relative h-48 w-full overflow-hidden">
                  {card.imageUrl ? (
                    <>
                      {/* Show skeleton while image is loading */}
                      {!imagesLoaded[index] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <div className="border-t-primary h-8 w-8 animate-spin rounded-full border-4 border-gray-200"></div>
                        </div>
                      )}
                      <Image
                        src={card.imageUrl}
                        alt={`${getTextContent(card.title) || card.name || 'Resource'} illustration`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={`object-cover ${
                          !imagesLoaded[index] ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={() => handleImageLoad(index)}
                        onError={() => {
                          console.warn(
                            `Failed to load image for: ${getTextContent(card.title) || card.name || 'Resource'}`
                          );
                          handleImageLoad(index);
                        }}
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3
                    id={`card-title-${index}`}
                    className="text-primary mb-3 text-xl font-semibold"
                  >
                    {getTextContent(card.title) ||
                      getTextContent(card.name) ||
                      'Resource'}
                  </h3>
                  {card.description && (
                    <div
                      className="prose prose-sm max-w-none text-gray-600"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(getHtmlContent(card.description)),
                      }}
                    />
                  )}
                  <div className="text-primary mt-4 text-sm font-medium">
                    Learn more <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Basic HTML sanitization function
function sanitizeHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/javascript:/g, '');
}
