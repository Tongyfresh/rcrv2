/**
 * Content Processor
 * Processes Drupal JSON:API responses into structured data for components
 */

import * as cheerio from 'cheerio';
import {
  DrupalResponse,
  DrupalEntity,
  ProcessedImage,
  HomePageData,
} from '@/types/drupal';
import { Partner } from '../components/logoBar';

/**
 * Interface definitions
 */
export interface ProcessedHomeData {
  homePage: DrupalEntity | null;
  heroImageUrl: string | null;
  articleImageUrl: string | null;
  mapImageUrl: string | null;
  cards: CardData[];
  cardTitle: string;
  partners: PartnerData[];
}

export interface CardData {
  title: string;
  description: string;
  imageUrl: string | null;
  link: string;
  name?: string;
}

export interface PartnerData {
  id: string;
  name: string;
  logoUrl: string | null;
  link: string;
}

interface MediaItem {
  id: string;
  type: string;
  attributes: {
    name?: string;
    uri?: {
      url: string;
    };
  };
  relationships?: {
    field_media_image?: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}

interface ImageReference {
  id: string;
  type: string;
}

/**
 * Process content with embedded images
 * Replaces image references in HTML content with proper URLs
 */
export async function processBodyContent(
  content: string,
  mediaItems: MediaItem[],
  baseURL: string
): Promise<string> {
  // Skip processing if no content
  if (!content || !mediaItems?.length) {
    return content;
  }

  try {
    const $ = cheerio.load(content);

    // Process each image
    const promises = $('img')
      .map(async (_, img): Promise<void> => {
        const src = $(img).attr('src');
        if (src) {
          const filename = src.split('/').pop();
          if (filename) {
            try {
              // Find matching media item by filename
              const mediaItem = mediaItems.find(
                (item) => item.attributes.name === filename
              );
              if (mediaItem?.attributes?.uri?.url) {
                const imageUrl = new URL(mediaItem.attributes.uri.url, baseURL)
                  .href;
                $(img).attr('src', imageUrl);
              }
            } catch (error) {
              console.error(`Error processing image ${filename}:`, error);
            }
          }
        }
      })
      .get();

    // Wait for all image processing to complete
    await Promise.all(promises);

    // Return the processed HTML
    return $.html();
  } catch (error) {
    console.error('Error processing HTML content:', error);
    return content; // Return original content if processing fails
  }
}

/**
 * Helper function to safely extract data from nested objects
 */
export function safelyGetField(
  data: any,
  path: string,
  defaultValue: any = null
): any {
  if (!data) return defaultValue;

  const parts = path.split('.');
  let current = data;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[part];
  }

  return current !== undefined && current !== null ? current : defaultValue;
}

/**
 * Helper function to safely extract text from Drupal rich text fields
 */
export function getTextFromDrupalField(field: any): string {
  if (!field) {
    return '';
  }

  // Simple string
  if (typeof field === 'string') {
    return field;
  }

  // Formatted text field with value
  if (field.value && typeof field.value === 'string') {
    return field.value;
  }

  // Processed field
  if (field.processed && typeof field.processed === 'string') {
    return field.processed;
  }

  // Fallback - shouldn't happen with proper typing
  return '';
}

/**
 * Main function to process homepage data from Drupal
 */
export function processHomePageData(data: DrupalResponse): ProcessedHomeData {
  const baseURL =
    process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] || '';

  // Return default values if data is missing
  if (!data?.data || (Array.isArray(data.data) && data.data.length === 0)) {
    return {
      homePage: null,
      heroImageUrl: null,
      articleImageUrl: null,
      mapImageUrl: null,
      cards: [],
      cardTitle: 'Resources',
      partners: [],
    };
  }

  // Use the first item if it's an array
  const homePage = Array.isArray(data.data) ? data.data[0] : data.data;

  // Log available fields for debugging
  const attributes = Object.keys(homePage.attributes || {});
  const relationships = Object.keys(homePage.relationships || {});

  if (process.env.NODE_ENV !== 'production') {
    console.log('Available attributes:', attributes.join(', '));
    console.log('Available relationships:', relationships.join(', '));
  }

  // Process all content elements
  const heroImageUrl = processRelationshipImage(
    data,
    homePage,
    'field_hero_image',
    baseURL
  );
  const articleImageUrl = processRelationshipImage(
    data,
    homePage,
    'field_article_image',
    baseURL
  );
  const mapImageUrl = processRelationshipImage(
    data,
    homePage,
    'field_rcr_map_image',
    baseURL
  );

  // Process cards with error handling
  let cards: CardData[] = [];
  try {
    cards = processCardData(data, homePage, baseURL);
  } catch (error) {
    console.error('Error processing cards:', error);
    cards = [];
  }

  // Get card title with fallback
  const cardTitle = safelyGetField(
    homePage.attributes,
    'field_rcr_card_title',
    'Explore Our Resources'
  );

  // Process partners with error handling
  let partners: PartnerData[] = [];
  try {
    partners = processPartnerData(data, homePage, baseURL);
  } catch (error) {
    console.error('Error processing partners:', error);
    partners = [];
  }

  return {
    homePage,
    heroImageUrl,
    articleImageUrl,
    mapImageUrl,
    cards,
    cardTitle,
    partners,
  };
}

/**
 * Helper for processing relationship image fields with error handling
 */
function processRelationshipImage(
  data: DrupalResponse,
  entity: DrupalEntity,
  fieldName: string,
  baseURL: string
): string | null {
  try {
    if (!entity.relationships?.[fieldName]?.data) return null;

    const relationshipData = entity.relationships[fieldName].data;
    const mediaId = Array.isArray(relationshipData)
      ? relationshipData[0]?.id
      : relationshipData.id;

    if (!mediaId) return null;

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
  data: DrupalResponse,
  mediaId: string | undefined,
  baseURL: string
): string | null {
  if (!mediaId || !data.included) return null;

  try {
    // Find the media entity
    const mediaEntity = data.included.find(
      (item) => item.id === mediaId && item.type.includes('media')
    );

    if (!mediaEntity?.relationships?.field_media_image?.data) return null;

    // Get file ID safely, handling both array and single object formats
    const fileData = mediaEntity.relationships.field_media_image.data;
    const fileId = Array.isArray(fileData) ? fileData[0]?.id : fileData.id;

    if (!fileId) return null;

    // Find the file entity
    const fileEntity = data.included.find(
      (item) => item.id === fileId && item.type === 'file--file'
    );

    if (!fileEntity?.attributes?.uri?.url) return null;

    // Ensure URL starts correctly
    const fileUrl = fileEntity.attributes.uri.url;

    // For debugging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `Found image URL: ${baseURL}${fileUrl} for media ID: ${mediaId}`
      );
    }

    return `${baseURL}${fileUrl}`;
  } catch (error) {
    console.error(`Error extracting image URL for media ID ${mediaId}:`, error);
    return null;
  }
}

/**
 * Process resource card data
 */
function processCardData(
  data: DrupalResponse,
  homePage: DrupalEntity,
  baseURL: string
): CardData[] {
  const fieldName = 'field_rcr_card_images';

  if (!homePage.relationships?.[fieldName]?.data) return [];

  try {
    const cardImageData = Array.isArray(homePage.relationships[fieldName].data)
      ? homePage.relationships[fieldName].data
      : [homePage.relationships[fieldName].data];

    // Get the card titles and descriptions from the homepage attributes
    const cardTitles = homePage.attributes.field_rcr_card_title || [];
    const cardDescriptions =
      homePage.attributes.field_rcr_card_description || [];

    return cardImageData.map((imageData, index) => {
      const imageUrl = getImageUrl(data, imageData.id, baseURL);

      // Find the media entity for additional data
      const mediaEntity = data.included?.find(
        (item) => item.id === imageData.id && item.type.includes('media')
      );

      // Get the appropriate title and description for this card
      // Use the index to match title and description arrays
      const title = Array.isArray(cardTitles)
        ? cardTitles[index] || cardTitles[0]
        : cardTitles;

      const description = Array.isArray(cardDescriptions)
        ? cardDescriptions[index] || cardDescriptions[0]
        : cardDescriptions;

      // Build card data with the matched title and description
      return {
        title,
        description,
        imageUrl,
        link: safelyGetField(mediaEntity, 'attributes.field_link.uri', '#'),
        name: safelyGetField(mediaEntity, 'attributes.name', 'Resource'),
      };
    });
  } catch (error) {
    console.error(`Error processing ${fieldName}:`, error);
    return [];
  }
}

/**
 * Process partner logo data
 */
function processPartnerData(
  data: DrupalResponse,
  homePage: DrupalEntity,
  baseURL: string
): PartnerData[] {
  const fieldName = 'field_partner_logo';

  if (!homePage.relationships?.[fieldName]?.data) return [];

  try {
    const partnerLogoData = Array.isArray(
      homePage.relationships[fieldName].data
    )
      ? homePage.relationships[fieldName].data
      : [homePage.relationships[fieldName].data];

    return partnerLogoData.map((logoData) => {
      const logoUrl = getImageUrl(data, logoData.id, baseURL);

      // Find the media entity
      const mediaEntity = data.included?.find(
        (item) => item.id === logoData.id && item.type.includes('media')
      );

      // Return partner data with fallbacks
      return {
        id: logoData.id,
        name: safelyGetField(mediaEntity, 'attributes.name', 'Partner'),
        logoUrl,
        link: safelyGetField(mediaEntity, 'attributes.field_link.uri', '#'),
      };
    });
  } catch (error) {
    console.error(`Error processing ${fieldName}:`, error);
    return [];
  }
}

/**
 * Adapter function to convert PartnerData to Partner interface for LogoBar
 */
export function adaptPartnersForLogoBar(
  partnersData: PartnerData[]
): Partner[] {
  if (!partnersData || !Array.isArray(partnersData)) {
    return [];
  }

  return partnersData.map((partner) => ({
    id: partner.id,
    name: partner.name,
    url: partner.logoUrl, // Map logoUrl to url for LogoBar component
    link: partner.link,
  }));
}

/**
 * Get clean text from HTML content
 */
export function getCleanTextFromHtml(html: string): string {
  if (!html) return '';

  try {
    const $ = cheerio.load(html);
    return $.text().trim();
  } catch (error) {
    console.error('Error extracting text from HTML:', error);
    return html;
  }
}

/**
 * Process page data for displaying in templates
 * @param data The raw data from Drupal
 * @param entityType The entity type (e.g., 'node')
 * @param baseUrl The base URL for image URLs
 */
export function processPageData(
  data: any,
  entityType: string = 'node',
  baseUrl?: string
) {
  if (!data || !data.data) {
    console.error(`No data available to process for ${entityType}`);
    return { pageContent: null };
  }

  // Use the same baseURL computation as in your other functions if not provided
  const effectiveBaseUrl =
    baseUrl ||
    process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0]?.replace(
      /[/]+$/,
      ''
    );

  // Extract the page node
  const pageContent = Array.isArray(data.data) ? data.data[0] : data.data;

  if (!pageContent) {
    return { pageContent: null };
  }

  // Extract the hero image if available
  let heroImageUrl = null;

  if (pageContent.relationships?.field_article_image?.data) {
    const mediaId = pageContent.relationships.field_article_image.data.id;

    const mediaEntity = data.included?.find(
      (item: any) => item.id === mediaId && item.type.includes('media')
    );

    if (mediaEntity?.relationships?.field_media_image?.data) {
      const fileId = mediaEntity.relationships.field_media_image.data.id;

      const fileEntity = data.included?.find(
        (item: any) => item.id === fileId && item.type === 'file--file'
      );

      if (fileEntity?.attributes?.uri?.url) {
        // Check if it's a relative URL
        const imageUrl = fileEntity.attributes.uri.url;
        heroImageUrl = imageUrl.startsWith('/')
          ? `${effectiveBaseUrl}${imageUrl}`
          : imageUrl;

        console.log('Found image URL:', heroImageUrl);
      }
    }
  }

  return {
    pageContent,
    heroImageUrl,
  };
}

/**
 * Process the services page data from Drupal
 * @param data The raw data from Drupal API
 * @param baseUrl The base URL for resolving relative URLs
 * @returns Processed data with essential fields extracted
 */
export function processServicesPageData(data: any, baseUrl?: string) {
  // Initialize result with default values
  const result = {
    pageContent: null as any,
    heroImageUrl: null as string | null,
    staggeredImages: [] as string[],
    staggeredText: [] as any[],
  };

  // If no data, return early
  if (!data || !data.data) {
    return result;
  }

  // Extract the page content
  const pageContent = Array.isArray(data.data) ? data.data[0] : data.data;
  if (!pageContent) {
    return result;
  }

  result.pageContent = pageContent;

  // Process include array if it exists
  if (data.included && Array.isArray(data.included)) {
    try {
      // Extract hero image if available - try field_hero_image first
      if (pageContent.relationships?.field_hero_image?.data) {
        const mediaId = pageContent.relationships.field_hero_image.data.id;

        const mediaEntity = data.included.find(
          (item: any) => item.id === mediaId && item.type.includes('media')
        );

        if (mediaEntity?.relationships?.field_media_image?.data) {
          const fileId = mediaEntity.relationships.field_media_image.data.id;

          const fileEntity = data.included.find(
            (item: any) => item.id === fileId && item.type === 'file--file'
          );

          if (fileEntity?.attributes?.uri?.url) {
            const imageUrl = fileEntity.attributes.uri.url;
            result.heroImageUrl = imageUrl.startsWith('/')
              ? `${baseUrl}${imageUrl}`
              : imageUrl;
          }
        }
      }
      // If not found, try field_article_image as fallback
      else if (pageContent.relationships?.field_article_image?.data) {
        const mediaId = pageContent.relationships.field_article_image.data.id;

        const mediaEntity = data.included.find(
          (item: any) => item.id === mediaId && item.type.includes('media')
        );

        if (mediaEntity?.relationships?.field_media_image?.data) {
          const fileId = mediaEntity.relationships.field_media_image.data.id;

          const fileEntity = data.included.find(
            (item: any) => item.id === fileId && item.type === 'file--file'
          );

          if (fileEntity?.attributes?.uri?.url) {
            const imageUrl = fileEntity.attributes.uri.url;
            result.heroImageUrl = imageUrl.startsWith('/')
              ? `${baseUrl}${imageUrl}`
              : imageUrl;
          }
        }
      }

      // Extract staggered images
      if (pageContent.relationships?.field_staggered_images?.data) {
        // Handle both single and multiple image references
        const imageRefs = Array.isArray(
          pageContent.relationships.field_staggered_images.data
        )
          ? pageContent.relationships.field_staggered_images.data
          : [pageContent.relationships.field_staggered_images.data];

        for (const imageRef of imageRefs) {
          const mediaId = imageRef.id;

          const mediaEntity = data.included.find(
            (item: any) => item.id === mediaId && item.type.includes('media')
          );

          if (mediaEntity?.relationships?.field_media_image?.data) {
            const fileId = mediaEntity.relationships.field_media_image.data.id;

            const fileEntity = data.included.find(
              (item: any) => item.id === fileId && item.type === 'file--file'
            );

            if (fileEntity?.attributes?.uri?.url) {
              const imageUrl = fileEntity.attributes.uri.url;
              const fullUrl = imageUrl.startsWith('/')
                ? `${baseUrl}${imageUrl}`
                : imageUrl;

              result.staggeredImages.push(fullUrl);
            }
          }
        }
      }

      // Process staggered text if available
      if (pageContent.attributes?.field_staggered_text) {
        try {
          // If it's a JSON string, parse it
          if (typeof pageContent.attributes.field_staggered_text === 'string') {
            try {
              result.staggeredText = JSON.parse(
                pageContent.attributes.field_staggered_text
              );
            } catch (jsonError) {
              // If parsing fails, use as a single item
              result.staggeredText = [
                { description: pageContent.attributes.field_staggered_text },
              ];
            }
          }
          // If it's already an array, use directly
          else if (Array.isArray(pageContent.attributes.field_staggered_text)) {
            result.staggeredText = pageContent.attributes.field_staggered_text;
          }
          // If it's an object, wrap it in an array
          else if (
            typeof pageContent.attributes.field_staggered_text === 'object'
          ) {
            result.staggeredText = [
              pageContent.attributes.field_staggered_text,
            ];
          }

          // Ensure the result is an array
          if (!Array.isArray(result.staggeredText)) {
            result.staggeredText = [result.staggeredText];
          }
        } catch (parseError) {
          console.error('Error processing staggered text:', parseError);
          result.staggeredText = [];
        }
      }
    } catch (error) {
      console.error('Error processing services page includes:', error);
    }
  }

  return result;
}
