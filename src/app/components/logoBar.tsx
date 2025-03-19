'use client';

import Image from 'next/image';
import React from 'react';

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

  return (
    <div className="w-full bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="font-body text-primary mb-8 text-center text-2xl">
          Our Partners
        </h2>

        <div className="grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-4 lg:grid-cols-6">
          {validPartners.map((partner) => (
            <a
              key={partner.id}
              href={partner.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              {partner.logoUrl && (
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  width={150}
                  height={75}
                  className="h-16 object-contain"
                />
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoBar;
