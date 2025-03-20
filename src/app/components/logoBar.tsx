'use client';

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';

type Partner = {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
};

type LogoBarProps = {
  partners: Partner[];
};

const LogoBar: React.FC<LogoBarProps> = ({ partners }) => {
  const validPartners = partners.filter((partner) => partner.logoUrl);
  const duplicatedPartners = [...validPartners, ...validPartners];

  return (
    <div className="bg-secondary/60 w-full overflow-hidden py-16">
      <div className="container mx-auto">
        <h2 className="font-body text-primary text-shadow-sm mb-8 text-center text-5xl uppercase"></h2>

        <div className="relative">
          <div className="animate-infinite-scroll -mt-7 flex w-max gap-20 hover:[animation-play-state:paused]">
            {duplicatedPartners.map((partner, index) => (
              <Link
                key={`${partner.id}-${index}`}
                href={partner.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-shrink-0 items-center transition-transform hover:scale-105"
              >
                {partner.logoUrl && (
                  <Image
                    src={partner.logoUrl}
                    alt={partner.name}
                    width={150}
                    height={75}
                    className="block h-20 w-auto object-contain"
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoBar;
