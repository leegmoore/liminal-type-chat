module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    './src/routes/domain/health.ts': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    },
    './src/services/core/health-service.ts': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    }
  },
};
