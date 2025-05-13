/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Use 'node' environment for backend testing
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Explicitly point to tsconfig
      useESM: true, // Enable ESM support in ts-jest
    }],
  },
  // Add any other Jest configurations needed for your project
  // For example, module name mapping, setup files, etc.
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    // These paths should work for tests in the root `tests` directory
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    // If ai.ts is now in src/utils/actions/jobs/ai.ts, this might also be needed
    // depending on how it's imported by other src files.
    // For the test file itself, direct relative paths are better if possible.
  },
  // Tell Jest to look for ESM modules
  extensionsToTreatAsEsm: ['.ts'],
  // Define test roots if tests are outside src
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Setup files to run before each test file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Reverted to .js
};
