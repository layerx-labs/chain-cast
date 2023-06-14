/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['dist', '\\b(?!.*test|.*spec).+\\.ts\\b'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
};
