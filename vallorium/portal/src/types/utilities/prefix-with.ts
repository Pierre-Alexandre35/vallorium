/**
 * Creates a template literal type with the given prefix
 *
 * Prefix is separated from the actual key by a "_" (underscore)
 *
 * @example
 * // yields the literal type : 'data_prop'
 * type PrefixedProp = PrefixWith<'prop', 'data'>
 */
export type PrefixWith<
  Key extends string | number | symbol, // Support keys from a `keyof` operator
  Prefix extends string,
> = Key extends Exclude<Key, symbol> ? `${Prefix}_${Key}` : never;
