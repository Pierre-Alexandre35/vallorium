/**
 * Renders every property of T nullable.
 * @example
 * type A = Nullable<{ prop: string }>
 * let a: A = { prop: null } // valid
 */
export type Nullable<T> = { [K in keyof T]: T[K] | null };
