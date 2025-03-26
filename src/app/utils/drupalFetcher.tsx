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
    console.log('Fetching about page data...');

    const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split(
      '/jsonapi'
    )[0]?.replace(/[/]+$/, '');
    if (!baseUrl) {
      throw new Error('API URL not configured');
    }

    // Using the existing fetchDrupalData function
    const response = await fetchDrupalData('node/page', {
      filter: {
        drupal_internal__nid: 11, // Assuming 11 is the node ID for About page
      },
      include: ['field_article_image', 'field_article_image.field_media_image'],
      fields: ['title', 'body', 'field_article_image'],
    });

    console.log('About page data fetched successfully');
    return response;
  } catch (error) {
    console.error('Error fetching about page data:', error);
    throw error;
  }
}
