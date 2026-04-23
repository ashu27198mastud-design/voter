/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@exodus/bytes|isomorphic-dompurify)/)',
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
