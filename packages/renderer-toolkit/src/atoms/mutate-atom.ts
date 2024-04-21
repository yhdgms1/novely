import type { Atom, WritableAtom } from 'nanostores'
import { setPath } from 'nanostores'

// eslint-disable-next-line @typescript-eslint/ban-types
type Setter<T> = (T extends Function ? never : T) | ((prevValue: T) => T)

/**
 * @link https://github.com/nanostores/nanostores/blob/56b0fbc7f51d94073191309376b9cf63948b2c91/deep-map/index.js#L9-L14
 */
const getClonedOldValue = <$AtomValue>(atom: Atom<$AtomValue>) => {
  let oldValue

  try {
    oldValue = structuredClone(atom.value)
  } catch {
    oldValue = { ...atom.value }
  }

  return oldValue
}

const batchUpdate = (fn: () => void) => {}

/**
 * @example
 * ```ts
 * const $atom = atom({ some: { key: ['Hello'] } });
 *
 * mutateAtom(
 *  $atom,
 *  (atom) => atom.some.key,
 *  (value) => [...value, 'World']
 * )
 * ```
 */
const mutateAtom = <$AtomValue extends object, $MutateValue>(atom: WritableAtom<$AtomValue>, getPath: (object: $AtomValue) => $MutateValue, setter: Setter<$MutateValue>) => {
  const atomValue = atom.get();
  const targets = new Set();

  let current;

  const path: PropertyKey[] = [];

  const proxyHandler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      if (targets.has(target)) {
        /**
         * Same property was accessed twice
         */
        throw new ReferenceError(`Attempted to access property on the same target multiple times.`)
      }

      const value = Reflect.get(target, prop, receiver);

      targets.add(target);
      path.push(prop);

      current = value;

      if (value && typeof value === 'object') {
        return new Proxy(value, proxyHandler);
      }

      return value;
    },
  }

  getPath(new Proxy(atomValue, proxyHandler))

  /**
   * Throw an error if no path is extracted
   */
  if (path.length === 0) {
    throw new Error('No valid path extracted from the provided getPath function.')
  }

  // @ts-expect-error Should be ignored
  const newValue = typeof setter === 'function' ? setter(current as $MutateValue) : setter;

  if (newValue === current) {
    console.warn(`The new value is the same as the current value.`)

    return newValue;
  }

  const oldMap = getClonedOldValue(atom);

  /**
   * In order to use `setPath` exported from `nanostores` we ought to fake our array path to "string"
   */
  const fakedPath = {
    split: () => {
      return {
        flatMap: () => {
          return path;
        }
      }
    }
  }

  // @ts-expect-error Value is actually is not read-only
  atom.value = { ...setPath(atom.value, fakedPath, newValue) }
  // @ts-expect-error There is a hidden notify method
  atom.notify(oldMap, path.join('.'))

  return newValue
}

export { mutateAtom }
