export interface DrupalPage {
  id: string;
  attributes: {
    title: string;
    body?: {
      value?: string;
      format?: string;
    };
  };
}

// Generic media image reference type
export interface MediaImageReference {
  type: 'media--image';
  id: string;
  meta?: {
    drupal_internal__target_id: number;
  };
}

// Generic field with media images
export interface MediaImageField {
  data: MediaImageReference | MediaImageReference[];
}

// Generic relationships interface
export interface DrupalRelationships {
  [key: string]: MediaImageField;
}

// Define a type for dynamic attribute values
type DrupalAttributeValue =
  | string
  | number
  | boolean
  | null
  | {
      value?: string;
      format?: string;
      url?: string;
      [key: string]: DrupalAttributeValue | undefined;
    };

// Updated DrupalResponse interface
export interface DrupalResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      title: string;
      body?: {
        value: string;
        format: string;
      };
      [key: string]: DrupalAttributeValue | undefined;
    };
    relationships?: DrupalRelationships;
  }>;
  included?: Array<{
    id: string;
    type: string;
    attributes: {
      name?: string;
      uri?: {
        url: string;
      };
      [key: string]: DrupalAttributeValue | undefined;
    };
    relationships?: DrupalRelationships;
  }>;
}

// Helper function to check if a field is a media image field
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
        item.type === 'media--image'
    );
  }

  return (
    typeof fieldObj.data === 'object' &&
    fieldObj.data !== null &&
    'type' in fieldObj.data &&
    fieldObj.data.type === 'media--image'
  );
}

// Helper function to get all media image IDs from a relationships object
export function getMediaImageIds(relationships: DrupalRelationships): string[] {
  return Object.entries(relationships)
    .filter(([, value]) => isMediaImageField(value))
    .flatMap(([, value]) =>
      Array.isArray(value.data)
        ? value.data.map((item) => item.id)
        : [value.data.id]
    );
}

export interface DrupalPartnerLogo {
  id: string;
  type: 'node--partner_logos';
  attributes: {
    title: string;
    field_partner_url: string;
    field_partner_logo: {
      id: string;
      type: 'media--image';
    };
  };
  relationships: {
    field_partner_logo: {
      data: {
        id: string;
        type: 'media--image';
      };
    };
  };
}

export interface ProcessedImage {
  id: string;
  url: string;
  alt: string;
  title: string; // Changed from optional to required
  drupalId: number | null;
}
