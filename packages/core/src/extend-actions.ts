import type { ValidAction } from "./action";
import type { Assign } from "./types";

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
const extendAction = <Part0 extends Record<string, (...args: any[]) => ValidAction> , Part1 extends Record<string, (...args: any[]) => ValidAction>>(base: Part0, extension: Part1): Readonly<Assign<Part0, Part1>> => {
  return new Proxy({} as Readonly<Assign<Part0, Part1>>, {
    get(_, key, receiver) {
      return Reflect.get(key in extension ? extension : base, key, receiver)
    },
  })
}

export { extendAction }
