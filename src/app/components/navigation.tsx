'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const pathname = usePathname();

  // Fetch logo on component mount
  useEffect(() => {
    async function fetchLogo() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;
        if (!baseUrl) {
          console.error('NEXT_PUBLIC_DRUPAL_BASE_URL is not configured');
          return;
        }

        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        const apiUrl = `${cleanBaseUrl}/jsonapi/node/home_page?fields[node--home_page]=field_rcr_logo&include=field_rcr_logo,field_rcr_logo.field_media_image&fields[media--image]=field_media_image&fields[file--file]=uri,url`;

        console.log('Fetching logo from:', apiUrl);

        const response = await fetch(apiUrl, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Logo API response:', data);

        const logoPath = extractLogoPath(data);
        if (logoPath) {
          const fullLogoUrl = logoPath.startsWith('http')
            ? logoPath
            : `${cleanBaseUrl}${logoPath}`;
          console.log('Setting logo URL to:', fullLogoUrl);
          setLogoUrl(fullLogoUrl);
          setLogoError(false);
        } else {
          throw new Error('Logo path not found in API response');
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
        setLogoError(true);
      }
    }

    fetchLogo();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  function extractLogoPath(data: any): string | null {
    try {
      // Check if data has the expected structure
      if (!data?.data?.[0]?.relationships?.field_rcr_logo?.data) {
        console.log('No logo relationship found in data');
        return null;
      }

      const mediaRef = data.data[0].relationships.field_rcr_logo.data;
      console.log('Media reference:', mediaRef);

      const media = data.included?.find(
        (item: any) => item.id === mediaRef.id && item.type === mediaRef.type
      );

      if (!media) {
        console.log('Media not found in included items');
        return null;
      }

      const fileRef = media.relationships?.field_media_image?.data;
      if (!fileRef) {
        console.log('File reference not found in media');
        return null;
      }

      const file = data.included?.find(
        (item: any) => item.id === fileRef.id && item.type === fileRef.type
      );

      if (!file) {
        console.log('File not found in included items');
        return null;
      }

      const url = file.attributes?.uri?.url || file.attributes?.url;
      console.log('Extracted URL:', url);
      return url;
    } catch (e) {
      console.error('Error extracting logo path:', e);
      return null;
    }
  }

  return (
    <nav className="from-secondary/50 bg-gradient-to-b to-white">
      <div className="mx-auto max-w-full pr-20">
        <div className="flex h-20 items-center justify-between">
          {/* Logo with Text */}
          <div className="flex flex-shrink-0 items-center gap-4">
            <Link href="/" className="flex items-center">
              <div className="relative h-[110px] w-[110px]">
                {logoUrl && !logoError ? (
                  <Image
                    src={logoUrl}
                    alt="RCR Logo"
                    fill
                    sizes="110px"
                    priority
                    className="object-contain"
                    onError={() => {
                      console.error('Failed to load logo:', logoUrl);
                      setLogoError(true);
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100/50">
                    <span className="text-gray-400">RCR</span>
                  </div>
                )}
              </div>
              <span className="text-primary ml-4 text-4xl tracking-[.1em] underline">
                RCR
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="text-primary divide-gray space-between hidden flex-row divide-x md:flex">
            <Link
              href="/"
              className={`flex min-h-[64px] items-center justify-center border-x border-gray-300 px-6 py-4 transition-colors hover:bg-gray-100 hover:text-black ${
                pathname === '/' ? 'bg-gray-100 text-black' : ''
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`flex min-h-[64px] items-center justify-center border-x border-gray-300 px-6 py-4 transition-colors hover:bg-gray-100 hover:text-black ${
                pathname === '/about' ? 'bg-gray-100 text-black' : ''
              }`}
            >
              About Us
            </Link>
            <Link
              href="/services"
              className={`flex min-h-[64px] items-center justify-center border-x border-gray-300 px-6 py-4 transition-colors hover:bg-gray-100 hover:text-black ${
                pathname === '/services' ? 'bg-gray-100 text-black' : ''
              }`}
            >
              Services
            </Link>
            <Link
              href="/locations"
              className={`flex min-h-[64px] items-center justify-center border-x border-gray-300 px-6 py-4 transition-colors hover:bg-gray-100 hover:text-black ${
                pathname === '/locations' ? 'bg-gray-100 text-black' : ''
              }`}
            >
              Locations
            </Link>
            <Link
              href="/rcrToolbox"
              className={`flex min-h-[64px] items-center justify-center border-x border-gray-300 px-6 py-4 transition-colors hover:bg-gray-100 hover:text-black ${
                pathname === '/rcrToolbox' ? 'bg-gray-100 text-black' : ''
              }`}
            >
              RCR Toolbox
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              id="menu-toggle"
              onClick={toggleMobileMenu}
              className="text-primary hover:text-highlight transition-colors focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Hidden by Default) */}
      <div
        id="mobile-menu"
        className={`bg-white md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}
      >
        <div className="space-y-1 px-2 pt-2 pb-3">
          <Link
            href="/"
            className="hover:text-highlight block px-3 py-2 text-black transition-colors"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="hover:text-highlight block px-3 py-2 text-black transition-colors"
          >
            About
          </Link>
          <Link
            href="/services"
            className="hover:text-highlight block px-3 py-2 text-black transition-colors"
          >
            Services
          </Link>
          <Link
            href="/locations"
            className="hover:text-highlight block px-3 py-2 text-black transition-colors"
          >
            Locations
          </Link>
          <Link
            href="/rcrToolbox"
            className="hover:text-highlight block px-3 py-2 text-black transition-colors"
          >
            RCR Toolbox
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
