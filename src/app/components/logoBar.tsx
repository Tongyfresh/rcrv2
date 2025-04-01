'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

// Partner interface definition
export interface Partner {
  id: string;
  name: string;
  url: string | null;
  link: string;
}

interface LogoBarProps {
  partners: Partner[];
  title?: string;
  scrolling?: boolean;
}

export default function LogoBar({
  partners,
  title = 'Our Partners',
  scrolling = true,
}: LogoBarProps) {
  const [imageLoadState, setImageLoadState] = useState<Record<string, boolean>>(
    {}
  );

  if (!partners || partners.length === 0) {
    return null;
  }

  const handleImageLoaded = (id: string) => {
    setImageLoadState((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string, name: string) => {
    console.warn(`Failed to load partner logo: ${name}`);
    setImageLoadState((prev) => ({ ...prev, [id]: true }));
  };

  const getSafeUrl = (url: string | null): string => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/sites/') || url.startsWith('/files/')) {
      const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || '';
      return `${baseUrl}${url}`;
    }
    return url;
  };

  // Create a reusable logo component to avoid repetition
  const LogoItem = ({
    partner,
    index,
    isInMarquee = false,
  }: {
    partner: Partner;
    index: string | number;
    isInMarquee?: boolean;
  }) => (
    <div className="mx-6 my-2 inline-block h-25 w-60 flex-shrink-0">
      <Link
        href={partner.link || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full"
        title={`Visit ${partner.name}`}
        aria-label={`${partner.name} website`}
      >
        {partner.url ? (
          <div className="relative h-full w-full">
            {!imageLoadState[`${partner.id}-${index}`] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="h-12 w-12 rounded-full bg-gray-300" />
              </div>
            )}
            <Image
              src={getSafeUrl(partner.url)}
              alt={`${partner.name} logo`}
              fill
              sizes="160px"
              className={`object-contain transition-transform duration-300 hover:scale-110`}
              onLoad={() => handleImageLoaded(`${partner.id}-${index}`)}
              onError={() =>
                handleImageError(`${partner.id}-${index}`, partner.name)
              }
              priority={index === 0 || index === 'a-0' || index === 'b-0'}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
            {partner.name || 'Partner Logo'}
          </div>
        )}
      </Link>
    </div>
  );

  return (
    <section className="bg-secondary/50 overflow-hidden py-10">
      {title && (
        <h2 className="text-primary/70 text-shadow-sm mb-6 text-center text-3xl font-medium">
          {title}
        </h2>
      )}
      <div className="w-full">
        {scrolling ? (
          // Marquee container
          <div className="relative flex overflow-hidden">
            {/* First marquee animation */}
            <div className="animate-marquee flex whitespace-nowrap">
              {partners.map((partner, index) => (
                <LogoItem
                  key={`${partner.id}-a-${index}`}
                  partner={partner}
                  index={`a-${index}`}
                  isInMarquee={true}
                />
              ))}
            </div>

            {/* Second marquee animation - starts after the first one */}
            <div className="animate-marquee2 absolute top-0 flex whitespace-nowrap">
              {partners.map((partner, index) => (
                <LogoItem
                  key={`${partner.id}-b-${index}`}
                  partner={partner}
                  index={`b-${index}`}
                  isInMarquee={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <LogoItem key={partner.id} partner={partner} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
