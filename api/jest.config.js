/**
 * Jest configuration for API testing
 */

export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.js',
    'pages/api/**/*.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'json'],
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true,
  testTimeout: 10000,
  extensionsToTreatAsEsm: ['.js', '.jsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)'
  ],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}; 