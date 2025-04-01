import { fetchToolboxResources } from '../drupalFetcher';
import { ToolboxResourceSchema } from '@/types/drupal';

// Mock fetch globally
global.fetch = jest.fn();

describe('drupalFetcher', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('fetchToolboxResources', () => {
    const mockValidResponse = {
      jsonapi: {
        version: '1.0',
        meta: { links: { self: { href: 'http://jsonapi.org/format/1.0/' } } },
      },
      data: [
        {
          type: 'node--toolbox_resource',
          id: '1',
          attributes: {
            title: 'RCR Toolbox',
            field_resource_description: [
              {
                value: 'Description',
                format: 'basic_html',
                processed: '<p>Description</p>',
              },
            ],
            field_resource_category: [
              {
                value: 'Protocol Packets',
                format: 'basic_html',
                processed: 'Protocol Packets',
              },
            ],
          },
          relationships: {
            field_hero_image: {
              data: { type: 'media--image', id: '1' },
            },
          },
        },
      ],
      included: [
        {
          type: 'media--image',
          id: '1',
          attributes: { name: 'Hero Image' },
          relationships: {
            field_media_image: {
              data: { type: 'file--file', id: '2' },
            },
          },
        },
        {
          type: 'file--file',
          id: '2',
          attributes: {
            uri: { url: '/files/hero.jpg' },
            url: '/files/hero.jpg',
          },
        },
      ],
      links: {
        self: { href: 'http://example.com/api' },
      },
    };

    it('should validate response data structure', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidResponse,
      });

      // Validate mock data matches schema
      expect(() => {
        ToolboxResourceSchema.parse(mockValidResponse.data[0]);
      }).not.toThrow();

      // Test actual fetch function
      const result = await fetchToolboxResources();
      expect(result).toBeDefined();
      expect(result.title).toBe('RCR Toolbox');
    });

    it('should handle API errors gracefully', async () => {
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            errors: [{ detail: 'Invalid include path' }],
          }),
      });

      const result = await fetchToolboxResources();
      expect(result).toBeDefined();
      expect(result.title).toBe('RCR Toolbox'); // Should return fallback data
    });

    it('should handle invalid response data', async () => {
      // Mock invalid response structure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              type: 'node--toolbox_resource',
              id: '1',
              attributes: {
                // Missing required fields
              },
            },
          ],
        }),
      });

      const result = await fetchToolboxResources();
      expect(result).toBeDefined();
      expect(result.title).toBe('RCR Toolbox'); // Should return fallback data
    });
  });
});
