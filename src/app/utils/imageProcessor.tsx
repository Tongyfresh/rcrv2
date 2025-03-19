import { DrupalResponse } from '@/types/drupal';

// Import or define the Partner type to match logoBar.tsx
type Partner = {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
};

interface ProcessedImage {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
}

// For single image processing (logos, hero images)
export const getDrupalImageUrl = (
  data: DrupalResponse,
  mediaId: string,
  baseURL: string
): string | null => {
  const mediaItem = data.included?.find(
    (item) => item.type === 'media--image' && item.id === mediaId
  );

  if (!mediaItem) return null;

  const mediaImageData = mediaItem.relationships?.field_media_image?.data;
  const fileId = Array.isArray(mediaImageData)
    ? mediaImageData[0]?.id
    : mediaImageData?.id;
  const fileEntity = data.included?.find(
    (item) => item.type === 'file--file' && item.id === fileId
  );

  if (!fileEntity?.attributes?.uri?.url) return null;

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
