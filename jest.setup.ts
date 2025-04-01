import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_DRUPAL_BASE_URL = 'https://api.example.com/jsonapi';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment the following lines to suppress specific console methods during testing
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};
