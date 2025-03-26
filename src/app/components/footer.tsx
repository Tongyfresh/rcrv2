'use client';

import Link from 'next/link';
import {
  FaMapMarkerAlt,
  FaToolbox,
  FaEnvelope,
  FaPhone,
  FaExternalLinkAlt,
} from 'react-icons/fa';

interface FooterProps {
  contactEmail?: string;
  contactPhone?: string;
}

export default function Footer({
  contactEmail = 'contact@rcr.org',
  contactPhone = '(800) 555-1234',
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Quick Links Column */}
          <div>
            <h2 className="font-body text-primary mb-6 text-2xl font-medium">
              Quick Links
            </h2>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/locations"
                  className="hover:text-highlight flex items-center gap-2 text-gray-700 transition-colors"
                >
                  <FaMapMarkerAlt className="text-primary" />
                  <span>Locations</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/toolbox"
                  className="hover:text-highlight flex items-center gap-2 text-gray-700 transition-colors"
                >
                  <FaToolbox className="text-primary" />
                  <span>Toolbox Resources</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/partnerships"
                  className="hover:text-highlight flex items-center gap-2 text-gray-700 transition-colors"
                >
                  <FaExternalLinkAlt className="text-primary" />
                  <span>Partnership Opportunities</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information Column */}
          <div>
            <h2 className="font-body text-primary mb-6 text-2xl font-medium">
              Contact Us
            </h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-primary" />
                <Link
                  href={`mailto:${contactEmail}`}
                  className="hover:text-highlight text-gray-700 transition-colors"
                >
                  {contactEmail}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <FaPhone className="text-primary" />
                <Link
                  href={`tel:${contactPhone.replace(/[^0-9]/g, '')}`}
                  className="hover:text-highlight text-gray-700 transition-colors"
                >
                  {contactPhone}
                </Link>
              </li>
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h2 className="font-body text-primary mb-6 text-2xl font-medium">
              About RCR
            </h2>
            <p className="mb-4 text-gray-700">
              Rural Connections to Research (RCR) is dedicated to expanding
              access to clinical trials and research opportunities for rural
              communities across the Mountain West.
            </p>
            <Link
              href="/about"
              className="text-primary hover:text-highlight inline-flex items-center gap-1 transition-colors"
            >
              Learn more about our mission
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-300 pt-8 text-center text-gray-600">
          <p>
            © {currentYear} Rural Connections to Research. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
