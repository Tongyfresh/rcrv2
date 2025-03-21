import { DrupalResponse, ProcessedImage } from '@/types/drupal';

// Import or define the Partner type to match logoBar.tsx
type Partner = {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
};

export const getDrupalImageUrl = (
  data: DrupalResponse,
  mediaId: string,
  baseURL: string
): string | null => {
  // Find media item in included data or use direct media data
  let mediaItem = data.included?.find(
    (item) => item.type === 'media--image' && item.id === mediaId
  );

  if (!mediaItem) {
    // Special case for direct media response where data is the media item itself
    if (
      data.data &&
      !Array.isArray(data.data) &&
      typeof data.data === 'object' &&
      'id' in data.data &&
      (data.data as { id: string }).id === mediaId &&
      'type' in data.data &&
      (data.data as { type: string }).type === 'media--image'
    ) {
      mediaItem = data.data;
    } else {
      return null;
    }
  }

  // Get file ID from media item
  const mediaImageData = mediaItem.relationships?.field_media_image?.data;
  const fileId = Array.isArray(mediaImageData)
    ? mediaImageData[0]?.id
    : mediaImageData?.id;

  // Find file entity in included data
  const fileEntity = data.included?.find(
    (item) => item.type === 'file--file' && item.id === fileId
  );

  if (!fileEntity?.attributes?.uri?.url) {
    return null;
  }

  // Build the final URL
  return new URL(fileEntity.attributes.uri.url, baseURL).href;
};

export const processPartnerLogos = (
  data: DrupalResponse,
  baseURL: string
): Partner[] => {
  const logos = data.data[0]?.relationships?.field_partner_logo?.data || [];
  const logoIds = Array.isArray(logos) ? logos : [logos];

  return logoIds
    .map((logo) => {
      const mediaItem = data.included?.find(
        (item) => item.type === 'media--image' && item.id === logo.id
      );

      return {
        id: logo.id,
        name: mediaItem?.attributes?.name || 'Partner Logo',
        url: '', // Add partner URL if available from your data
        logoUrl: getDrupalImageUrl(data, logo.id, baseURL),
      };
    })
    .filter((partner): partner is Partner => partner.logoUrl !== null);
};

export const processPartnerLogosFromHome = (
  data: DrupalResponse,
  logoData: any[],
  baseURL: string
): Partner[] => {
  const logoIds = Array.isArray(logoData) ? logoData : [logoData];

  return logoIds
    .map((logo) => {
      const mediaItem = data.included?.find(
        (item) => item.type === 'media--image' && item.id === logo.id
      );

      return {
        id: logo.id,
        name: mediaItem?.attributes?.name || 'Partner Logo',
        url: '', // Add partner URL if available from your data
        logoUrl: getDrupalImageUrl(data, logo.id, baseURL),
      };
    })
    .filter((partner): partner is Partner => partner.logoUrl !== null);
};

// Function to handle direct file references
export function getDrupalFileUrl(
  fileId: string,
  baseURL: string
): string | null {
  if (!fileId) return null;

  // Handle full paths
  if (fileId.includes('/')) {
    // Extract just the filename
    const filename = fileId.substring(fileId.lastIndexOf('/') + 1);
    return `${baseURL}/sites/default/files/${filename}`;
  }

  // Handle simple IDs
  return `${baseURL}/sites/default/files/${fileId}`;
}

// Updated function to process card images from card image data with proper typing
export const processCardImages = (
  data: DrupalResponse,
  cardImageData: any,
  baseURL: string
): ProcessedImage[] => {
  // Early return if no data
  if (!cardImageData) return [];

  // Convert to array if it's not already
  const imageItems = Array.isArray(cardImageData)
    ? cardImageData
    : [cardImageData];

  // Create a properly typed result array
  const result: ProcessedImage[] = [];

  // Process each image
  for (const image of imageItems) {
    if (!image?.id) continue;

    const imageUrl = getDrupalImageUrl(data, image.id, baseURL);
    if (!imageUrl) continue;

    const mediaItem = data.included?.find(
      (item) => item.type === 'media--image' && item.id === image.id
    );

    result.push({
      id: image.id,
      url: imageUrl,
      alt: image.meta?.alt || mediaItem?.attributes?.name || 'Card Image',
      title: image.meta?.title || '',
      drupalId: image.meta?.drupal_internal__target_id || null,
    });
  }

  return result;
};
