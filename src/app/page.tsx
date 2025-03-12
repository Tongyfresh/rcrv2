import { DrupalResponse } from '@/types/drupal';

export default async function Home() {
  const apiUrl = process.env.DRUPAL_API_URL;

  if (!apiUrl) {
    throw new Error('DRUPAL_API_URL is not defined');
  }

  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'Accept': 'application/vnd.api+json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status}`);
    }

    const data: DrupalResponse = await res.json();
    console.log('Drupal response:', JSON.stringify(data, null, 2));

    if (!data.data?.length) {
      return <div>No content available</div>;
    }

    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to My Site</h1>
        <div className="grid gap-6">
          {data.data.map((page) => (
            <article key={page.id} className="prose max-w-none">
              <h2>{page.attributes.title}</h2>
              {page.attributes.body && page.attributes.body.value ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: page.attributes.body.value }} 
                  className="mt-4"
                />
              ) : (
                <p>No content available for this page</p>
              )}
            </article>
          ))}
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching Drupal data:', error);
    return <div>Error loading content. Please try again later.</div>;
  }
}