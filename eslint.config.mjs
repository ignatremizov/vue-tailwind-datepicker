import antfu from '@antfu/eslint-config'
import importNewlines from 'eslint-plugin-import-newlines'

export default antfu(
  {
    type: 'lib',
    ignores: [
      'dist',
      'node_modules',
      'docs/.vitepress/cache',
      'docs/.vitepress/dist',
    ],
    rules: {
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'style/object-curly-newline': 'off',
      'style/object-property-newline': 'off',
      'import-newlines/enforce': ['error', {
        'items': 999,
        'max-len': 82,
        'semi': false,
        'forceSingleLine': true,
      }],
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'perfectionist/sort-named-imports': ['error', {
        type: 'alphabetical',
        order: 'asc',
        groups: ['value-import', 'type-import'],
      }],
      'ts/explicit-function-return-type': 'off',
      'vue/custom-event-name-casing': 'off',
    },
    plugins: {
      'import-newlines': importNewlines,
    },
  },
  {
    files: ['src/App.vue'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.playwright.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
)
