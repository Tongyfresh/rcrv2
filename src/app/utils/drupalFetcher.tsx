// Define filter value types that Drupal's JSON:API accepts
type FilterValue = {
  value?: string | number | boolean;
  operator?: string;
  path?: string;
  condition?: {
    path: string;
    value: string | number | boolean;
    operator?: string;
  };
};

type FetchOptions = {
  fields?: string[];
  include?: string[];
  revalidate?: number;
  filter?: {
    [key: string]: FilterValue | string | number | boolean;
  };
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
      console.error('API URL not configured');
      return { data: [] }; // Return empty data instead of throwing
    }
    // Extract the resource type from the endpoint
    const [type] = endpoint.split('/');
    let apiUrl = `${baseUrl}/jsonapi/${endpoint}`;
    const queryParams = [];

    // Handle main resource fields
    if (options.fields?.length) {
      queryParams.push(`fields[${type}]=${options.fields.join(',')}`);
    }

    // Handle includes and their fields
    if (options.include?.length) {
      const uniqueIncludes = [...new Set(options.include)];
      queryParams.push(
        `include=${encodeURIComponent(uniqueIncludes.join(','))}`
      );

      // Add generic media image fields
      if (uniqueIncludes.some((include) => include.includes('field_'))) {
        queryParams.push(`fields[media--image]=name,field_media_image`);
        queryParams.push(`fields[file--file]=uri,url`);
      }
    }

    // Add status filter
    queryParams.push('filter[status][value]=1');

    if (queryParams.length > 0) {
      apiUrl += `?${queryParams.join('&')}`;
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching from:', apiUrl);
    }

    const response = await fetch(apiUrl, {
      next: { revalidate: options.revalidate || 3600 },
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return { data: [] }; // Return empty data on error
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return { data: [] }; // Return empty data on error
  }
}
