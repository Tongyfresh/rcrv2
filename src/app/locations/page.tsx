import { Metadata } from 'next';
import Image from 'next/image';
import {
  fetchLocationsData,
  fetchHomePageData,
} from '@/app/utils/drupalFetcher';
import {
  processLocationsData,
  processHomePageData,
} from '@/app/utils/contentProcessor';
import { ProcessedLocation } from '@/types/drupal';
import { RichTextContent } from '@/app/utils/richTextContent'; // Assuming summaries might have HTML
import { getFallbackImage } from '@/app/utils/urlHelper';

export const metadata: Metadata = {
  title: 'Our Locations | Rural Connections to Research',
  description:
    'Explore the network of research sites collaborating with Rural Connections to Research across the Mountain West.',
};

export default async function LocationsPage() {
  // Fetch locations data
  const locationsRawData = await fetchLocationsData();
  const locations: ProcessedLocation[] = processLocationsData(locationsRawData);

  // Fetch home page data specifically for the map image
  // TODO: Consider optimizing this if only map is needed (Task 2.2)
  const homeRawData = await fetchHomePageData();
  const { mapImageUrl } = processHomePageData(homeRawData);

  console.log(`Fetched ${locations.length} locations.`);
  if (locations.length > 0) {
    console.log('First location data:', locations[0]);
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Title Section */}
      <section className="bg-primary/10 py-12 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-primary font-title mb-4 text-4xl font-bold md:text-5xl">
            Our Research Network Locations
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-700">
            Discover the healthcare facilities and community sites partnering
            with RCR to bring clinical research closer to rural populations.
          </p>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-primary mb-10 text-center text-3xl font-semibold">
            Network Overview
          </h2>
          <div className="flex justify-center">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-lg shadow-lg">
              {mapImageUrl ? (
                <Image
                  src={mapImageUrl}
                  alt="RCR Partner Locations Map"
                  width={800} // Adjust size as needed
                  height={600} // Adjust size as needed
                  className="object-contain"
                />
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-lg bg-gray-200 p-8">
                  <p className="text-center text-gray-500">
                    Map image not available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Locations Grid Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-primary mb-10 text-center text-3xl font-semibold">
            Partner Sites
          </h2>

          {locations.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Location Logo */}
                  <div className="flex h-40 items-center justify-center bg-gray-100 p-4">
                    {location.logoUrl ? (
                      <Image
                        src={location.logoUrl}
                        alt={`${location.name} Logo`}
                        width={150}
                        height={100}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        {location.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-grow flex-col p-6">
                    <h3 className="text-primary mb-3 text-xl font-bold">
                      {location.name}
                    </h3>

                    {/* Project Summary */}
                    {location.projectSummary ? (
                      <div className="prose prose-sm mb-4 flex-grow text-gray-600">
                        <h4 className="mb-1 text-sm font-semibold text-gray-800">
                          Project Highlights:
                        </h4>
                        <RichTextContent content={location.projectSummary} />
                      </div>
                    ) : (
                      <p className="mb-4 flex-grow text-sm text-gray-500 italic">
                        No project details available.
                      </p>
                    )}

                    {/* Optional: Display body content if needed (maybe behind a modal/link) */}
                    {/* {location.body && <div className="mt-auto">...</div>} */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center">
              <h3 className="mb-2 text-xl font-semibold text-yellow-800">
                No Locations Found
              </h3>
              <p className="text-yellow-700">
                Location details are currently unavailable. Please check back
                later.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
