/**
 * https://www.totaltypescript.com/concepts/the-prettify-helper
 */

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type { Prettify }
