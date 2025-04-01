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
  ProcessedToolboxData,
  ProcessedToolboxResource,
} from '@/types/drupal';
import { Partner } from '../components/logoBar';
import {
  ensureAbsoluteUrl,
  getFallbackImage,
  processImageUrl,
  processFileUrl,
  processRelationshipImage,
  getImageUrl,
} from './urlHelper';

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
  mapLocationsLeft: string;
  mapLocationsRight: string;
  whyRcrContent: string;
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

export interface ImpactStat {
  id: string;
  number: string;
  label: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface AboutPageData {
  pageContent: DrupalEntity | null;
  heroImageUrl: string | null;
  impactStats: ImpactStat[];
  teamMembers: TeamMember[];
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
 * Define an interface for ToolboxResource
 */
interface ToolboxResource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  category: string;
  lastUpdated: string;
  imageUrl?: string | null;
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
                let imageUrl = processImageUrl(
                  mediaItem,
                  [],
                  'field_media_image',
                  baseURL
                );
                if (imageUrl) {
                  $(img).attr('src', imageUrl);
                }
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
 * Process embedded media to make them responsive
 */
export function processEmbeddedMedia(html: string): string {
  if (!html) return '';

  const $ = cheerio.load(html);

  // Make iframes responsive
  $('iframe').each((_, el) => {
    const $iframe = $(el);

    // Create a responsive wrapper
    $iframe.wrap(
      '<div class="relative pb-[56.25%] h-0 overflow-hidden max-w-full"></div>'
    );

    // Style the iframe for responsiveness
    $iframe.addClass('absolute top-0 left-0 w-full h-full');
  });

  return $.html();
}

/**
 * Clean up HTML output from Drupal Views
 */
export function cleanDrupalViewsOutput(html: string): string {
  const $ = cheerio.load(html);

  // Remove unnecessary wrappers and classes
  $('.views-row').unwrap();
  $('.views-field').each((_, el) => {
    const $field = $(el);
    const content = $field.find('.field-content').html();
    if (content) {
      $field.html(content);
    }
    $field.removeAttr('class');
  });

  return $.html();
}

/**
 * Transform Drupal-specific HTML structures to work better with your design
 */
export function transformDrupalHTML(html: string): string {
  if (!html) return '';

  const $ = cheerio.load(html);

  // Transform Drupal image alignment classes
  $('.align-left').addClass('float-left mr-4 mb-2').removeClass('align-left');
  $('.align-right')
    .addClass('float-right ml-4 mb-2')
    .removeClass('align-right');
  $('.align-center').addClass('mx-auto block my-4').removeClass('align-center');

  // Convert Drupal file links to more user-friendly format
  $('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]').each((_, el) => {
    const $link = $(el);
    const href = $link.attr('href');
    const fileType = href?.split('.').pop()?.toUpperCase() || '';

    // Add file icon and type information
    $link.addClass(
      'inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded'
    );
    $link.html(`
      <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
      </svg>
      ${$link.text()} <span class="ml-1 text-xs text-gray-500">(${fileType})</span>
    `);
  });

  return $.html();
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
 * Extracts the first paragraph from HTML content for use as a summary
 */
export function extractSummary(html: string, maxLength = 160): string {
  if (!html) return '';

  const $ = cheerio.load(html);
  let summary = '';

  // Try to find the first paragraph
  const firstParagraph = $('p').first().text();
  if (firstParagraph) {
    summary = firstParagraph;
  } else {
    // Fallback to any text content
    summary = $.text();
  }

  // Truncate if needed
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength).trim() + '...';
  }

  return summary;
}

/**
 * Generates a clean excerpt from HTML content
 */
export function generateExcerpt(html: string, maxLength: number = 120): string {
  const $ = cheerio.load(html);

  // Remove any unwanted elements
  $('script, style, iframe').remove();

  // Get text and clean it up
  let text = $.text().replace(/\s+/g, ' ').trim();

  // Truncate and add ellipsis if needed
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + '...';
  }

  return text;
}

/**
 * Extract structured data like tables from HTML content
 */
export function extractTableData(html: string): any[] {
  const $ = cheerio.load(html);
  const tables: any[] = [];

  $('table').each((tableIndex, tableEl) => {
    const $table = $(tableEl);
    const tableData: any = {
      headers: [],
      rows: [],
    };

    // Extract headers
    $table.find('thead tr th').each((_, headerEl) => {
      tableData.headers.push($(headerEl).text().trim());
    });

    // Extract rows
    $table.find('tbody tr').each((_, rowEl) => {
      const row: string[] = [];
      $(rowEl)
        .find('td')
        .each((_, cellEl) => {
          row.push($(cellEl).text().trim());
        });
      tableData.rows.push(row);
    });

    tables.push(tableData);
  });

  return tables;
}

/**
 * Main function to process homepage data from Drupal
 */
export function processHomePageData(data: any): any {
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
      mapLocationsLeft: '',
      mapLocationsRight: '',
      whyRcrContent: '',
    };
  }

  // Use the first item if it's an array
  const homePage = Array.isArray(data.data) ? data.data[0] : data.data;

  // Process all content elements
  const heroImageUrl = processRelationshipImage(
    data,
    homePage,
    'field_hero_image'
  );
  const articleImageUrl = processRelationshipImage(
    data,
    homePage,
    'field_article_image'
  );
  const mapImageUrl = processRelationshipImage(
    data,
    homePage,
    'field_rcr_map_image'
  );

  // Process cards with error handling
  let cards: CardData[] = [];
  try {
    cards = processCardData(data, homePage);
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
    partners = processPartnerData(data, homePage);
  } catch (error) {
    console.error('Error processing partners:', error);
    partners = [];
  }

  // Safely extract map location text fields with fallback to empty string
  let mapLocationsLeft = '';
  let mapLocationsRight = '';

  // Check if these fields exist and are properly formatted
  if (homePage?.attributes) {
    // For field_map_text_left
    if (homePage.attributes.field_map_text_left?.processed) {
      // Use cheerio to parse HTML
      const $ = cheerio.load(homePage.attributes.field_map_text_left.processed);
      // Extract text from each paragraph
      const locations: string[] = [];
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text) locations.push(text);
      });
      mapLocationsLeft = locations.join('\n');
    }

    // For field_map_text_right
    if (homePage.attributes.field_map_text_right?.processed) {
      // Use cheerio to parse HTML
      const $ = cheerio.load(
        homePage.attributes.field_map_text_right.processed
      );
      // Extract text from each paragraph
      const locations: string[] = [];
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text) locations.push(text);
      });
      mapLocationsRight = locations.join('\n');
    }
  }

  // Process "Why RCR?" section content
  let whyRcrContent = '';

  if (homePage?.attributes) {
    // Check different possible field formats
    if (homePage.attributes.field_why_rcr_description) {
      if (typeof homePage.attributes.field_why_rcr_description === 'string') {
        whyRcrContent = homePage.attributes.field_why_rcr_description;
      } else if (homePage.attributes.field_why_rcr_description.value) {
        whyRcrContent = homePage.attributes.field_why_rcr_description.value;
      } else if (homePage.attributes.field_why_rcr_description.processed) {
        whyRcrContent = homePage.attributes.field_why_rcr_description.processed;
      }
    }

    // If the field is missing entirely, check for a fallback field
    if (!whyRcrContent && homePage.attributes.field_why_rcr) {
      if (typeof homePage.attributes.field_why_rcr === 'string') {
        whyRcrContent = homePage.attributes.field_why_rcr;
      } else if (homePage.attributes.field_why_rcr.value) {
        whyRcrContent = homePage.attributes.field_why_rcr.value;
      } else if (homePage.attributes.field_why_rcr.processed) {
        whyRcrContent = homePage.attributes.field_why_rcr.processed;
      }
    }

    // As a last resort, check if it's in body field or another location
    if (!whyRcrContent && homePage.attributes.field_section_content) {
      // Assuming "Why RCR?" might be in a sections array
      const sections = Array.isArray(homePage.attributes.field_section_content)
        ? homePage.attributes.field_section_content
        : [homePage.attributes.field_section_content];

      // Look for a section with "why rcr" in the title
      const whyRcrSection = sections.find((section: any) => {
        const title = section?.field_section_title || '';
        return (
          typeof title === 'string' &&
          title.toLowerCase().includes('why') &&
          title.toLowerCase().includes('rcr')
        );
      });

      if (whyRcrSection?.field_section_text) {
        if (typeof whyRcrSection.field_section_text === 'string') {
          whyRcrContent = whyRcrSection.field_section_text;
        } else if (whyRcrSection.field_section_text.processed) {
          whyRcrContent = whyRcrSection.field_section_text.processed;
        }
      }
    }
  }

  // Add debugging to see what's available
  console.log(
    'Why RCR content found:',
    !!whyRcrContent,
    'Field exists:',
    !!homePage?.attributes?.field_why_rcr_description
  );

  return {
    homePage,
    heroImageUrl,
    articleImageUrl,
    mapImageUrl,
    cards,
    cardTitle,
    partners,
    mapLocationsLeft,
    mapLocationsRight,
    whyRcrContent,
  };
}

/**
 * Process resource card data
 */
function processCardData(
  data: DrupalResponse,
  homePage: DrupalEntity
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
      let imageUrl = getImageUrl(data, imageData.id);

      // Find the media entity for additional data
      const mediaEntity = data.included?.find(
        (item: {
          id: string;
          type: string;
          attributes?: any;
          relationships?: any;
        }) => item.id === imageData.id && item.type.includes('media')
      );

      // Get the appropriate title and description for this card
      const title = Array.isArray(cardTitles)
        ? cardTitles[index] || cardTitles[0]
        : cardTitles;

      const description = Array.isArray(cardDescriptions)
        ? cardDescriptions[index] || cardDescriptions[0]
        : cardDescriptions;

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
  homePage: DrupalEntity
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
      let logoUrl = getImageUrl(data, logoData.id);

      // Find the media entity
      const mediaEntity = data.included?.find(
        (item: {
          id: string;
          type: string;
          attributes?: any;
          relationships?: any;
        }) => item.id === logoData.id && item.type.includes('media')
      );

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

  // Extract the page node
  const pageContent = Array.isArray(data.data) ? data.data[0] : data.data;

  if (!pageContent) {
    return { pageContent: null };
  }

  // Extract the hero image if available
  const heroImageUrl = processRelationshipImage(
    data,
    pageContent,
    'field_article_image',
    baseUrl || ''
  );

  return {
    pageContent,
    heroImageUrl,
  };
}

/**
 * Process the services page data from Drupal
 */
export function processServicesPageData(data: any) {
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
      result.heroImageUrl = processRelationshipImage(
        data,
        pageContent,
        'field_hero_image'
      );

      // If not found, try field_article_image as fallback
      if (!result.heroImageUrl) {
        result.heroImageUrl = processRelationshipImage(
          data,
          pageContent,
          'field_article_image'
        );
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
          const imageUrl = getImageUrl(data, imageRef.id);
          if (imageUrl) {
            result.staggeredImages.push(imageUrl);
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

/**
 * Process the about page data from Drupal
 */
export function processAboutPageData(data: DrupalResponse): AboutPageData {
  // Return default values if data is missing
  if (!data?.data || (Array.isArray(data.data) && data.data.length === 0)) {
    return {
      pageContent: null,
      heroImageUrl: null,
      impactStats: [],
      teamMembers: [],
    };
  }

  // Use the first item if it's an array, or the data directly if not
  const pageContent: DrupalEntity = Array.isArray(data.data)
    ? data.data[0]
    : data.data;

  if (!pageContent) {
    return {
      pageContent: null,
      heroImageUrl: null,
      impactStats: [],
      teamMembers: [],
    };
  }

  // Process hero image
  const heroImageUrl = processRelationshipImage(
    data,
    pageContent,
    'field_hero_image'
  );

  // Process impact stats from field_impact_text
  const impactStats: ImpactStat[] = [];

  // Impact stat labels - match to the values we're getting
  const impactLabels = [
    'Rural Communities Served',
    'Research Participants',
    'Clinical Trials Supported',
    'Research Phlebotomy Sites',
  ];

  if (
    pageContent.attributes?.field_impact_text &&
    Array.isArray(pageContent.attributes.field_impact_text)
  ) {
    pageContent.attributes.field_impact_text.forEach(
      (stat: any, index: number) => {
        // Get the number from the processed or value field
        const numberValue = stat.processed || stat.value || '0';

        impactStats.push({
          id: `impact-${index}`,
          number: numberValue,
          label: impactLabels[index] || `Stat ${index + 1}`,
        });
      }
    );
  }

  // Process team members from card data
  const teamMembers: TeamMember[] = [];
  const cardImagesRelationships =
    pageContent.relationships?.field_rcr_card_images?.data;

  // Early return if no card images
  if (!cardImagesRelationships) {
    return {
      pageContent,
      heroImageUrl,
      impactStats,
      teamMembers,
    };
  }

  // Convert to array if it's a single item
  const cardImagesRefs = Array.isArray(cardImagesRelationships)
    ? cardImagesRelationships
    : [cardImagesRelationships];

  // Get titles and descriptions - fix HTML content handling
  const cardTitlesRaw = pageContent.attributes?.field_rcr_card_title || [];
  const cardDescriptionsRaw =
    pageContent.attributes?.field_rcr_card_description || [];

  // Clean up titles by removing HTML tags
  const cardTitles = cardTitlesRaw.map((title: any) => {
    if (title.processed) {
      // Remove HTML tags but preserve the text
      return title.processed.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }
    return title.value ? title.value.replace(/<\/?[^>]+(>|$)/g, '').trim() : '';
  });

  // Extract first paragraph as role, keep full HTML for bio
  const cardRoles: string[] = [];
  const cardDescriptions = cardDescriptionsRaw.map(
    (desc: any, index: number) => {
      const htmlContent = desc.processed || desc.value || '';

      // Extract the first paragraph as the role
      const firstParagraphMatch = htmlContent.match(/<p>(.*?)<\/p>/);
      if (firstParagraphMatch && firstParagraphMatch[1]) {
        cardRoles[index] = firstParagraphMatch[1].trim();
        // Return the full HTML as bio
        return htmlContent;
      }

      cardRoles[index] = '';
      return htmlContent;
    }
  );

  // Process each team member card image
  for (let index = 0; index < cardImagesRefs.length; index++) {
    const cardRef = cardImagesRefs[index];
    const imageUrl = getImageUrl(data, cardRef.id);

    // Get corresponding title and description if available
    const name =
      index < cardTitles.length
        ? cardTitles[index]
        : `Team Member ${index + 1}`;
    const role = index < cardRoles.length ? cardRoles[index] : '';
    const bio = index < cardDescriptions.length ? cardDescriptions[index] : '';

    teamMembers.push({
      id: `team-${index}`,
      name,
      role,
      bio,
      image: imageUrl || '',
    });
  }

  return {
    pageContent,
    heroImageUrl,
    impactStats,
    teamMembers,
  };
}

/**
 * Process toolbox_resource content type data
 */
export function processToolboxResourceData(data: any): ProcessedToolboxData {
  try {
    if (!data?.data) {
      console.warn('No data available to process');
      return generateFallbackToolboxData();
    }

    // Log incoming data structure
    console.log('Processing toolbox data:', {
      hasData: !!data.data,
      dataType: Array.isArray(data.data) ? 'array' : 'single',
      includedCount: data.included?.length || 0,
    });

    const resources = Array.isArray(data.data) ? data.data : [data.data];
    const mainResource = resources[0];

    if (!mainResource) {
      console.warn('No main resource found');
      return generateFallbackToolboxData();
    }

    // Process page content from the first resource's body
    const pageContent = mainResource?.attributes?.body?.processed || null;

    // Process hero image if available
    const heroImageUrl = processRelationshipImage(
      data,
      mainResource,
      'field_hero_image'
    );

    console.log('Hero image processing:', {
      found: !!heroImageUrl,
      url: heroImageUrl,
    });

    // Extract categories from field_resource_category
    const categories = resources
      .flatMap((resource: any) => {
        const categoryField =
          resource.attributes?.field_resource_category || [];
        return categoryField.map(
          (cat: any) => cat.processed || cat.value || ''
        );
      })
      .filter((category: string) => category) // Remove empty categories
      .filter(
        (category: string, index: number, self: string[]) =>
          self.indexOf(category) === index // Remove duplicates
      );

    // Add default category if none found
    if (categories.length === 0) {
      categories.push('General');
    }

    // Process resources
    const processedResources = resources.map(
      (resource: any): ProcessedToolboxResource => {
        // Use fallback text for the resource card description
        const description = 'Download this resource file.';

        // Default resource structure
        const defaultResource: ProcessedToolboxResource = {
          id: resource.id,
          title: resource.attributes?.title || 'Untitled Resource',
          description: transformDrupalHTML(description),
          fileUrl: '#',
          fileType: 'pdf',
          fileSize: 'Unknown size',
          category: categories[0],
          lastUpdated: formatDate(
            resource.attributes?.changed || resource.attributes?.created
          ),
        };

        // Process resource files
        let fileRef = null;
        const resourceRelationship =
          resource.relationships?.field_resource_file?.data;

        if (resourceRelationship) {
          // If relationship exists, use it directly
          const fileRefs = Array.isArray(resourceRelationship)
            ? resourceRelationship
            : [resourceRelationship];
          fileRef = fileRefs[0];
          console.log(
            'Found file reference in resource relationships:',
            fileRef?.id
          );
        } else if (data.included) {
          // If no relationship, try finding the FIRST file--file entity in the included array
          // NOTE: This assumes a 1:1 relationship for this specific content type response structure
          //       and might need refinement if multiple resources or files are present.
          const includedFileEntity = data.included.find(
            (item: any) => item.type === 'file--file'
          );
          if (includedFileEntity) {
            fileRef = { id: includedFileEntity.id, type: 'file--file' };
            console.log('Found file reference in included data:', fileRef?.id);
          }
        }

        // If no file reference found anywhere, return default
        if (!fileRef) {
          console.log('No file reference found for:', resource.id);
          return defaultResource;
        }

        // Find the file entity in included data using the determined fileRef
        const fileEntity = data.included?.find(
          (item: any) => item.id === fileRef.id && item.type === fileRef.type
        );

        if (!fileEntity?.attributes) {
          console.log('No file entity found for:', fileRef.id);
          return defaultResource;
        }

        // Get file details
        const fileUrl = ensureAbsoluteUrl(
          fileEntity.attributes.url || fileEntity.attributes.uri?.url || ''
        );
        const fileType =
          fileEntity.attributes.filemime?.split('/').pop() || 'pdf';
        const fileSize = formatFileSize(fileEntity.attributes.filesize || 0);

        return {
          ...defaultResource,
          fileUrl,
          fileType,
          fileSize,
        };
      }
    );

    // Log processed resources before returning
    console.log('Final processedResources:', processedResources);

    // Log processed data
    console.log('Processed toolbox data:', {
      title: mainResource?.attributes?.title,
      hasPageContent: !!pageContent,
      hasHeroImage: !!heroImageUrl,
      categoriesCount: categories.length,
      resourcesCount: processedResources.length,
    });

    return {
      title: mainResource?.attributes?.title || 'RCR Toolbox',
      pageContent: transformDrupalHTML(pageContent || ''),
      heroImageUrl,
      categories,
      resources: processedResources,
    };
  } catch (error) {
    console.error('Error processing toolbox resource data:', error);
    return generateFallbackToolboxData();
  }
}

/**
 * Format file size in bytes to human readable format
 */
function formatFileSize(bytes: number): string {
  if (!bytes) return 'Unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
}

/**
 * Process toolbox page data from various sources
 */
export function processToolboxPageData(data: any): any {
  try {
    console.log('Processing toolbox page data');

    // Handle missing or invalid data
    if (!data?.data) {
      console.log('No data found, using fallback');
      return generateFallbackToolboxData();
    }

    // Convert to array if it's a single node
    const nodes = Array.isArray(data.data) ? data.data : [data.data];
    if (nodes.length === 0) {
      console.log('No nodes found in data, using fallback');
      return generateFallbackToolboxData();
    }

    const node = nodes[0];
    if (!node) {
      console.log('Invalid node data, using fallback');
      return generateFallbackToolboxData();
    }

    // Extract data with safe access
    const title = node.attributes?.title || 'RCR Toolbox';
    const pageContent =
      node.attributes?.body?.processed || node.attributes?.body?.value || null;

    // Try multiple hero image field names
    const heroImageFieldNames = [
      'field_hero_image',
      'field_header_image',
      'field_banner_image',
      'field_media',
      'field_image',
    ];

    let heroImageUrl = null;

    // Try each potential hero image field name
    for (const fieldName of heroImageFieldNames) {
      if (node.relationships?.[fieldName]?.data && data.included) {
        heroImageUrl = processRelationshipImage(data, node, fieldName);
        if (heroImageUrl) {
          console.log(`Found hero image from field: ${fieldName}`);
          break;
        }
      }
    }

    // Try multiple article image field names
    const articleImageFieldNames = [
      'field_article_image',
      'field_content_image',
      'field_image',
    ];

    let articleImageUrl = null;

    // Try each potential article image field name
    for (const fieldName of articleImageFieldNames) {
      if (node.relationships?.[fieldName]?.data && data.included) {
        articleImageUrl = processRelationshipImage(data, node, fieldName);
        if (articleImageUrl) {
          console.log(`Found article image from field: ${fieldName}`);
          break;
        }
      }
    }

    // Extract categories from tags with safe access
    let categories: string[] = [];
    if (node.relationships?.field_tags?.data && data.included) {
      const tagRefs = Array.isArray(node.relationships.field_tags.data)
        ? node.relationships.field_tags.data
        : [node.relationships.field_tags.data];

      categories = tagRefs
        .map((tagRef: { id: string; type: string }) => {
          const tagEntity = data.included.find(
            (inc: { id: string; type: string }) =>
              inc.id === tagRef.id && inc.type === tagRef.type
          );
          return tagEntity?.attributes?.name || '';
        })
        .filter(Boolean);
    }

    // Fallback categories
    if (categories.length === 0) {
      categories = [
        'Protocol Packets',
        'Implementation Kits',
        'Training Modules',
        'Technology Playbooks',
      ];
    }

    // Generate resources based on categories
    const resources = generateSampleResources(categories);

    return {
      title,
      pageContent,
      categories,
      resources,
      heroImageUrl,
      articleImageUrl,
    };
  } catch (error) {
    console.error('Error processing toolbox page data:', error);
    return generateFallbackToolboxData();
  }
}

/**
 * Generate fallback toolbox data
 */
export function generateFallbackToolboxData(): any {
  return {
    title: 'RCR Toolbox',
    pageContent:
      '<p>Access these resources to support your rural clinical research efforts.</p>',
    categories: [],
    resources: [],
    heroImageUrl: null,
    articleImageUrl: null,
  };
}

/**
 * Generate sample resources based on categories
 */
function generateSampleResources(categories: string[]): any[] {
  const resources: any[] = [];

  for (const category of categories) {
    const resource = {
      id: `resource-${category.replace(/\s+/g, '-').toLowerCase()}`,
      title: category,
      description: `Description of ${category}`,
      fileUrl: `https://example.com/${category.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      fileType: 'PDF',
      fileSize: '1.2 MB',
      category,
      lastUpdated: formatDate(new Date()),
      imageUrl: getFallbackImage(),
    };

    resources.push(resource);
  }

  return resources;
}

/**
 * Format date as a readable string
 */
export function formatDate(date: Date | string): string {
  if (!date) return 'Unknown date';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    console.error('Invalid date:', date, e);
    return 'Unknown date';
  }
}
