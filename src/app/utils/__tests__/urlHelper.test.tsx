import {
  ensureAbsoluteUrl,
  buildApiUrl,
  processImageUrl,
  processFileUrl,
  getFallbackImage,
  processRelationshipImage,
  getImageUrl,
  getSafeUrl,
  extractLogoPath,
} from '../urlHelper';

describe('urlHelper', () => {
  describe('ensureAbsoluteUrl', () => {
    it('should return empty string for null or undefined input', () => {
      expect(ensureAbsoluteUrl(null)).toBe('');
      expect(ensureAbsoluteUrl(undefined)).toBe('');
    });

    it('should return the same URL if already absolute', () => {
      const url = 'https://example.com/image.jpg';
      expect(ensureAbsoluteUrl(url)).toBe(url);
    });

    it('should prepend base URL to relative paths', () => {
      const baseUrl = 'https://api.example.com';
      const relativePath = '/images/test.jpg';
      expect(ensureAbsoluteUrl(relativePath, baseUrl)).toBe(
        `${baseUrl}${relativePath}`
      );
    });
  });

  describe('buildApiUrl', () => {
    it('should handle path with ID format', () => {
      expect(buildApiUrl('node/home_page')).toBe(
        'https://api.example.com/jsonapi/node/home_page'
      );
    });

    it('should handle entity--bundle format', () => {
      expect(buildApiUrl('media--image')).toBe(
        'https://api.example.com/jsonapi/media/image'
      );
      expect(buildApiUrl('node--article')).toBe(
        'https://api.example.com/jsonapi/node/article'
      );
    });

    it('should handle simple resource type', () => {
      expect(buildApiUrl('node')).toBe('https://api.example.com/jsonapi/node');
    });
  });

  describe('processImageUrl', () => {
    const mockEntity = {
      relationships: {
        field_image: {
          data: {
            id: '1',
            type: 'media--image',
          },
        },
      },
    };

    const mockIncluded = [
      {
        id: '1',
        type: 'media--image',
        relationships: {
          field_media_image: {
            data: {
              id: '2',
              type: 'file--file',
            },
          },
        },
      },
      {
        id: '2',
        type: 'file--file',
        attributes: {
          uri: {
            url: '/files/image.jpg',
          },
        },
      },
    ];

    it('should process image URL correctly', () => {
      const result = processImageUrl(mockEntity, mockIncluded, 'field_image');
      expect(result).toBe('https://api.example.com/files/image.jpg');
    });

    it('should return null for missing relationships', () => {
      const result = processImageUrl({}, mockIncluded, 'field_image');
      expect(result).toBeNull();
    });
  });

  describe('processFileUrl', () => {
    const mockEntity = {
      relationships: {
        field_resource_file: {
          data: {
            id: '1',
            type: 'file--file',
          },
        },
      },
    };

    const mockIncluded = [
      {
        id: '1',
        type: 'file--file',
        attributes: {
          uri: {
            url: '/files/document.pdf',
          },
        },
      },
    ];

    it('should process file URL correctly', () => {
      const result = processFileUrl(mockEntity, mockIncluded);
      expect(result).toBe('https://api.example.com/files/document.pdf');
    });

    it('should return "#" for missing file relationship', () => {
      const result = processFileUrl({}, mockIncluded);
      expect(result).toBe('#');
    });
  });

  describe('getFallbackImage', () => {
    it('should return the correct fallback image path', () => {
      expect(getFallbackImage()).toBe('/images/fallback-image.jpg');
    });
  });

  describe('getSafeUrl', () => {
    it('should return "/" for empty or "#" URLs', () => {
      expect(getSafeUrl('')).toBe('/');
      expect(getSafeUrl('#')).toBe('/');
    });

    it('should return relative URLs as-is', () => {
      expect(getSafeUrl('/about')).toBe('/about');
    });

    it('should return valid absolute URLs as-is', () => {
      expect(getSafeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should return "/" for invalid URLs', () => {
      expect(getSafeUrl('not-a-url')).toBe('/');
    });
  });

  describe('processRelationshipImage', () => {
    const mockData = {
      included: [
        {
          id: '1',
          type: 'media--image',
          relationships: {
            field_media_image: {
              data: {
                id: '2',
                type: 'file--file',
              },
            },
          },
        },
        {
          id: '2',
          type: 'file--file',
          attributes: {
            uri: {
              url: '/files/test-image.jpg',
            },
          },
        },
      ],
    };

    const mockEntity = {
      relationships: {
        field_hero_image: {
          data: {
            id: '1',
            type: 'media--image',
          },
        },
      },
    };

    it('should process relationship image correctly', () => {
      const result = processRelationshipImage(
        mockData,
        mockEntity,
        'field_hero_image'
      );
      expect(result).toBe('https://api.example.com/files/test-image.jpg');
    });

    it('should return null for missing relationship', () => {
      const result = processRelationshipImage(mockData, {}, 'field_hero_image');
      expect(result).toBeNull();
    });

    it('should return null for missing included data', () => {
      const result = processRelationshipImage(
        {},
        mockEntity,
        'field_hero_image'
      );
      expect(result).toBeNull();
    });
  });

  describe('getImageUrl', () => {
    const mockData = {
      included: [
        {
          id: '1',
          type: 'media--image',
          relationships: {
            field_media_image: {
              data: {
                id: '2',
                type: 'file--file',
              },
            },
          },
        },
        {
          id: '2',
          type: 'file--file',
          attributes: {
            uri: {
              url: '/files/image.jpg',
            },
          },
        },
      ],
    };

    it('should return correct image URL', () => {
      const result = getImageUrl(mockData, '1');
      expect(result).toBe('https://api.example.com/files/image.jpg');
    });

    it('should return null for missing image reference', () => {
      const result = getImageUrl(mockData, '3');
      expect(result).toBeNull();
    });

    it('should return null for invalid data structure', () => {
      const result = getImageUrl({}, '1');
      expect(result).toBeNull();
    });
  });

  describe('extractLogoPath', () => {
    const mockData = {
      data: {
        relationships: {
          field_rcr_logo: {
            data: {
              id: '1',
              type: 'media--image',
            },
          },
        },
      },
      included: [
        {
          id: '1',
          type: 'media--image',
          relationships: {
            field_media_image: {
              data: {
                id: '2',
                type: 'file--file',
              },
            },
          },
        },
        {
          id: '2',
          type: 'file--file',
          attributes: {
            uri: {
              url: '/files/logo.png',
            },
          },
        },
      ],
    };

    it('should extract logo path correctly', () => {
      const result = extractLogoPath(mockData);
      expect(result).toBe('/files/logo.png');
    });

    it('should return null for missing logo data', () => {
      const result = extractLogoPath({});
      expect(result).toBeNull();
    });

    it('should return null for invalid data structure', () => {
      const result = extractLogoPath({ data: {} });
      expect(result).toBeNull();
    });
  });
});
