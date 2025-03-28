/**
 * Drupal API Fetcher
 * Handles communication with Drupal's JSON:API
 */

// Update the import statement at the top of the file
import { DrupalResponse, DrupalEntity, FetchOptions } from '@/types/drupal';

/**
 * Field name mapping to handle mismatches between expected and actual field names
 */
function correctFieldName(fieldName: string): string {
  // Map of incorrect field names to correct ones
  const fieldNameMap: Record<string, string> = {
    field_map_image: 'field_rcr_map_image',
    // Add other mappings as needed
  };

  return fieldNameMap[fieldName] || fieldName;
}

/**
 * Parse and build the Drupal API URL
 */
function buildApiUrl(endpoint: string): {
  apiUrl: string;
  resourceType: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split(
    '/jsonapi'
  )[0]?.replace(/[/]+$/, '');

  if (!baseUrl) {
    throw new Error('API URL not configured');
  }

  let resourceType = endpoint;
  let apiUrl = '';
  const usesDoubleHyphen = endpoint.includes('--');

  // Handle different endpoint formats (entity/bundle vs entity--bundle)
  if (endpoint.includes('/')) {
    // It's a path with ID
    const parts = endpoint.split('/');
    resourceType = parts[0];
    apiUrl = `${baseUrl}/jsonapi/${endpoint}`;
  } else {
    // It's just a resource type
    if (usesDoubleHyphen && endpoint === 'media--image') {
      apiUrl = `${baseUrl}/jsonapi/media/image`;
      resourceType = 'media';
    } else {
      apiUrl = `${baseUrl}/jsonapi/${endpoint}`;
    }
  }

  return { apiUrl, resourceType };
}

/**
 * Build query parameters for the Drupal JSON:API request
 */
function buildQueryParams(
  options: FetchOptions,
  resourceType: string
): string[] {
  const queryParams: string[] = [];

  // Add fields parameter
  if (options.fields?.length) {
    const correctedFields = options.fields.map(correctFieldName);

    if (resourceType === 'media--image' || resourceType === 'media') {
      queryParams.push(`fields[media]=${correctedFields.join(',')}`);
    } else {
      queryParams.push(`fields[${resourceType}]=${correctedFields.join(',')}`);
    }
  }

  // Add includes parameter
  if (options.include?.length) {
    const correctedIncludes = options.include.map((include) => {
      const parts = include.split('.');
      const correctedParts = parts.map(correctFieldName);
      return correctedParts.join('.');
    });

    const uniqueIncludes = [...new Set(correctedIncludes)];
    queryParams.push(`include=${encodeURIComponent(uniqueIncludes.join(','))}`);

    // Add media fields when including relationships
    if (uniqueIncludes.some((include) => include.includes('field_'))) {
      if (
        !queryParams.some((param) => param.includes('fields[media--image]'))
      ) {
        queryParams.push(`fields[media--image]=name,field_media_image`);
      }

      if (!queryParams.some((param) => param.includes('fields[file--file]'))) {
        queryParams.push(`fields[file--file]=uri,url`);
      }
    }
  }

  // Add filters
  if (options.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Complex filters
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
        // Simple filters
        queryParams.push(
          `filter[${key}][value]=${encodeURIComponent(String(value))}`
        );
      }
    });
  }

  // Add published status filter if not already specified
  if (!options.filter?.status) {
    queryParams.push('filter[status][value]=1');
  }

  return queryParams;
}

/**
 * Main function to fetch data from Drupal's JSON:API
 */
export async function fetchDrupalData(
  endpoint: string,
  options: FetchOptions = {}
): Promise<DrupalResponse> {
  try {
    // Build the API URL and determine resource type
    const { apiUrl, resourceType } = buildApiUrl(endpoint);

    // Build query parameters
    const queryParams = buildQueryParams(options, resourceType);

    // Construct the full URL
    const fullUrl =
      queryParams.length > 0 ? `${apiUrl}?${queryParams.join('&')}` : apiUrl;

    console.log(`Resource type: ${resourceType}, Full endpoint: ${endpoint}`);
    console.log('Fetching from:', fullUrl);

    // Fetch data from API
    const response = await fetch(fullUrl, {
      next: { revalidate: options.revalidate || 3600 },
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      return handleApiError(response, fullUrl, options);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return { data: [] };
  }
}

/**
 * Handle API error responses
 */
async function handleApiError(
  response: Response,
  url: string,
  options: FetchOptions
): Promise<DrupalResponse> {
  let errorDetail = '';
  try {
    const errorText = await response.text();
    errorDetail = errorText.substring(0, 500);
  } catch (parseError) {
    // Ignore parsing errors
  }

  console.error(`API error: ${response.status} for ${url}`);
  if (errorDetail) {
    console.error(`Error details: ${errorDetail}`);
  }

  // Analyze 400 Bad Request errors
  if (response.status === 400) {
    console.error('Request fields:', options.fields);
    console.error('Request includes:', options.include);

    // Log potentially problematic fields
    const problematicFields = [
      'field_article_image',
      'field_map_image',
      'field_why_rcr_description',
    ];

    problematicFields.forEach((field) => {
      if (options.fields?.includes(field)) {
        console.warn(`${field} might be problematic`);
      }
    });
  }

  return { data: [] };
}

/**
 * Discover available fields for a content type
 */
export async function discoverAvailableFields(
  contentType: string
): Promise<{ fields: string[]; relationships: string[] }> {
  try {
    const response = await fetchDrupalData(contentType, {
      fields: ['title'],
      revalidate: 0,
    });

    if (!response?.data) {
      return { fields: [], relationships: [] };
    }

    const entity = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    const fields = entity ? Object.keys(entity.attributes || {}) : [];
    const relationships =
      entity && entity.relationships ? Object.keys(entity.relationships) : [];

    console.log(`Available fields for ${contentType}:`, fields.join(', '));
    console.log(
      `Available relationships for ${contentType}:`,
      relationships.join(', ')
    );

    return { fields, relationships };
  } catch (error) {
    console.error(`Error discovering fields for ${contentType}:`, error);
    return { fields: [], relationships: [] };
  }
}

/**
 * Fetch homepage data in smaller chunks to avoid API errors
 */
export async function fetchHomePageData(
  options: FetchOptions = {}
): Promise<DrupalResponse> {
  try {
    // Discover available fields
    const { relationships } = await discoverAvailableFields('node/home_page');

    // Check for field presence
    const hasMapImage = relationships.includes('field_rcr_map_image');
    const hasArticleImage = relationships.includes('field_article_image');

    // Basic request - title, body, and main images
    console.log('Fetching basic homepage data...');
    const basicData = await fetchDrupalData('node/home_page', {
      fields: ['title', 'body', 'field_hero_image', 'field_rcr_logo'],
      include: [
        'field_hero_image',
        'field_hero_image.field_media_image',
        'field_rcr_logo',
        'field_rcr_logo.field_media_image',
      ],
      revalidate: options.revalidate || 3600,
    });

    if (!basicData?.data) {
      console.error('Failed to fetch basic homepage data');
      return { data: [] };
    }

    // Card data request
    console.log('Fetching card data...');
    const cardData = await fetchDrupalData('node/home_page', {
      fields: [
        'field_rcr_card_title',
        'field_rcr_card_description',
        'field_rcr_card_images',
      ],
      include: [
        'field_rcr_card_images',
        'field_rcr_card_images.field_media_image',
      ],
      revalidate: options.revalidate || 3600,
    });

    // Partner logos request
    console.log('Fetching partner data...');
    const partnerData = await fetchDrupalData('node/home_page', {
      fields: ['field_partner_logo'],
      include: ['field_partner_logo', 'field_partner_logo.field_media_image'],
      revalidate: options.revalidate || 3600,
    });

    // Additional requests with try/catch for potentially problematic fields

    // Why RCR description
    console.log('Fetching why RCR description...');
    let whyDescriptionData = null;
    try {
      whyDescriptionData = await fetchDrupalData('node/home_page', {
        fields: ['field_why_rcr_description'],
        revalidate: options.revalidate || 3600,
      });
      console.log('Why description fetch succeeded');
    } catch (error) {
      console.log('Why description fetch failed - continuing without it');
    }

    // Article image
    console.log('Fetching article image...');
    let articleImageData = null;
    if (hasArticleImage) {
      try {
        articleImageData = await fetchDrupalData('node/home_page', {
          fields: ['field_article_image'],
          include: [
            'field_article_image',
            'field_article_image.field_media_image',
          ],
          revalidate: options.revalidate || 3600,
        });
        console.log('Article image fetch succeeded');
      } catch (error) {
        console.log('Article image fetch failed - continuing without it');
      }
    }

    // Map image
    console.log('Fetching map image...');
    let mapImageData = null;
    if (hasMapImage) {
      try {
        mapImageData = await fetchDrupalData('node/home_page', {
          fields: ['field_rcr_map_image'],
          include: [
            'field_rcr_map_image',
            'field_rcr_map_image.field_media_image',
          ],
          revalidate: options.revalidate || 3600,
        });
        console.log('Map image fetch succeeded');
      } catch (error) {
        console.log('Map image fetch failed - continuing without it');
      }
    }

    // Merge all successful responses
    const responses = [basicData, cardData, partnerData];
    if (whyDescriptionData?.data) responses.push(whyDescriptionData);
    if (articleImageData?.data) responses.push(articleImageData);
    if (mapImageData?.data) responses.push(mapImageData);

    console.log(`Merging ${responses.length} responses...`);
    return mergeResponses(...responses);
  } catch (error) {
    console.error('Error in fetchHomePageData:', error);
    return { data: [] };
  }
}

/**
 * Merge multiple Drupal responses into a single response
 */
function mergeResponses(...responses: DrupalResponse[]): DrupalResponse {
  // Filter out empty responses
  const validResponses = responses.filter(
    (r) => r?.data && (!Array.isArray(r.data) || r.data.length > 0)
  );

  if (validResponses.length === 0) {
    return { data: [] };
  }

  // Use first response as base
  const baseResponse = validResponses[0];
  const result: DrupalResponse = {
    data: baseResponse.data,
    included: [...(baseResponse.included || [])],
    links: baseResponse.links,
    meta: baseResponse.meta,
  };

  // Process each additional response
  for (let i = 1; i < validResponses.length; i++) {
    const response = validResponses[i];

    // Merge included entities
    mergeIncludedEntities(result, response);

    // Merge data entities
    mergeDataEntities(result, response);
  }

  return result;
}

/**
 * Merge included entities between responses
 */
function mergeIncludedEntities(
  target: DrupalResponse,
  source: DrupalResponse
): void {
  const includedMap = new Map();

  // Add existing included entities
  if (target.included) {
    target.included.forEach((entity) => {
      includedMap.set(`${entity.type}:${entity.id}`, entity);
    });
  }

  // Add new included entities
  if (source.included) {
    source.included.forEach((entity) => {
      includedMap.set(`${entity.type}:${entity.id}`, entity);
    });
  }

  // Update included array
  target.included = Array.from(includedMap.values());
}

/**
 * Merge data entities between responses
 */
function mergeDataEntities(
  target: DrupalResponse,
  source: DrupalResponse
): void {
  // Array data case
  if (Array.isArray(target.data) && Array.isArray(source.data)) {
    const dataMap = new Map(target.data.map((entity) => [entity.id, entity]));

    source.data.forEach((entity) => {
      const existingEntity = dataMap.get(entity.id);
      if (existingEntity) {
        // Merge attributes
        existingEntity.attributes = {
          ...existingEntity.attributes,
          ...entity.attributes,
        };

        // Merge relationships
        if (entity.relationships) {
          existingEntity.relationships = existingEntity.relationships || {};
          Object.entries(entity.relationships).forEach(([key, value]) => {
            existingEntity.relationships![key] = value;
          });
        }
      }
    });

    target.data = Array.from(dataMap.values());
  }
  // Single entity case
  else if (!Array.isArray(target.data) && !Array.isArray(source.data)) {
    // Merge attributes
    target.data.attributes = {
      ...target.data.attributes,
      ...source.data.attributes,
    };

    // Merge relationships
    if (source.data.relationships) {
      target.data.relationships = target.data.relationships || {};
      Object.entries(source.data.relationships).forEach(([key, value]) => {
        if (
          target.data &&
          !Array.isArray(target.data) &&
          target.data.relationships
        ) {
          target.data.relationships[key] = value;
        }
      });
    }
  }
}

/**
 * Fetches About page data from Drupal
 */
export async function fetchAboutPageData() {
  try {
    if (!process.env.NEXT_PUBLIC_DRUPAL_API_URL) {
      console.error('NEXT_PUBLIC_DRUPAL_API_URL is not defined');
      throw new Error('API URL is not configured');
    }

    const url = `${process.env.NEXT_PUBLIC_DRUPAL_API_URL}/node/about?include=field_hero_image,field_hero_image.field_media_image,field_rcr_card_images,field_rcr_card_images.field_media_image`;

    console.log('Fetching About page data from:', url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch about page data: ${response.status}`);
      console.error('Response text:', await response.text());
      throw new Error(`Failed to fetch about page data: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      'About page data fetched successfully. Included items:',
      data.included?.length || 0
    );
    return data;
  } catch (error) {
    console.error('Error fetching about page data:', error);
    return { data: [], included: [] };
  }
}

/**
 * Fetches Services page data from Drupal
 */
export async function fetchServicesPageData() {
  try {
    // Try with the correct content type - node/services
    try {
      const servicesResponse = await fetchDrupalData('node/services', {
        fields: [
          'title',
          'body',
          'field_hero_image',
          'field_staggered_images',
          'field_staggered_text',
        ],
        include: [
          'field_hero_image',
          'field_hero_image.field_media_image',
          'field_staggered_images',
          'field_staggered_images.field_media_image',
        ],
        revalidate: 3600,
      });

      if (servicesResponse?.data) {
        return servicesResponse;
      }
    } catch (e) {
      console.error(
        'Error fetching node/services, trying with specific ID:',
        e
      );
    }

    // If node/services fails, try directly with node ID 13 as fallback
    try {
      const nodeResponse = await fetchDrupalData('node/page', {
        filter: {
          drupal_internal__nid: 13,
        },
        fields: ['title', 'body', 'field_article_image'],
        include: [
          'field_article_image',
          'field_article_image.field_media_image',
        ],
        revalidate: 3600,
      });

      if (nodeResponse?.data) {
        return nodeResponse;
      }
    } catch (e) {
      console.error('Error fetching with node ID 13:', e);
    }

    // No content found, return empty data
    return { data: [] };
  } catch (error) {
    console.error('Error fetching services page data:', error);
    return { data: [] };
  }
}

/**
 * Generic function to fetch page data by path alias
 * @param pathAlias The path alias to fetch (e.g., "/services", "/about")
 * @param fallbackIds Array of node IDs to try if path alias fails
 */
export async function fetchPageByPath(
  pathAlias: string,
  fallbackIds: number[] = []
) {
  try {
    console.log(`Fetching page data for path: ${pathAlias}`);

    const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split(
      '/jsonapi'
    )[0]?.replace(/[/]+$/, '');
    if (!baseUrl) {
      throw new Error('API URL not configured');
    }

    // Ensure path alias starts with a slash
    const formattedPath = pathAlias.startsWith('/')
      ? pathAlias
      : `/${pathAlias}`;

    // Try to find by path alias first
    const pathAliasUrl = `${process.env.NEXT_PUBLIC_DRUPAL_API_URL}/node/page?filter[path.alias]=${formattedPath}&include=field_article_image,field_article_image.field_media_image,field_staggered_images,field_staggered_images.field_media_image`;

    console.log(`Fetching by path alias: ${formattedPath}`);

    let response = await fetch(pathAliasUrl, {
      next: { revalidate: 3600 },
      headers: {
        Accept: 'application/vnd.api+json',
      },
    });

    console.log(`Path alias response status: ${response.status}`);

    let data;
    try {
      data = await response.json();
      console.log('Path alias response structure:', {
        hasData: !!data?.data,
        isArray: Array.isArray(data?.data),
        length: Array.isArray(data?.data) ? data.data.length : 'n/a',
      });
    } catch (e) {
      console.error('Failed to parse JSON from path alias response');
      data = null;
    }

    // If we got empty results by path, try the fallback IDs
    if (
      !response.ok ||
      !data?.data ||
      (Array.isArray(data?.data) && data.data.length === 0)
    ) {
      console.log('Path alias fetch returned no results, trying specific IDs');

      for (const nodeId of fallbackIds) {
        const nodeUrl = `${process.env.NEXT_PUBLIC_DRUPAL_API_URL}/node/page?filter[drupal_internal__nid]=${nodeId}&include=field_article_image,field_article_image.field_media_image,field_staggered_images,field_staggered_images.field_media_image`;
        console.log(`Trying node ID: ${nodeId}`);

        response = await fetch(nodeUrl, {
          next: { revalidate: 3600 },
          headers: {
            Accept: 'application/vnd.api+json',
          },
        });

        console.log(`Node ID ${nodeId} response status: ${response.status}`);

        if (response.ok) {
          try {
            data = await response.json();
            console.log(`Node ID ${nodeId} response structure:`, {
              hasData: !!data?.data,
              isArray: Array.isArray(data?.data),
              length: Array.isArray(data?.data) ? data.data.length : 'n/a',
              firstItemId:
                Array.isArray(data?.data) && data.data.length > 0
                  ? data.data[0].id
                  : data?.data?.id || 'none',
              title:
                Array.isArray(data?.data) && data.data.length > 0
                  ? data.data[0].attributes?.title
                  : data?.data?.attributes?.title || 'none',
            });

            // More tolerant check for valid data
            const hasValidData =
              !!data?.data &&
              ((Array.isArray(data.data) && data.data.length > 0) ||
                (!Array.isArray(data.data) && data.data.id));

            if (hasValidData) {
              console.log(`Found valid data with node ID ${nodeId}`);
              break;
            } else {
              console.log(`No valid data in node ID ${nodeId} response`);
            }
          } catch (e) {
            console.error(
              `Failed to parse JSON from node ID ${nodeId} response`
            );
          }
        }
      }
    }

    // More tolerant check for final data validation
    const hasValidData =
      !!data?.data &&
      ((Array.isArray(data.data) && data.data.length > 0) ||
        (!Array.isArray(data.data) && data.data.id));

    if (!hasValidData) {
      console.log(
        'WARNING: Final data check failed, returning anyway for inspection'
      );
      console.log('Raw data structure for debugging:', {
        hasData: !!data?.data,
        dataType: typeof data?.data,
        isArray: Array.isArray(data?.data),
        keys: data ? Object.keys(data) : [],
      });
    }

    return data || { data: null };
  } catch (error) {
    console.error(`Error fetching page for path ${pathAlias}:`, error);
    throw error;
  }
}
