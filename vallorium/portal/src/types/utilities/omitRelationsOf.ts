/**
 * Removes optional properties but keeps non-optional properties having undefined 
 * as a possible value of their type.
 * 
 * This will also work with arrays.
 * 
 * @example
 * 
 *  interface Person {
        required: string;
        optional?: string;
        maybeUndefined: string | undefined
    }

    type A = RequiredFieldsOnly<Person> // { required: string, maybeUndefined: string | undefined }
 */
type RequiredFieldsOnly<T> = T extends (infer U)[]
  ? RequiredFieldsOnly<U>[]
  : {
      [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
    };

/**
 * Removes optional properties but keeps non-optional properties having undefined
 * as a possible value of their type.
 *
 * This type will also preserve any null union.
 *
 * This is usefull to exclude relations from entities (which are usually optional),
 * and build DTOs.
 *
 * Some OneToMany of ManyToMany (array) relations might not have been marked as optionnal.
 * If you wish to remove those, use the `OmitArrayProperties<T>` utility
 *
 */
export type OmitRelationsOf<T> = null extends T
  ? RequiredFieldsOnly<T> | null
  : RequiredFieldsOnly<T>;
