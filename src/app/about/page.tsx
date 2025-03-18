import { DrupalResponse } from '@/types/drupal';
import Navigation from '../components/navigation';


export default async function About() {
  const baseUrl = process.env.DRUPAL_API_URL;

  if (!baseUrl) {
    throw new Error('DRUPAL_API_URL is not defined');
  }

  // Try filtering by node ID instead of path alias
  const apiUrl = `${baseUrl}?filter[drupal_internal__nid]=4`;
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
      throw new Error(`Failed to fetch data: ${res.status} - ${errorText}`);
    }

    const data: DrupalResponse = await res.json();

    if (!data.data?.[0]) {
      return <div>About page content not found</div>;
    }

    const aboutPage = data.data[0];

    return (
      <main className="container mx-auto px-4 py-8">
        <article className="prose max-w-none">
          <h1 className="text-3xl font-bold mb-6">{aboutPage.attributes.title}</h1>
          {aboutPage.attributes.body && aboutPage.attributes.body.value ? (
            <div 
              dangerouslySetInnerHTML={{ __html: aboutPage.attributes.body.value }} 
              className="mt-4"
            />
          ) : (
            <p>No content available</p>
          )}
        </article>
      </main>
    );
  } catch (error) {
    console.error('Error fetching about page:', error);
    return <div>Error loading about page. Please try again later.</div>;
  }
}