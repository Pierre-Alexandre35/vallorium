/**
 * Transform unions to intersections.
 * @example
 * type Test = { testAttr: number } | { other: string }
 * type Res = UnionToIntersection<Test> // { testAttr: number; other: string }
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never;
