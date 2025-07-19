export default {
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current',
          },
        }],
      ],
    }],
  },
  collectCoverageFrom: [
    '*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!babel.config.js',
    '!script.js', // Exclude old script
  ],
};