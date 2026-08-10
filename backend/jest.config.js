module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/envSetup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  detectOpenHandles: true,
  forceExit: true,
};
