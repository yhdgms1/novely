/**
 * https://habr.com/ru/articles/526998/#comment_22278508
 */
type DeepMergeTwoTypes<A, B> = A | B extends Record<string, unknown>
	? Omit<A, keyof B> & Omit<B, keyof A> & { [key in keyof (A | B)]: DeepMergeTwoTypes<A[key], B[key]> }
	: A | B;

export type { DeepMergeTwoTypes };
