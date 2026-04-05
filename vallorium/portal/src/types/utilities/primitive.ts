export type Primitive =
  | undefined
  | null
  | boolean
  | string
  | number
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  | Function
  | symbol
  | bigint;
