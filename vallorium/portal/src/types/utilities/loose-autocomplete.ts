/**
 * Converts a string union to a loose string union
 * @example
 * type A = LooseAutocomplete<"sm" | "xs">;
 * let a: A = "lg" // valid type, but intellisense suggested "sm" and "xs"
 * @see https://www.totaltypescript.com/tips/create-autocomplete-helper-which-allows-for-arbitrary-values
 */
export type LooseAutocomplete<T extends string> = T | Omit<string, T>;
