import type { CSSProperties } from "react";

export type GameCssProperties = CSSProperties & Record<`--${string}`, string | number>;
