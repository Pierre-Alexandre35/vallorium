import { JSXElementConstructor } from 'react';

/**
 * Extract the properties of a react component
 *
 * Optionnally provide a property name (as a second argument)
 * to extract only this propertie's type.
 * @example
 * 
  type P = {
    title: string;
    titleComponent?: ComponentProps<typeof QtmTypography, 'component'>;
    contentProps?: ComponentProps<typeof QtmTypography>;
  };

 * 
 */
export type ComponentProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>,
  P extends keyof React.ComponentProps<C> | undefined = undefined,
> = P extends undefined
  ? React.ComponentProps<C>
  : // @ts-ignore P is clearly able to index React.ComponentProps<C>, but TS is confused at it because of '| undefined'
    React.ComponentProps<C>[P];
