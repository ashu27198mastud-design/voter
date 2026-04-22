import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  // Only pick up tests from __tests__, NOT e2e (those are for Playwright)
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
  ],
  // Allow Jest to transform ESM packages like isomorphic-dompurify and its deps
  transformIgnorePatterns: [
    '/node_modules/(?!(isomorphic-dompurify|@exodus|html-encoding-sniffer|jsdom)/)',
  ],
};

export default createJestConfig(customJestConfig);
