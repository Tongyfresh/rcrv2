import { DrupalResponse } from '@/types/drupal';

interface ProcessedImage {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
}

export const processMediaImage = (
  data: DrupalResponse,
  mediaId: string,
  baseURL: string
): string | null => {
  const mediaItem = data.included?.find(
    (item) => item.type === 'media--image' && item.id === mediaId
  );

  if (!mediaItem) return null;

  const fileId = mediaItem.relationships?.field_media_image?.data?.id;
  const fileEntity = data.included?.find(
    (item) => item.type === 'file--file' && item.id === fileId
  );

  if (!fileEntity?.attributes?.uri?.url) return null;

  return new URL(fileEntity.attributes.uri.url, baseURL).href;
};

export const processPartnerLogos = (
  data: DrupalResponse,
  baseURL: string
): ProcessedImage[] => {
  const logos = data.data[0]?.relationships?.field_partner_logo?.data || [];
  const logoIds = Array.isArray(logos) ? logos : [logos];

  return logoIds
    .map((logo) => {
      const mediaItem = data.included?.find(
        (item) => item.type === 'media--image' && item.id === logo.id
      );

      const fileEntity = data.included?.find(
        (item) =>
          item.type === 'file--file' &&
          item.id === mediaItem?.relationships?.field_media_image?.data?.id
      );

      const logoUrl = fileEntity?.attributes?.uri?.url
        ? `${baseURL}${fileEntity.attributes.uri.url}`
        : null;

      return {
        id: logo.id,
        name: mediaItem?.attributes?.name || 'Partner Logo',
        url: '', // Add partner URL if available
        logoUrl,
      };
    })
    .filter((partner) => partner.logoUrl !== null); // Only include partners with valid logos
};
