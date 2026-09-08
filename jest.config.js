const defaultConfig = require('@wordpress/scripts/config/jest-unit.config');

module.exports = {
  ...defaultConfig,
  setupFilesAfterEnv: [
    ...(defaultConfig.setupFilesAfterEnv || []),
    '<rootDir>/tests/js/setup-tests.ts',
  ],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [
          require.resolve('@babel/preset-env'),
          require.resolve('@babel/preset-typescript'),
          [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
        ],
      },
    ],
  },
};
