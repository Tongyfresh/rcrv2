/**
 * URL Helper Utilities
 * Centralizes URL processing and validation functions
 */

/**
 * Ensures a URL is absolute by prepending the base URL if needed
 */
export function ensureAbsoluteUrl(
  url: string | null | undefined,
  baseUrl?: string
): string {
  if (!url) return '';

  // If URL is already absolute, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Get base URL from environment if not provided
  const effectiveBaseUrl =
    baseUrl ||
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL?.split('/jsonapi')[0] ||
    '';

  // Remove trailing slashes from base URL
  const cleanBaseUrl = effectiveBaseUrl.replace(/\/+$/, '');

  // Ensure URL starts with a slash
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  return `${cleanBaseUrl}${cleanUrl}`;
}

/**
 * Builds a complete API URL for Drupal's JSON:API
 */
export function buildApiUrl(endpoint: string, baseUrl?: string): string {
  const effectiveBaseUrl =
    baseUrl ||
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL?.split('/jsonapi')[0] ||
    '';
  const cleanBaseUrl = effectiveBaseUrl.replace(/\/+$/, '');

  // Handle different endpoint formats
  if (endpoint.includes('/')) {
    // It's a path with ID (e.g. "node/home_page")
    return `${cleanBaseUrl}/jsonapi/${endpoint}`;
  } else if (endpoint.includes('--')) {
    // It's an entity--bundle format
    if (endpoint === 'media--image') {
      return `${cleanBaseUrl}/jsonapi/media/image`;
    } else {
      // General entity--bundle case
      const [entity, bundle] = endpoint.split('--');
      return `${cleanBaseUrl}/jsonapi/${entity}/${bundle}`;
    }
  } else {
    // Simple resource type
    return `${cleanBaseUrl}/jsonapi/${endpoint}`;
  }
}

/**
 * Extracts and processes image URLs from Drupal responses
 */
export function processImageUrl(
  entity: any,
  included: any[] = [],
  fieldName: string,
  baseUrl?: string
): string | null {
  try {
    // Check if the relationship exists
    if (!entity?.relationships?.[fieldName]?.data) {
      return null;
    }

    const mediaRef = entity.relationships[fieldName].data;
    const mediaRefs = Array.isArray(mediaRef) ? mediaRef : [mediaRef];

    for (const ref of mediaRefs) {
      if (!ref) continue;

      // Find the media entity in included items
      const media = included?.find(
        (item) => item.id === ref.id && item.type === ref.type
      );

      if (!media?.relationships?.field_media_image?.data) continue;

      // Find the file entity in included items
      const fileRef = media.relationships.field_media_image.data;
      const file = included?.find(
        (item) => item.id === fileRef.id && item.type === fileRef.type
      );

      if (file?.attributes?.uri?.url) {
        return ensureAbsoluteUrl(file.attributes.uri.url, baseUrl);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error extracting image URL for ${fieldName}:`, error);
    return null;
  }
}

/**
 * Extracts and processes file URLs from Drupal responses
 */
export function processFileUrl(
  entity: any,
  included: any[] = [],
  fileRef?: { id: string; type: string }
): string {
  if (!fileRef && !entity?.relationships?.field_resource_file?.data) {
    return '#';
  }

  const fileData = fileRef || entity.relationships.field_resource_file.data;
  const file = included?.find(
    (item) => item.id === fileData.id && item.type === fileData.type
  );

  if (file?.attributes?.uri?.url) {
    return ensureAbsoluteUrl(file.attributes.uri.url) || '#';
  }

  return '#';
}

/**
 * Get a fallback image URL when no image is available
 */
export function getFallbackImage(): string {
  // Return a data URI for a simple placeholder image
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZSBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
}

/**
 * Processes relationship image fields with error handling
 */
export function processRelationshipImage(
  data: any,
  entity: any,
  fieldName: string,
  baseURL?: string
): string | null {
  try {
    let mediaId: string | undefined = undefined;

    // 1. Try getting mediaId from the entity's relationship data
    if (entity.relationships?.[fieldName]?.data) {
      const relationshipData = entity.relationships[fieldName].data;
      mediaId = Array.isArray(relationshipData)
        ? relationshipData[0]?.id
        : relationshipData.id;
      if (mediaId) {
        console.log(
          `Found media ID ${mediaId} in relationships for ${fieldName}`
        );
      }
    }

    // 2. If not found in relationships, try finding the FIRST media--image in included
    //    NOTE: This assumes a 1:1 relationship for this field and might need refinement.
    if (!mediaId && data.included) {
      // TODO: Make the type dynamic based on fieldName or expected type if needed
      const includedMedia = data.included.find(
        (item: any) => item.type === 'media--image'
      );
      if (includedMedia) {
        mediaId = includedMedia.id;
        console.log(
          `Found media ID ${mediaId} in included data for ${fieldName}`
        );
      }
    }

    // If no mediaId found anywhere, return null
    if (!mediaId) {
      console.log(`No media ID found for ${fieldName}`);
      return null;
    }

    // 3. Get the image URL using the found mediaId
    return getImageUrl(data, mediaId, baseURL);
  } catch (error) {
    console.error(`Error processing ${fieldName} image:`, error);
    return null;
  }
}

/**
 * Extract image URL from Drupal entity references
 */
export function getImageUrl(
  data: any,
  mediaId: string | undefined,
  baseUrl?: string
): string | null {
  if (!mediaId || !data.included) return null;

  try {
    // Find the media entity
    const mediaEntity = data.included.find(
      (item: any) => item.id === mediaId && item.type.includes('media')
    );

    if (!mediaEntity?.relationships?.field_media_image?.data) return null;

    // Get file ID safely
    const fileData = mediaEntity.relationships.field_media_image.data;
    const fileId = Array.isArray(fileData) ? fileData[0]?.id : fileData.id;

    if (!fileId) return null;

    // Find the file entity
    const fileEntity = data.included.find(
      (item: any) => item.id === fileId && item.type === 'file--file'
    );

    if (!fileEntity?.attributes?.uri?.url) return null;

    // Ensure the URL is absolute
    const fileUrl = fileEntity.attributes.uri.url;
    const fullUrl = ensureAbsoluteUrl(fileUrl, baseUrl);

    console.log(`Found image URL: ${fullUrl}`);
    return fullUrl;
  } catch (error) {
    console.error(`Error extracting image URL for media ID ${mediaId}:`, error);
    return null;
  }
}

/**
 * Safely sanitizes URLs for use in href attributes
 */
export function getSafeUrl(url: string): string {
  // Ensure URLs are safe to use in href
  if (!url || url === '#') return '/';

  // Check if it's a relative URL
  if (url.startsWith('/')) return url;

  try {
    // For absolute URLs, verify they're valid
    const urlObj = new URL(url);
    return url;
  } catch (e) {
    console.warn(`Invalid URL: ${url}, defaulting to homepage`);
    return '/';
  }
}

/**
 * Extracts logo path from Drupal JSON:API response
 */
export function extractLogoPath(data: any): string | null {
  try {
    if (!data?.data?.relationships?.field_rcr_logo?.data) return null;

    const mediaRef = data.data.relationships.field_rcr_logo.data;
    const media = data.included?.find(
      (item: any) => item.id === mediaRef.id && item.type === mediaRef.type
    );

    if (!media?.relationships?.field_media_image?.data) return null;

    const fileRef = media.relationships.field_media_image.data;
    const file = data.included?.find(
      (item: any) => item.id === fileRef.id && item.type === fileRef.type
    );

    return file?.attributes?.uri?.url || null;
  } catch (e) {
    console.error('Error extracting logo path:', e);
    return null;
  }
}
