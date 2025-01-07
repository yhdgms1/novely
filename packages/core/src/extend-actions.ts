import type { ValidAction } from './action';
import type { Assign } from './types';

type Part = Record<string, (...args: any[]) => ValidAction>;

/**
 * Extens core action with custom actions
 * @param base Actions object you will extend, `engine.action`
 * @param extension Actions object you will extend with
 * @example
 * ```ts
 * const action = extendAction(engine.action, {
 *   particles: (options: Parameters<typeof particles>[0]) => {
 *     return ['custom', particles(options)]
 *   }
 * })
 * ```
 */
const extendAction = <Part0 extends Part, Part1 extends Part>(base: Part0, extension: Part1): Readonly<Assign<Part0, Part1>> => {
	return {
		...extension,
		...base
	}
};

export { extendAction };
