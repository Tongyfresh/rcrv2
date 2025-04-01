import type { NextConfig } from 'next';

// Get base URL or fallback to localhost
const drupalBaseUrl =
  process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'http://127.0.0.1';

// Parse URL to extract hostname and port
let hostname = '127.0.0.1';
let port: string | undefined;

try {
  const url = new URL(drupalBaseUrl);
  hostname = url.hostname;
  port = url.port || undefined;
} catch (e) {
  console.warn('Invalid DRUPAL_BASE_URL, using default: 127.0.0.1');
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname,
        port,
        pathname: '/**',
      },
      // Add HTTPS pattern if needed
      {
        protocol: 'https',
        hostname,
        port,
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
