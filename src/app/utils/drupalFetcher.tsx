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

    // Handle different endpoint formats
    // If endpoint contains '/' it's a path with resource type and ID
    // If not, it's just a resource type
    let resourceType = endpoint;
    let apiUrl = '';

    if (endpoint.includes('/')) {
      // It's a path like 'node/article/123' or 'media--image/456'
      apiUrl = `${baseUrl}/jsonapi/${endpoint}`;
      // Extract resource type for fields param
      resourceType = endpoint.split('/')[0];
    } else {
      // It's just a resource type like 'node--article' or 'media--image'
      apiUrl = `${baseUrl}/jsonapi/${endpoint}`;
      resourceType = endpoint;
    }

    console.log(`Resource type: ${resourceType}, Full endpoint: ${endpoint}`);

    const queryParams = [];

    // Handle main resource fields
    if (options.fields?.length) {
      queryParams.push(`fields[${resourceType}]=${options.fields.join(',')}`);
    }

    // Handle includes and their fields
    if (options.include?.length) {
      const uniqueIncludes = [...new Set(options.include)];
      queryParams.push(
        `include=${encodeURIComponent(uniqueIncludes.join(','))}`
      );

      // Add generic media image fields only if not already specified
      if (uniqueIncludes.some((include) => include.includes('field_'))) {
        // Check if media--image fields are already specified
        if (
          !options.fields?.some((field) => field.includes('field_media_image'))
        ) {
          queryParams.push(`fields[media--image]=name,field_media_image`);
        }

        // Check if file--file fields are already specified
        if (
          !queryParams.some((param) => param.includes('fields[file--file]'))
        ) {
          queryParams.push(`fields[file--file]=uri,url`);
        }
      }
    }

    // Add filters
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle complex filter conditions
          if ('value' in value) {
            queryParams.push(
              `filter[${key}][value]=${encodeURIComponent(String(value.value))}`
            );
          }
          if ('operator' in value) {
            queryParams.push(
              `filter[${key}][operator]=${encodeURIComponent(String(value.operator))}`
            );
          }
        } else {
          // Simple filter
          queryParams.push(
            `filter[${key}][value]=${encodeURIComponent(String(value))}`
          );
        }
      });
    }

    // Add status filter if not already specified
    if (!options.filter?.status) {
      queryParams.push('filter[status][value]=1');
    }

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
      // Only log detailed errors during development
      if (process.env.NODE_ENV === 'development') {
        console.error(`API error: ${response.status} for ${apiUrl}`);
      } else {
        // In production, only log critical errors (500+)
        if (response.status >= 500) {
          console.error(`Server error: ${response.status}`);
        }
      }

      // For 404s from media queries, this is often expected when checking for optional content
      if (
        response.status === 404 &&
        (endpoint.includes('media') || endpoint.includes('file'))
      ) {
        // Silent fail for media/file 404s
        return { data: [] };
      }

      // Return empty data structure that matches what your code expects
      return { data: [] };
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return { data: [] }; // Return empty data on error
  }
}
