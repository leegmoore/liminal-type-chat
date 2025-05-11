module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  rules: {
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
    'max-len': ['error', { 'code': 100 }]
  },
  ignorePatterns: ['build', 'node_modules', 'coverage']
};
