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
    };
    relationships?: {
      field_hero_image?: {
        data: {
          type: string;
          id: string;
        };
      };
      // ... other relationships
    };
  }>;
  included?: Array<{
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
  }>;
}
