module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'modules/dsh/services/**/*.ts',
    'modules/dsh/repositories/**/*.ts',
    'modules/dsh/entities/**/*.ts',
    'modules/dsh/config/**/*.ts',
    '!modules/dsh/**/*.spec.ts',
    'modules/esf/services/**/*.ts',
    'modules/esf/repositories/**/*.ts',
    'modules/esf/entities/**/*.ts',
    '!modules/esf/**/*.spec.ts',
    'modules/arb/services/**/*.ts',
    'modules/arb/repositories/**/*.ts',
    'modules/arb/entities/**/*.ts',
    '!modules/arb/**/*.spec.ts',
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
  },
};
