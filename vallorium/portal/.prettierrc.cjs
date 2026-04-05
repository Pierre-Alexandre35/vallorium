/* eslint-env commonjs */
// The above comment tells eslint this file is to be considered a commonjs file (.cjs)
//  despite it's nearest parent pacakge.json file specifying "type": "module".
//  This prevents eslint from complaining using the "module" keyword below, which is required since
//  prettier loads it's config in a commonjs fashion (using require()).

module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  bracketSameLine: false,
  bracketSpacing: true,
  useTabs: false,
  tabWidth: 2,
  endOfLine: 'lf',
  printWidth: 80,
};
