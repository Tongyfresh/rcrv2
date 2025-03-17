export async function fetchLogoUrl() {
  const baseUrl = process.env.DRUPAL_API_URL?.split('/jsonapi')[0];

  if (!baseUrl) {
    throw new Error('DRUPAL_API_URL is not defined');
  }

  try {
    // Request the file using JSON:API endpoint
    const res = await fetch(`${baseUrl}/jsonapi/file/file?filter[filename]=Untitled-1.png`, {
      headers: {
        'Accept': 'application/vnd.api+json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch logo: ${res.status}`);
    }

    const data = await res.json();

    // Check if we got any data
    if (!data.data || data.data.length === 0) {
      throw new Error('Logo not found');
    }

    // Construct the full URL by combining baseUrl with the relative path
    const logoPath = data.data[0].attributes.uri.url;
    return `${baseUrl}${logoPath}`;
  } catch (error) {
    console.error('Error fetching logo:', error);
    throw error;
  }
}