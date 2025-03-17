import type { Metadata } from "next";
import "./globals.css";
import Navigation from './components/navigation/navigation';
import { fetchLogoUrl } from './lib/api';

export const metadata: Metadata = {
  title: "RCR",
  description: "Rural Connections to Research",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let logoUrl: string | undefined;
  try {
    logoUrl = await fetchLogoUrl();
  } catch (error) {
    console.error('Failed to fetch logo:', error);
    logoUrl = undefined;
  }

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/zri4qdg.css" />
      </head>
      <body className="min-h-screen bg-white">
        <header>
          <Navigation logoUrl={logoUrl} />
        </header>
        <main>
          {children}
        </main>
        <footer className="bg-gray-50 mt-auto">
          {/* Add footer content here if needed */}
        </footer>
      </body>
    </html>
  );
}