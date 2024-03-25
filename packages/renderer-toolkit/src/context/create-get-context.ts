import type { Context } from "@novely/core"

/**
 * Creates utilities to manage context's in renderer
 * @example
 * ```ts
 * function renderer(options: RendererInit) {
 *   const { getContextCached, removeContext } = createGetContext();
 *
 *   return {
 *     getContext: getContextCached((key) => {
 *       // return Context
 *       return {}
 *     }),
 *     removeContext: (key) => {
 *       removeContext(key);
 *     }
 *   }
 * }
 * ```
 */
const createGetContext = () => {
  const CACHE = new Map<string, Context>();

  /**
   * Creates context on call, but if context was already created, returns already created context
   * @param createContext Function to create context
   * @example
   * ```ts
   * function renderer(options: RendererInit) {
   *   return {
   *     getContext: getContextCached((key) => {
   *       // return Context
   *       return {}
   *     }),
   *     removeContext: (key) => {
   *       removeContext(key);
   *     }
   *   }
   * }
   * ```
   */
  const getContextCached = (createContext: (key: string) => Context) => {
    return (key: string) => {
      const cached = CACHE.get(key);

      if (cached) {
        return cached;
      }

      const context = createContext(key);

      CACHE.set(key, context)

      return context;
    }
  }

  /**
   * Removed context
   * @param key Context's key
   * @example
   * ```ts
   * function renderer(options: RendererInit) {
   *   return {
   *     getContext: getContextCached((key) => {
   *       // return Context
   *       return {}
   *     }),
   *     removeContext: (key) => {
   *       // remove context
   *       removeContext(key);
   *     }
   *   }
   * }
   * ```
   */
  const removeContext = (key: string) => {
    CACHE.delete(key)
  }

  return {
    getContextCached,
    removeContext
  }
}

export { createGetContext }
