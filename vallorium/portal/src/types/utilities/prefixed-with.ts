import { PrefixWith } from './prefix-with';
import { TruncateWith } from './truncate-with';

/**
 * Prefixes all keys of a given object (shallow)
 *
 * @example
 * type Data = PrefixedWith<{prop: number}, 'data'>
 * // same as
 * type Data = {data_prop: number}
 */
export type PrefixedWith<Rec, Prefix extends string> = {
  [K in PrefixWith<keyof Rec, Prefix>]: TruncateWith<
    K,
    Prefix
  > extends keyof Rec
    ? Rec[TruncateWith<K, Prefix>]
    : never;
};
