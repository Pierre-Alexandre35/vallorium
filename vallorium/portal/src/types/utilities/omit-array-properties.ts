/**
 * This utility type removes all array-properties of an object.
 * 
 * @example
 * 
 *  interface Person {
        required: string;
        optional?: string;
        maybeUndefined: string | undefined
        array: Date[]
    }

    type A = OmitArrayProperties<Person> // { required: string, optional?: string, maybeUndefined: string | undefined }
 * 
 */
export type OmitArrayProperties<T> = T extends unknown[]
  ? never
  : {
      [K in keyof T as T[K] extends unknown[] ? never : K]: T[K];
    };
