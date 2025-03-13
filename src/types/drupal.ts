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
  data: DrupalPage[];
}