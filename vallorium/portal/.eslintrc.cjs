/* eslint-env commonjs */
// The above comment tells eslint this file is to be considered a commonjs file (.cjs)
//  despite it's nearest parent pacakge.json file specifying "type": "module".
//  This prevents eslint from complaining using the "module" keyword below, which is required since
//  eslint loads it's config in a commonjs fashion (using require()).

module.exports = {
  root: true,
  env: { browser: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended', // lint typescript errors
    'plugin:prettier/recommended', // configure prettier as a formatting engine, and lint it's recommendations
  ],
  plugins: ['@typescript-eslint', 'react-refresh', '@tanstack/query'],
  ignorePatterns: [
    '**/build/**/*',
    '**/dist*/**/*',
    '**/cdk.out/**/*',
    '**/public/**/*',
    '**/coverage/**/*',
    '**/node_modules/**/*',
  ],
  parser: '@typescript-eslint/parser',
  settings: { react: { version: '18.2' } },
  rules: {
    // Lint formatting suggestions as warnings
    'prettier/prettier': 'warn',

    // eslint bans console usage because it could compromise informations,
    //  and forces developers to clean their debugging before pushing to prod.
    //  However we allow console.error statements to remain, and
    //  transform the eslint-error-level to warnings.
    'no-console': ['warn', { allow: ['error'] }],

    // Allow opting-out of some typescript behaviors (including type-checking)
    //  but force developers to justify themselves with a description.
    //  example : @ts-ignore TODO could not figure out the issue, @cchanche please help
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': 'allow-with-description',
      },
    ],

    // Allow unused variables which names start with one or more "_"
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_+$',
        varsIgnorePattern: '^_+$',
      },
    ],

    // Allow empty block statements
    'no-empty': 'off',

    // We consider typescript replaces the need for prop-types.
    //  This rule is enabled by 'plugin:react/recommended'
    'react/prop-types': 'off',
  },
};
