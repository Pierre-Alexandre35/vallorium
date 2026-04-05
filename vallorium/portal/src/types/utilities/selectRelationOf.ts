import { OmitRelationsOf } from './omitRelationsOf';

/**
 * Requires property K of T, and returns T[K] without it's optional properties.
 *
 * This is especially usefull when building property types of DTOs that were
 * included using a selected typeorm relation.
 * ```
 * // Typeorm relation :
 * this.useRepo.leftJoinAndSelect('user.profile', 'profile')
 *
 * // shared DTO :
 * export interface UserDTO extends User {
 *  profile: SelectRelationOf<User, 'profile'>
 * }
 * ```
 *
 * This type will preserve the null union if present. However, if you were to
 * complete the resulting type with an intersection, the null union will disapear.
 *
 * ```
 * type A = ({ id: string } | null) & { n: string }
 * type B = {id: string, n: string} // <-- results to
 * type C = {id: string, n: string} | null // <-- expected
 * ```
 * You will have to specify that a property can be null by adding manually
 * the missing `| null` union.
 *
 * @example
 * export interface UserDTO extends User {
 *  profile:
 *    | (SelectRelationOf<User, 'profile'> & {
 *        tags: SelectRelationOf<profile, 'tags'>;
 *      })
 *    | null;
 * }
 *
 *
 */
export type SelectRelationOf<T, K extends keyof T> = OmitRelationsOf<
  Required<T>[K]
>;
