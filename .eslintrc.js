module.exports = {
  root: true,
  extends: [
    'eslint:recommended'
  ],
  env: {
    node: true,
    es6: true
  },
  rules: {
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['error', 'always'],
    'indent': ['error', 2],
    'max-len': ['error', { 'code': 100 }]
  },
  ignorePatterns: [
    'node_modules', 
    'coverage',
    'server/dist',
    'client/build'
  ],
  overrides: [
    // Server configuration
    {
      files: ['server/**/*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended'
      ],
      env: {
        node: true
      }
    },
    // Client configuration
    {
      files: ['client/**/*.ts', 'client/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended'
      ],
      env: {
        browser: true
      }
    }
  ]
};
