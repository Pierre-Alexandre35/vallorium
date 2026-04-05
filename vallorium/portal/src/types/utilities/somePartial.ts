import { Primitive } from './primitive';

/**
 * Returns the given record R with keys K now optional
 */
export type SomePartial<R, K extends keyof R> = R extends Primitive
  ? R extends undefined
    ? never
    : R
  : { [RK in Exclude<keyof R, K>]: R[K] } & { [OK in K]?: R[OK] };
