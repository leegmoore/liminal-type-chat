module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es6: true,
    jest: true
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['error', 'always'],
    'indent': ['error', 2],
    'max-len': ['warn', { 'code': 100 }]
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
  overrides: [
    {
      // Disable max-len for app.ts which contains HTML/CSS template code
      files: ['src/app.ts'],
      rules: {
        'max-len': 'off'
      }
    },
    {
      // Relax max-len for test files
      files: ['**/*.test.ts', 'test/**/*.ts'],
      rules: {
        'max-len': ['warn', { 'code': 120 }]
      }
    }
  ]
};
