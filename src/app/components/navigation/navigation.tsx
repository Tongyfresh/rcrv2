'use client'

import { useState } from 'react';

interface NavigationProps {
  logoUrl?: string;
}

const Navigation = ({ logoUrl }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-b from-secondary/50 to-white">
      <div className="max-w-full mx-auto pr-20">
        <div className="flex justify-between items-center h-20">
          {/* Logo with Text */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <a href="/" className="flex items-center">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-auto w-auto"
                style={{ maxHeight: '110px' }} 
              />
              <span className="text-4xl tracking-[.1em] ml-4 text-primary underline">
                RCR
              </span>
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden text-primary md:flex divide-x divide-gray flex-row space-between">
          <a href="/home" className="hover:text-black transition-colors px-6 py-4 border-x border-gray-300 hover:bg-gray-100 flex items-center justify-center min-h-[64px]">
          Home
            </a>
            <a href="/about" className="hover:text-black transition-colors px-6 py-4 border-x border-gray-300 hover:bg-gray-100 flex items-center justify-center min-h-[64px]">
            About Us
            </a>
            <a href="/services" className="hover:text-black transition-colors px-6 py-4 border-x border-gray-300 hover:bg-gray-100 flex items-center justify-center min-h-[64px]">
            Services
            </a>
            <a href="/rcr_toolbox" className="hover:text-black transition-colors px-6 py-4 border-x border-gray-300 hover:bg-gray-100 flex items-center justify-center min-h-[64px]">
            RCR Toolbox
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              id="menu-toggle"
              onClick={toggleMobileMenu}
              className="text-primary hover:text-highlight transition-colors focus:outline-none"
            >
              <svg
                className="w-6 h-6"
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
        className={`md:hidden bg-white ${isMobileMenuOpen ? 'block' : 'hidden'}`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <a href="/" className="block text-black hover:text-highlight transition-colors px-3 py-2">
            Home
          </a>
          <a href="/about" className="block text-black hover:text-highlight transition-colors px-3 py-2">
            About
          </a>
          <a href="/services" className="block text-black hover:text-highlight transition-colors px-3 py-2">
            Services
          </a>
          <a href="/contact" className="block text-black hover:text-highlight transition-colors px-3 py-2">
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;