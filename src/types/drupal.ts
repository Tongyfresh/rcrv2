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
      [key: string]: any; // Allow for dynamic field names
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
      [key: string]: any;
    };
    relationships?: DrupalRelationships;
  }>;
}

// Helper function to check if a field is a media image field
export function isMediaImageField(field: any): field is MediaImageField {
  return (
    field?.data &&
    (Array.isArray(field.data)
      ? field.data.every((item) => item.type === 'media--image')
      : field.data.type === 'media--image')
  );
}

// Helper function to get all media image IDs from a relationships object
export function getMediaImageIds(relationships: DrupalRelationships): string[] {
  return Object.entries(relationships)
    .filter(([_, value]) => isMediaImageField(value))
    .flatMap(([_, value]) =>
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
