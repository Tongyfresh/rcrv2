/**
 * Drupal JSON:API Type Definitions
 *
 * This file contains type definitions for Drupal JSON:API responses and entities.
 * It's used across the application to provide type safety when working with Drupal data.
 */

/**
 * Base Relationship Data interface
 */
export interface RelationshipData {
  id: string;
  type: string;
  meta?: Record<string, any>;
}

/**
 * Base relationship field interface
 */
export interface DrupalRelationshipField {
  data?: RelationshipData | RelationshipData[] | null;
}

/**
 * Base Drupal Entity Interface
 */
export interface DrupalEntity {
  id: string;
  type: string;
  attributes: Record<string, any>;
  relationships?: Record<string, DrupalRelationshipField>;
}

/**
 * Drupal API Response Interface
 */
export interface DrupalResponse {
  data: DrupalEntity | DrupalEntity[];
  included?: DrupalEntity[];
  links?: Record<string, any>;
  meta?: Record<string, any>;
}

/**
 * Drupal Page Interface
 */
export interface DrupalPage extends DrupalEntity {
  attributes: {
    title: string;
    body?: {
      value?: string;
      format?: string;
      processed?: string;
    };
    path?: {
      alias?: string;
    };
    created?: string;
    changed?: string;
    status?: boolean;
    [key: string]: any;
  };
}

/**
 * Home Page Data Interface
 */
export interface HomePageData extends DrupalEntity {
  attributes: {
    title: string;
    body?: {
      value: string;
      format: string;
      processed: string;
    };
    field_rcr_card_title?: string;
    field_rcr_card_description?: {
      value: string;
      format: string;
      processed: string;
    };
    field_why_rcr_description?: {
      value: string;
      format: string;
      processed: string;
    };
    [key: string]: any;
  };
  relationships: Record<string, DrupalRelationshipField>;
}

/**
 * Media Entity Interface
 */
export interface MediaEntity extends DrupalEntity {
  attributes: {
    name?: string;
    field_media_image?: {
      alt?: string;
      title?: string;
      width?: number;
      height?: number;
    };
    [key: string]: any;
  };
}

/**
 * File Entity Interface
 */
export interface FileEntity extends DrupalEntity {
  attributes: {
    filename?: string;
    uri?: {
      value?: string;
      url?: string;
    };
    filesize?: number;
    mime?: string;
    [key: string]: any;
  };
}

/**
 * Partner Logo Interface
 */
export interface DrupalPartnerLogo extends DrupalEntity {
  attributes: {
    title: string;
    field_partner_url?: string;
    [key: string]: any;
  };
}

/**
 * Processed Image Interface
 */
export interface ProcessedImage {
  id: string;
  url: string;
  alt: string;
  title: string;
  drupalId: number | null;
  width?: number;
  height?: number;
}

/**
 * Options for fetching data from Drupal
 */
export interface FetchOptions {
  fields?: string[];
  include?: string[];
  revalidate?: number;
  filter?: {
    [key: string]: FilterValue | string | number | boolean;
  };
}

/**
 * Filter value structure for Drupal API requests
 */
export type FilterValue = {
  value?: string | number | boolean;
  operator?: string;
  path?: string;
  condition?: {
    path: string;
    value: string | number | boolean;
    operator?: string;
  };
};

/**
 * Generic media image reference type
 */
export interface MediaImageReference {
  type: 'media--image';
  id: string;
  meta?: {
    drupal_internal__target_id: number;
  };
}

/**
 * Generic field with media images
 */
export interface MediaImageField {
  data: MediaImageReference | MediaImageReference[];
}

/**
 * Generic relationships interface
 */
export interface DrupalRelationships {
  [key: string]: MediaImageField;
}

/**
 * Helper function to check if a field is a media image field
 */
export function isMediaImageField(field: unknown): field is MediaImageField {
  if (!field || typeof field !== 'object') return false;
  const fieldObj = field as { data?: unknown };

  if (!fieldObj.data) return false;

  if (Array.isArray(fieldObj.data)) {
    return fieldObj.data.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        'type' in item &&
        (item as any).type === 'media--image'
    );
  }

  return (
    typeof fieldObj.data === 'object' &&
    fieldObj.data !== null &&
    'type' in fieldObj.data &&
    (fieldObj.data as any).type === 'media--image'
  );
}

/**
 * Helper function to get all media image IDs from a relationships object
 */
export function getMediaImageIds(relationships: DrupalRelationships): string[] {
  return Object.entries(relationships)
    .filter(([, value]) => isMediaImageField(value))
    .flatMap(([, value]) =>
      Array.isArray(value.data)
        ? value.data.map((item) => item.id)
        : [value.data.id]
    );
}

/**
 * Define a type for dynamic attribute values
 */
export type DrupalAttributeValue =
  | string
  | number
  | boolean
  | null
  | {
      value?: string;
      format?: string;
      processed?: string;
      url?: string;
      [key: string]: DrupalAttributeValue | undefined;
    };

/**
 * Type guards for relationship data
 */
export function isSingleRelationship(
  field: DrupalRelationshipField
): field is { data: RelationshipData } {
  return !!(
    field.data &&
    !Array.isArray(field.data) &&
    typeof field.data === 'object' &&
    'id' in field.data
  );
}

export function isMultipleRelationship(
  field: DrupalRelationshipField
): field is { data: RelationshipData[] } {
  return !!(
    field.data &&
    Array.isArray(field.data) &&
    field.data.length > 0 &&
    typeof field.data[0] === 'object' &&
    'id' in field.data[0]
  );
}
