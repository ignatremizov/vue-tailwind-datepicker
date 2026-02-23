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
      'perfectionist/sort-imports': ['error', {
        type: 'alphabetical',
        order: 'asc',
        newlinesBetween: 'ignore',
        groups: [
          ['type-builtin', 'type-external'],
          ['value-builtin', 'value-external'],
          ['type-internal', 'value-internal'],
          ['type-parent', 'type-sibling', 'type-index'],
          ['value-parent', 'value-sibling', 'value-index'],
          'ts-equals-import',
          'unknown',
        ],
      }],
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
    files: ['README.md', 'docs/**/*.md'],
    rules: {
      'perfectionist/sort-imports': 'off',
    },
  },
  {
    files: ['**/*.md/**'],
    rules: {
      'perfectionist/sort-imports': 'off',
    },
  },
  {
    files: ['scripts/**/*.playwright.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
)
