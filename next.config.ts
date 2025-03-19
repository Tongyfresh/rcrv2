import type { NextConfig } from 'next';

// Extract domain from DRUPAL_API_URL
const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_API_URL
  ? new URL(process.env.NEXT_PUBLIC_DRUPAL_API_URL).hostname
  : '127.0.0.1';

const nextConfig: NextConfig = {
  images: {
    domains: [drupalUrl],
  },
  env: {
    NEXT_PUBLIC_DRUPAL_API_URL: process.env.NEXT_PUBLIC_DRUPAL_API_URL,
    NEXT_PUBLIC_DRUPAL_AUTH_TOKEN: process.env.NEXT_PUBLIC_DRUPAL_AUTH_TOKEN,
  },
};

export default nextConfig;
