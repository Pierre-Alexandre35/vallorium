import { PrefixWith } from './prefix-with';
import { TruncateWith } from './truncate-with';

/**
 * Truncates all keys of a given object (shallow),
 *
 * Assumes the prefix is separated from the actual key by a "_" (underscore)
 *
 * Keys not respecting this format will be omitted from the resulting type
 *
 * @example
 * // yields the type : {data: number}
 * type PropString = TruncatedWith<{oui_data: number}, 'oui'>
 */
export type TruncatedWith<Rec, Prefix extends string> = {
  [K in TruncateWith<keyof Rec, Prefix>]: PrefixWith<
    K,
    Prefix
  > extends keyof Rec
    ? Rec[PrefixWith<K, Prefix>]
    : never;
};
