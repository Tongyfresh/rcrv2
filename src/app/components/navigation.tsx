'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  logoUrl?: string;
}

const Navigation = ({ logoUrl }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="from-secondary/50 bg-gradient-to-b to-white">
      <div className="mx-auto max-w-full pr-20">
        <div className="flex h-20 items-center justify-between">
          {/* Logo with Text */}
          <div className="flex flex-shrink-0 items-center gap-4">
            <Link href="/" className="flex items-center">
              {logoUrl ? (
                <div className="relative h-[110px] w-[110px]">
                  <Image
                    src={logoUrl}
                    alt="RCR Logo"
                    fill
                    sizes="110px"
                    priority
                    className="object-contain"
                  />
                </div>
              ) : (
                // No fallback, just show the text
                <div className="h-[110px] w-[110px]"></div>
              )}
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
              href="/rcr_toolbox"
              className={`flex min-h-[64px] items-center justify-center border-x border-gray-300 px-6 py-4 transition-colors hover:bg-gray-100 hover:text-black ${
                pathname === '/rcr_toolbox' ? 'bg-gray-100 text-black' : ''
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
            href="/contact"
            className="hover:text-highlight block px-3 py-2 text-black transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
