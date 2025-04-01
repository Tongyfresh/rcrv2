/**
 * Drupal API Fetcher
 * Handles communication with Drupal's JSON:API
 */

import {
  DrupalResponse,
  DrupalEntity,
  FetchOptions,
  DrupalJsonApiResponse,
  DrupalToolboxResource,
  ToolboxResourceSchema,
} from '@/types/drupal';
import { buildApiUrl, ensureAbsoluteUrl } from './urlHelper';
import {
  processToolboxResourceData,
  processToolboxPageData,
  generateFallbackToolboxData,
} from './contentProcessor';

const isDev = process.env.NODE_ENV === 'development';

function logDebug(...args: any[]) {
  if (isDev) {
    console.log(...args);
  }
}

/**
 * Field name mapping to handle mismatches between expected and actual field names
 */
function correctFieldName(fieldName: string): string {
  const fieldNameMap: Record<string, string> = {
    field_map_image: 'field_rcr_map_image',
  };
  return fieldNameMap[fieldName] || fieldName;
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
    // Build the API URL
    const apiUrl = buildApiUrl(endpoint);

    // Determine resource type from endpoint
    const resourceType = endpoint.includes('--')
      ? endpoint.split('--')[0]
      : endpoint.split('/')[0];

    // Build query parameters
    const queryParams = buildQueryParams(options, resourceType);

    // Construct the full URL
    const fullUrl =
      queryParams.length > 0 ? `${apiUrl}?${queryParams.join('&')}` : apiUrl;

    logDebug(`Resource type: ${resourceType}, Full endpoint: ${endpoint}`);
    logDebug('Fetching from:', fullUrl);

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
    logDebug(`Error details: ${errorDetail}`);
  }

  if (response.status === 400) {
    logDebug('Request fields:', options.fields);
    logDebug('Request includes:', options.include);

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

    logDebug(`Available fields for ${contentType}:`, fields.join(', '));
    logDebug(
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
 * Merge multiple Drupal responses into a single response
 */
export function mergeResponses(...responses: DrupalResponse[]): DrupalResponse {
  const validResponses = responses.filter(
    (r) => r?.data && (!Array.isArray(r.data) || r.data.length > 0)
  );

  if (validResponses.length === 0) {
    return { data: [] };
  }

  const baseResponse = validResponses[0];
  const result: DrupalResponse = {
    data: baseResponse.data,
    included: [...(baseResponse.included || [])],
    links: baseResponse.links,
    meta: baseResponse.meta,
  };

  for (let i = 1; i < validResponses.length; i++) {
    const response = validResponses[i];
    mergeIncludedEntities(result, response);
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

  if (target.included) {
    target.included.forEach((entity) => {
      includedMap.set(`${entity.type}:${entity.id}`, entity);
    });
  }

  if (source.included) {
    source.included.forEach((entity) => {
      includedMap.set(`${entity.type}:${entity.id}`, entity);
    });
  }

  target.included = Array.from(includedMap.values());
}

/**
 * Merge data entities between responses
 */
function mergeDataEntities(
  target: DrupalResponse,
  source: DrupalResponse
): void {
  if (Array.isArray(target.data) && Array.isArray(source.data)) {
    const dataMap = new Map(target.data.map((entity) => [entity.id, entity]));

    source.data.forEach((entity) => {
      const existingEntity = dataMap.get(entity.id);
      if (existingEntity) {
        existingEntity.attributes = {
          ...existingEntity.attributes,
          ...entity.attributes,
        };

        if (entity.relationships) {
          existingEntity.relationships = existingEntity.relationships || {};
          Object.entries(entity.relationships).forEach(([key, value]) => {
            existingEntity.relationships![key] = value;
          });
        }
      }
    });

    target.data = Array.from(dataMap.values());
  } else if (!Array.isArray(target.data) && !Array.isArray(source.data)) {
    target.data.attributes = {
      ...target.data.attributes,
      ...source.data.attributes,
    };

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
 * Generic function to fetch page data by path alias
 */
export async function fetchPageByPath(
  pathAlias: string,
  fallbackIds: number[] = []
): Promise<DrupalResponse> {
  try {
    logDebug(`Fetching page data for path: ${pathAlias}`);

    const formattedPath = pathAlias.startsWith('/')
      ? pathAlias
      : `/${pathAlias}`;

    const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL?.replace(
      /\/+$/,
      ''
    );
    if (!baseUrl) {
      throw new Error('DRUPAL_BASE_URL is not configured');
    }

    // Try to find by path alias first
    const pathAliasUrl = `${baseUrl}/jsonapi/node/page?filter[path.alias]=${formattedPath}&include=field_article_image,field_article_image.field_media_image,field_staggered_images,field_staggered_images.field_media_image`;
    let data = await fetchAndParseJson(pathAliasUrl);

    // Check if we got valid data
    let hasValidData = isValidResponse(data);

    // If no valid data, try fallback IDs
    if (!hasValidData && fallbackIds.length > 0) {
      logDebug('Path alias fetch failed, trying node IDs:', fallbackIds);

      for (const nodeId of fallbackIds) {
        const nodeUrl = `${baseUrl}/jsonapi/node/page?filter[drupal_internal__nid]=${nodeId}&include=field_article_image,field_article_image.field_media_image,field_staggered_images,field_staggered_images.field_media_image`;
        data = await fetchAndParseJson(nodeUrl);

        if (isValidResponse(data)) {
          hasValidData = true;
          break;
        }
      }
    }

    if (!hasValidData) {
      console.warn(
        `No valid data found for path: ${pathAlias} or IDs: ${fallbackIds.join(',')}`
      );
      return { data: [] };
    }

    return data;
  } catch (error) {
    console.error(`Error fetching page for path ${pathAlias}:`, error);
    return { data: [] };
  }
}

// Helper functions
async function fetchAndParseJson(url: string): Promise<any> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.api+json' },
    });

    if (!response.ok) {
      logDebug(`API returned ${response.status} for ${url}`);
      return null;
    }

    return await response.json();
  } catch (e) {
    logDebug('Error fetching/parsing:', e);
    return null;
  }
}

function isValidResponse(data: any): boolean {
  return (
    !!data?.data &&
    ((Array.isArray(data.data) && data.data.length > 0) ||
      (!Array.isArray(data.data) && data.data.id))
  );
}

/**
 * HOME PAGE
 * Fetch homepage data in smaller chunks to avoid API errors
 */
export async function fetchHomePageData(
  options: FetchOptions = {}
): Promise<DrupalResponse> {
  try {
    logDebug('Fetching home page data with field discovery');

    const { relationships } = await discoverAvailableFields('node/home_page');
    const hasMapImage = relationships.includes('field_rcr_map_image');
    const hasArticleImage = relationships.includes('field_article_image');

    logDebug('Field discovery results:', { hasMapImage, hasArticleImage });

    const requests = [
      // Basic request - title, body, and main images
      fetchDrupalData('node/home_page', {
        fields: ['title', 'body', 'field_hero_image', 'field_rcr_logo'],
        include: [
          'field_hero_image',
          'field_hero_image.field_media_image',
          'field_rcr_logo',
          'field_rcr_logo.field_media_image',
        ],
        revalidate: options.revalidate || 3600,
      }),

      // Card data request
      fetchDrupalData('node/home_page', {
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
      }),

      // Partner logos request
      fetchDrupalData('node/home_page', {
        fields: ['field_partner_logo'],
        include: ['field_partner_logo', 'field_partner_logo.field_media_image'],
        revalidate: options.revalidate || 3600,
      }),
    ];

    if (hasMapImage) {
      requests.push(
        fetchDrupalData('node/home_page', {
          fields: ['field_rcr_map_image'],
          include: [
            'field_rcr_map_image',
            'field_rcr_map_image.field_media_image',
          ],
          revalidate: options.revalidate || 3600,
        })
      );
    }

    if (hasArticleImage) {
      requests.push(
        fetchDrupalData('node/home_page', {
          fields: ['field_article_image'],
          include: [
            'field_article_image',
            'field_article_image.field_media_image',
          ],
          revalidate: options.revalidate || 3600,
        })
      );
    }

    logDebug(`Executing ${requests.length} parallel requests for home page`);
    const responses = await Promise.all(
      requests.map((p) =>
        p.catch((e) => {
          logDebug('Request failed:', e);
          return { data: [] };
        })
      )
    );

    const validResponses = responses.filter(
      (r) => r?.data && (!Array.isArray(r.data) || r.data.length > 0)
    );

    logDebug(
      `Got ${validResponses.length} valid responses out of ${requests.length}`
    );

    return mergeResponses(...validResponses);
  } catch (error) {
    console.error('Error in fetchHomePageData:', error);
    return { data: [] };
  }
}

/**
 * ABOUT PAGE
 * Fetches About page data from Drupal
 */
export async function fetchAboutPageData(): Promise<DrupalResponse> {
  try {
    logDebug('Fetching about page data');

    // Use buildApiUrl to construct the URL
    const apiUrl = buildApiUrl('node/about');
    const queryParams = [
      'include=field_hero_image,field_hero_image.field_media_image,field_rcr_card_images,field_rcr_card_images.field_media_image',
    ];
    const url = `${apiUrl}?${queryParams.join('&')}`;

    logDebug('About page URL:', url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch about page data: ${response.status}`);
    }

    const data = await response.json();
    logDebug('About page data fetched successfully');
    return data;
  } catch (error) {
    console.error('Error fetching about page data:', error);
    if (error instanceof Error && error.message.includes('DRUPAL_BASE_URL')) {
      console.error('Base URL configuration error:', error);
    }
    return { data: [], included: [] };
  }
}

/**
 * SERVICES PAGE
 * Fetches Services page data from Drupal
 */
export async function fetchServicesPageData(): Promise<DrupalResponse> {
  try {
    logDebug('Fetching services page data');
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
    }).catch((error) => {
      logDebug('Failed to fetch from node/services:', error);
      return null;
    });

    if (servicesResponse?.data) {
      logDebug('Successfully fetched services page data from node/services');
      return servicesResponse;
    }

    logDebug('Trying fallback to node ID 13');
    return await fetchDrupalData('node/page', {
      filter: { drupal_internal__nid: 13 },
      fields: ['title', 'body', 'field_article_image'],
      include: ['field_article_image', 'field_article_image.field_media_image'],
      revalidate: 3600,
    }).catch((error) => {
      logDebug('Failed to fetch fallback node ID 13:', error);
      return { data: [] };
    });
  } catch (error) {
    console.error('Error fetching services page data:', error);
    return { data: [] };
  }
}

/**
 * RCR TOOLBOX PAGE
 * Fetch toolbox resources directly from the toolbox_resource content type
 */
export async function fetchToolboxResources(): Promise<any> {
  logDebug('Fetching toolbox resources');

  try {
    const resourceUrl = buildApiUrl('node/toolbox_resource');

    // Build comprehensive query params
    const queryParams = [
      // Include all necessary relationships and their sub-relationships
      'include=field_hero_image,field_hero_image.field_media_image,field_resource_file',

      // Fields for the main resource node
      'fields[node--toolbox_resource]=drupal_internal__nid,title,body,field_resource_category,created,changed,status,path',

      // Fields for media entities
      'fields[media--image]=field_media_image,name',

      // Fields for file entities
      'fields[file--file]=uri,url,filesize,filemime,filename',
    ].join('&');

    logDebug('Fetching with query params:', queryParams);

    const response = await fetch(`${resourceUrl}?${queryParams}`, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.api+json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logDebug(
        `Toolbox resource request failed with status: ${response.status}`,
        errorText
      );
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data: DrupalJsonApiResponse<DrupalToolboxResource> =
      await response.json();

    // Log the response data structure for debugging
    logDebug('Toolbox resources response:', {
      dataLength: Array.isArray(data.data) ? data.data.length : 1,
      includedCount: data.included?.length || 0,
      firstResource: data.data
        ? Array.isArray(data.data)
          ? data.data[0]?.attributes
          : data.data.attributes
        : null,
      relationships: data.data
        ? Array.isArray(data.data)
          ? Object.keys(data.data[0]?.relationships || {})
          : Object.keys(data.data?.relationships || {})
        : [],
      included: data.included?.map((item) => ({
        type: item.type,
        id: item.id,
        attributes: Object.keys(item.attributes || {}),
      })),
    });

    // Validate the response against our schema
    try {
      if (Array.isArray(data.data)) {
        data.data.forEach((resource) => {
          ToolboxResourceSchema.parse(resource);
        });
      } else {
        ToolboxResourceSchema.parse(data.data);
      }
      logDebug('Schema validation passed');
    } catch (validationError) {
      console.error('Schema validation failed:', validationError);
      // Continue processing despite validation error
    }

    return data;
  } catch (error) {
    console.error('Error fetching toolbox resources:', error);
    throw error;
  }
}
