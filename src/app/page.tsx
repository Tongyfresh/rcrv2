import { DrupalResponse } from '@/types/drupal';

export default async function Home() {
  const baseUrl = process.env.DRUPAL_API_URL?.split('/jsonapi')[0];

  if (!baseUrl) {
    throw new Error('DRUPAL_API_URL is not defined');
  }

  // Only request specific fields to avoid relationship issues
  const apiUrl = `${baseUrl}/jsonapi/node/home_page?fields[node--home_page]=title,body`;
  console.log('Requesting URL:', apiUrl);

  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/vnd.api+json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Response Headers:', Object.fromEntries(res.headers.entries()));
      console.error('Response Status:', res.status);
      console.error('Error Text:', errorText);
      throw new Error(`Failed to fetch data: ${res.status} - ${errorText}`);
    }

    const data: DrupalResponse = await res.json();

    if (!data.data?.[0]) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Homepage content not found
          </div>
        </div>
      );
    }

    const homePage = data.data[0];
    return (
      <main className="container mx-auto px-4 py-8">
        <article className="prose max-w-none">
          {/* Title */}
          <h1 className="text-3xl font-bold mb-6 text-primary">
            {homePage.attributes.title}
          </h1>

          {/* Body Content */}
          {homePage.attributes.body && homePage.attributes.body.value ? (
            <div
              dangerouslySetInnerHTML={{ __html: homePage.attributes.body.value }}
              className="mt-4 text-secondary"
            />
          ) : (
            <p className="text-secondary">No content available</p>
          )}

          {/* Quick Links (Example) */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              Quick Links
            </h2>
            <ul className="space-y-2">
              <li>
                <a
                  href="/locations"
                  className="text-white hover:text-highlight transition-colors"
                >
                  Locations
                </a>
              </li>
              <li>
                <a
                  href="/toolbox"
                  className="text-white hover:text-highlight transition-colors"
                >
                  Toolbox Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-secondary">
            Contact us at: <span className="text-highlight">info@example.com</span>
          </footer>
        </article>
      </main>
    );
  } catch (error) {
    console.error('Detailed error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? error.cause : null,
    });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading homepage. Please try again later.</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}