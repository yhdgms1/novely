import type { Context } from "@novely/core"

/**
 * Simply set root to the context
 * @param getContext Function that returns main context
 * @example
 * ```ts
 * const { root, setRoot } = createRootSetter(() => renderer.getContext(options.mainContextKey));
 *
 * const renderer = {
 *   getContext: getContextCached((key) => {
 *     return {
 *       root: root()
 *     }
 *   }),
 *   ui: {
 *     start: createStartFunction(() => {
 *       // this is just an example, use your library to get the node
 *       const element = document.createElement('div');
 *
 *       document.body.appendChild(element);
 *
 *       setRoot(element);
 *
 *       return () => {
 *         element.remove();
 *       }
 *     })
 *   }
 * }
 * ```
 */
const createRootSetter = (getContext: () => Context) => {
  let element: HTMLElement;

  return {
    root() {
      return element
    },
    setRoot(root: HTMLElement) {
      element = root;

      const context = getContext();

      /**
       * Update directly if root was not set already
       */
      if (!context.root) {
        context.root = root;
      }
    }
  }
}

export { createRootSetter }
