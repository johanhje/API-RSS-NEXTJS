/**
 * Global Jest setup file
 * 
 * This file runs before each test file and can be used to set up
 * global test environment, mock global objects, and define utilities
 * that will be available to all tests.
 */

// Extend Jest with custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Set up global test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_PATH = ':memory:'; // Use in-memory SQLite for tests

// Global helper function to wait for a specific amount of time
global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Silence console output during tests (comment out when debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Skapa en mock för import.meta.url som används i vissa moduler
global.import = { meta: { url: 'file:///test/url' } };

// Mock för URL och path-funktioner som används med import.meta
import { fileURLToPath } from 'url';
import path from 'path';

jest.mock('url', () => {
  const originalModule = jest.requireActual('url');
  return {
    ...originalModule,
    fileURLToPath: jest.fn((url) => {
      if (url === 'file:///test/url') {
        return '/test/path';
      }
      return originalModule.fileURLToPath(url);
    }),
  };
});

// Mock för Node fetch eftersom vi använder node-fetch modulen
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Map(),
  })
);

// Fixa för att node-fetch används som ESM-modul
jest.mock('node-fetch', () => {
  return {
    __esModule: true,
    default: global.fetch,
  };
});

// Mock för process.env om det behövs
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.API_PORT = process.env.API_PORT || '8888'; 