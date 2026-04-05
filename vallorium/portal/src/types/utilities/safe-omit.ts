/**
 * Same as Omit<T, K>, but only let's you pick keys of T.
 *
 * Useful for type-checking payloads that might change their keys (and type-definitions), and
 * you will want typescript to tell you where you need to refactor your omit declarations.
 *
 * @example
 * type A = { prop1: string, prop2: number }
 * Omit<A, "prop2" | "prop3"> // valid, yields { prop1: string }
 * SafeOmit<A, "prop2" | "prop3"> // error, "prop3" is not a key of A
 */
export type SafeOmit<T, K extends keyof T> = {
  [key in keyof T as key extends K ? never : key]: T[key];
};
