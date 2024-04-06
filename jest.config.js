const esModules = ['@middy'].join('|');

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  modulePaths: ['<rootDir>/node_modules'],
  testMatch: ['**/*.tests.ts'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', { useESM: true }]
  },
  transformIgnorePatterns: [`node_modules/(?!${esModules})`]
};
