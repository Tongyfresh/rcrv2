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

  return (
    <section className="bg-secondary/70 overflow-hidden py-10">
      {title && (
        <h2 className="text-primary mb-6 text-center text-3xl font-medium">
          {title}
        </h2>
      )}
      <div className="w-full">
        {scrolling ? (
          <div className="relative overflow-hidden">
            <div className="hover:pause-animation flex animate-[scroll_40s_linear_infinite] whitespace-nowrap will-change-transform">
              {/* Duplicate partners multiple times to ensure coverage across the screen */}
              {[...partners, ...partners, ...partners].map((partner, index) => (
                <div
                  key={`${partner.id}-${index}`}
                  className="relative mx-4 inline-block h-20 w-40 flex-shrink-0 transition-transform hover:scale-110"
                >
                  <Link
                    href={partner.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full w-full"
                    title={`Visit ${partner.name}`}
                    aria-label={`${partner.name} website`}
                  >
                    {partner.url ? (
                      <>
                        {!imageLoadState[`${partner.id}-${index}`] && (
                          <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gray-200">
                            <div className="h-12 w-12 rounded-full bg-gray-300" />
                          </div>
                        )}
                        <Image
                          src={getSafeUrl(partner.url)}
                          alt={`${partner.name} logo`}
                          fill
                          sizes="160px"
                          className={`object-contain transition-opacity duration-300 ${
                            imageLoadState[`${partner.id}-${index}`]
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                          onLoad={() =>
                            handleImageLoaded(`${partner.id}-${index}`)
                          }
                          onError={() =>
                            handleImageError(
                              `${partner.id}-${index}`,
                              partner.name
                            )
                          }
                          priority={false}
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                        {partner.name || 'Partner Logo'}
                      </div>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="relative h-20 w-40 flex-shrink-0 transition-transform hover:scale-110"
              >
                <Link
                  href={partner.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full w-full"
                  title={`Visit ${partner.name}`}
                  aria-label={`${partner.name} website`}
                >
                  {partner.url ? (
                    <>
                      {!imageLoadState[partner.id] && (
                        <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gray-200">
                          <div className="h-12 w-12 rounded-full bg-gray-300" />
                        </div>
                      )}
                      <Image
                        src={getSafeUrl(partner.url)}
                        alt={`${partner.name} logo`}
                        fill
                        sizes="160px"
                        className={`object-contain transition-opacity duration-300 ${
                          imageLoadState[partner.id]
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoaded(partner.id)}
                        onError={() =>
                          handleImageError(partner.id, partner.name)
                        }
                        priority={false}
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                      {partner.name || 'Partner Logo'}
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
