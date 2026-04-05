import { PrefixWith } from './prefix-with';

/**
 * Extract the key from a prefixed string, given the prefix.
 *
 * Assumes the prefix is separated from the actual key by a "_" (underscore)
 *
 * @example
 * // yields the literal type : 'prop'
 * type PropString = TruncateWith<'data_prop', 'data'>
 */
export type TruncateWith<
  Key extends string | number | symbol, // Support keys from a `keyof` operator
  Prefix extends string,
> = Key extends PrefixWith<infer K, Prefix> ? K : never;
