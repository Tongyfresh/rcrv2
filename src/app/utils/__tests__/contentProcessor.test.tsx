import {
  processHomePageData,
  processPageData,
  processServicesPageData,
  processAboutPageData,
  processToolboxResourceData,
  processToolboxPageData,
} from '../contentProcessor';
import { DrupalResponse, DrupalEntity } from '@/types/drupal';

describe('contentProcessor', () => {
  describe('processHomePageData', () => {
    const mockData = {
      data: {
        attributes: {
          title: 'Home Page',
          field_hero_title: 'Welcome',
          field_hero_description: 'Description',
        },
        relationships: {
          field_hero_image: {
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
          attributes: {},
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
              url: '/files/hero.jpg',
            },
          },
        },
      ],
    };

    it('should process home page data correctly', () => {
      const result = processHomePageData(mockData);
      expect(result).toEqual({
        homePage: mockData.data,
        heroImageUrl: 'https://api.example.com/files/hero.jpg',
        articleImageUrl: null,
        mapImageUrl: null,
        cards: [],
        cardTitle: 'Explore Our Resources',
        partners: [],
        mapLocationsLeft: '',
        mapLocationsRight: '',
        whyRcrContent: '',
      });
    });

    it('should handle missing data gracefully', () => {
      const result = processHomePageData({});
      expect(result).toEqual({
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
      });
    });
  });

  describe('processPageData', () => {
    const mockData = {
      data: {
        attributes: {
          title: 'Page Title',
        },
        relationships: {
          field_article_image: {
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
          attributes: {},
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
              url: '/files/article.jpg',
            },
          },
        },
      ],
    };

    it('should process page data correctly', () => {
      const result = processPageData(mockData, 'node');
      expect(result).toEqual({
        pageContent: mockData.data,
        heroImageUrl: 'https://api.example.com/files/article.jpg',
      });
    });

    it('should handle missing data gracefully', () => {
      const result = processPageData({}, 'node');
      expect(result).toEqual({
        pageContent: null,
      });
    });
  });

  describe('processServicesPageData', () => {
    const mockData = {
      data: {
        attributes: {
          title: 'Services',
          field_hero_title: 'Our Services',
          field_hero_description: 'Service Description',
        },
        relationships: {
          field_hero_image: {
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
          attributes: {},
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
              url: '/files/services.jpg',
            },
          },
        },
      ],
    };

    it('should process services page data correctly', () => {
      const result = processServicesPageData(mockData);
      expect(result).toEqual({
        pageContent: mockData.data,
        heroImageUrl: 'https://api.example.com/files/services.jpg',
        staggeredImages: [],
        staggeredText: [],
      });
    });

    it('should handle missing data gracefully', () => {
      const result = processServicesPageData({});
      expect(result).toEqual({
        pageContent: null,
        heroImageUrl: null,
        staggeredImages: [],
        staggeredText: [],
      });
    });
  });

  describe('processAboutPageData', () => {
    const mockData: DrupalResponse = {
      data: {
        id: '1',
        type: 'node--about',
        attributes: {
          title: 'About Us',
          field_hero_title: 'About Our Company',
          field_hero_description: 'Company Description',
        },
        relationships: {
          field_hero_image: {
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
          attributes: {},
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
              url: '/files/about.jpg',
            },
          },
        },
      ],
    };

    it('should process about page data correctly', () => {
      const result = processAboutPageData(mockData);
      expect(result).toEqual({
        pageContent: mockData.data,
        heroImageUrl: 'https://api.example.com/files/about.jpg',
        impactStats: [],
        teamMembers: [],
      });
    });

    it('should handle missing data gracefully', () => {
      const result = processAboutPageData({} as DrupalResponse);
      expect(result).toEqual({
        pageContent: null,
        heroImageUrl: null,
        impactStats: [],
        teamMembers: [],
      });
    });
  });

  describe('processToolboxResourceData', () => {
    const mockData = {
      data: [
        {
          id: 'resource-1',
          type: 'node--toolbox_resource',
          attributes: {
            title: 'Resource Title',
            field_resource_description: [
              {
                value: 'Resource Description',
                format: 'basic_html',
                processed: 'Resource Description',
              },
            ],
            field_resource_category: [
              {
                value: 'General',
                format: 'basic_html',
                processed: 'General',
              },
            ],
          },
          relationships: {
            field_resource_file: {
              data: {
                id: '1',
                type: 'file--file',
              },
            },
          },
        },
      ],
      included: [
        {
          id: '1',
          type: 'file--file',
          attributes: {
            uri: {
              url: '/files/resource.pdf',
            },
            url: '/files/resource.pdf',
            filemime: 'application/pdf',
            filesize: 1258291, // ~1.2 MB
          },
        },
      ],
    };

    it('should process toolbox resource data correctly', () => {
      const result = processToolboxResourceData(mockData);
      expect(result).toEqual({
        title: 'RCR Toolbox',
        pageContent:
          '<p>Access these resources to support your rural clinical research efforts.</p>',
        categories: ['General'],
        resources: [
          {
            id: 'resource-1',
            title: 'Resource Title',
            description: 'Resource Description',
            fileUrl: 'https://api.example.com/files/resource.pdf',
            fileType: 'pdf',
            fileSize: '1.2 MB',
            category: 'General',
            lastUpdated: expect.any(String),
            imageUrl: null,
          },
        ],
        heroImageUrl: null,
        articleImageUrl: null,
      });
    });

    it('should handle missing data gracefully', () => {
      const result = processToolboxResourceData({});
      expect(result).toEqual({
        title: 'RCR Toolbox',
        pageContent:
          '<p>Access these resources to support your rural clinical research efforts.</p>',
        categories: [],
        resources: [],
        heroImageUrl: null,
        articleImageUrl: null,
      });
    });
  });

  describe('processToolboxPageData', () => {
    const mockData = {
      data: {
        attributes: {
          title: 'Toolbox',
          field_hero_title: 'Our Resources',
          field_hero_description: 'Resource Description',
        },
        relationships: {
          field_hero_image: {
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
              url: '/files/toolbox.jpg',
            },
          },
        },
      ],
    };

    it('should process toolbox page data correctly', () => {
      const result = processToolboxPageData(mockData);
      expect(result).toEqual({
        title: 'Toolbox',
        pageContent: null,
        categories: [
          'Protocol Packets',
          'Implementation Kits',
          'Training Modules',
          'Technology Playbooks',
        ],
        resources: [
          {
            id: 'resource-protocol-packets',
            title: 'Protocol Packets',
            description: 'Description of Protocol Packets',
            fileUrl: 'https://example.com/protocol-packets.pdf',
            fileType: 'PDF',
            fileSize: '1.2 MB',
            category: 'Protocol Packets',
            lastUpdated: expect.any(String),
            imageUrl: '/images/fallback-image.jpg',
          },
          {
            id: 'resource-implementation-kits',
            title: 'Implementation Kits',
            description: 'Description of Implementation Kits',
            fileUrl: 'https://example.com/implementation-kits.pdf',
            fileType: 'PDF',
            fileSize: '1.2 MB',
            category: 'Implementation Kits',
            lastUpdated: expect.any(String),
            imageUrl: '/images/fallback-image.jpg',
          },
          {
            id: 'resource-training-modules',
            title: 'Training Modules',
            description: 'Description of Training Modules',
            fileUrl: 'https://example.com/training-modules.pdf',
            fileType: 'PDF',
            fileSize: '1.2 MB',
            category: 'Training Modules',
            lastUpdated: expect.any(String),
            imageUrl: '/images/fallback-image.jpg',
          },
          {
            id: 'resource-technology-playbooks',
            title: 'Technology Playbooks',
            description: 'Description of Technology Playbooks',
            fileUrl: 'https://example.com/technology-playbooks.pdf',
            fileType: 'PDF',
            fileSize: '1.2 MB',
            category: 'Technology Playbooks',
            lastUpdated: expect.any(String),
            imageUrl: '/images/fallback-image.jpg',
          },
        ],
        heroImageUrl: 'https://api.example.com/files/toolbox.jpg',
        articleImageUrl: null,
      });
    });

    it('should handle missing data gracefully', () => {
      const result = processToolboxPageData({});
      expect(result).toEqual({
        title: 'RCR Toolbox',
        pageContent:
          '<p>Access these resources to support your rural clinical research efforts.</p>',
        categories: [],
        resources: [],
        heroImageUrl: null,
        articleImageUrl: null,
      });
    });
  });
});
