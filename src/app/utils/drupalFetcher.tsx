type FetchOptions = {
  fields?: string[];
  include?: string[];
  revalidate?: number;
};

export async function fetchDrupalData(
  endpoint: string,
  options: FetchOptions = {}
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split(
      '/jsonapi'
    )[0]?.replace(/[/]+$/, '');
    if (!baseUrl) {
      throw new Error('API URL not configured');
    }

    const [type, resourceType] = endpoint.split('/');
    let apiUrl = `${baseUrl}/jsonapi/${endpoint}`;
    const queryParams = [];

    if (options.fields?.length) {
      queryParams.push(`fields[${type}]=${options.fields.join(',')}`);
    }

    if (options.include?.length) {
      // Remove duplicates and join includes
      const uniqueIncludes = [...new Set(options.include)];
      queryParams.push(
        `include=${encodeURIComponent(uniqueIncludes.join(','))}`
      );

      if (options.include.includes('field_hero_image')) {
        queryParams.push(`fields[media--image]=name,field_media_image`);
      }
      if (options.include.includes('field_hero_image.field_media_image')) {
        queryParams.push(`fields[file--file]=uri,url`);
      }
    }

    queryParams.push('filter[status][value]=1');

    if (queryParams.length > 0) {
      apiUrl += `?${queryParams.join('&')}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching from:', apiUrl);
    }

    const response = await fetch(apiUrl, {
      next: { revalidate: options.revalidate || 3600 },
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Basic ${process.env.NEXT_PUBLIC_DRUPAL_AUTH_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch data: ${response.status}\n${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
