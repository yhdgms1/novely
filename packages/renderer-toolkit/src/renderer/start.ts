import { noop } from "../utils";

/**
 * Unmounts app
 *
 * @example
 * ```ts
 * import { createRoot } from 'react-dom/client';
 *
 * const root = createRoot(document.body);
 *
 * root.render(<App />);
 *
 * // this is we want
 * root.unmount();
 * ```
 */
type StartFunctionUnMountFn = () => void;

/**
 * Mounts app, returns unmount function
 *
 * @example
 * ```ts
 * import { createRoot } from 'react-dom/client';
 *
 * const root = createRoot(document.body);
 *
 * function start() {
 *   root.render(<App />);
 *
 *   return () => {
 *     root.unmount();
 *   }
 * }
 * ```
 */
type StartFunctionMountFn = () => StartFunctionUnMountFn;

/**
 * @example
 * ```ts
 * import { createRoot } from 'react-dom/client';
 *
 * const root = createRoot(document.body);
 *
 * createStartFunction(() => {
 *   root.render(<App />);
 *
 *   return () => {
 *     root.unmount();
 *   }
 * })
 * ```
 */
const createStartFunction = (fn: StartFunctionMountFn) => {
  let unmount: StartFunctionUnMountFn = noop;

  return () => {
    unmount();
    unmount = fn();

    return {
      unmount: () => {
        unmount();
        unmount = noop;
      }
    }
  }
}

export { createStartFunction }
export type { StartFunctionMountFn, StartFunctionUnMountFn }
