import { DrupalResponse } from '@/types/drupal';

// Import or define the Partner type to match logoBar.tsx
type Partner = {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
};

// Add debugging to see what's happening with the map
export const getDrupalImageUrl = (
  data: DrupalResponse,
  mediaId: string,
  baseURL: string
): string | null => {
  console.log('getDrupalImageUrl called with mediaId:', mediaId);

  let mediaItem = data.included?.find(
    (item) => item.type === 'media--image' && item.id === mediaId
  );

  if (!mediaItem) {
    console.log('Media item not found in included data');

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
      console.log('Using direct media data instead of included');
      mediaItem = data.data;
    } else {
      return null;
    }
  }

  console.log('Found media item:', mediaItem.id);

  const mediaImageData = mediaItem.relationships?.field_media_image?.data;
  console.log('Media image relationship data:', mediaImageData);

  const fileId = Array.isArray(mediaImageData)
    ? mediaImageData[0]?.id
    : mediaImageData?.id;

  console.log('File ID extracted:', fileId);

  const fileEntity = data.included?.find(
    (item) => item.type === 'file--file' && item.id === fileId
  );

  if (!fileEntity?.attributes?.uri?.url) {
    console.log('File entity or URI not found');
    return null;
  }

  console.log('File entity found, URI:', fileEntity.attributes.uri.url);
  const finalUrl = new URL(fileEntity.attributes.uri.url, baseURL).href;
  console.log('Final URL:', finalUrl);

  return finalUrl;
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

// Add this function to handle direct file references
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
