import type { BaseDeepMap, DeepMapStore } from 'nanostores'
import { deepMap, setPath } from 'nanostores'

type AnyFunction = (...args: any[]) => any;

/**
 * @deprecated
 * @todo remove it
 */
type NoInfer<T> = [T][T extends any ? 0 : never];

type GetPath<$AtomValue extends object, $MutateValue> = (object: $AtomValue) => $MutateValue;
type Setter<T> = T extends AnyFunction ? () => T : (T | ((prev: T) => T))

type DeepAtom<T extends BaseDeepMap> = DeepMapStore<T> & {
  mutate: <$MutateValue>(getPath: ((object: T) => $MutateValue), setter: Setter<NoInfer<$MutateValue>>) => NoInfer<$MutateValue>;
}

const usePath = <$AtomValue extends BaseDeepMap, $MutateValue>(atomValue: $AtomValue, getPath: GetPath<$AtomValue, $MutateValue>) => {
  const targets = new Set();
  const path: PropertyKey[] = [];

  let current;

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

      if (value === undefined) {
        return new Proxy({}, proxyHandler);
      }

      if (value && typeof value === 'object') {
        return new Proxy(value, proxyHandler);
      }

      return value;
    },
  }

  getPath(new Proxy(atomValue, proxyHandler));

  if (path.length === 0) {
    throw new Error('No valid path extracted from the provided getPath function.')
  }

  return {
    path,
    value: current as $MutateValue
  }
}

/**
 * Creates a `deepMap` extended with `mutate` method
 *
 * @example
 * ```ts
 * const $user = deepAtom({ age: 16 });
 *
 * $user.mutate((s) => s.age, (age) => age + 1);
 * ```
 */
const deepAtom = <$AtomValue extends BaseDeepMap>(init: $AtomValue): DeepAtom<$AtomValue> => {
  const $atom = deepMap(init) as unknown as DeepAtom<$AtomValue>;

  $atom.mutate = (getPath, setter) => {
    const { path, value } = usePath($atom.get(), getPath);

    const newValue = typeof setter === 'function' ? setter(value) : setter;

    if (newValue === value) {
      return newValue;
    }

    const oldValue = $atom.value;

    /**
     * They split string and then call flatMap, but we are going to pass an array directly
     * @link https://github.com/nanostores/nanostores/blob/56b0fbc7f51d94073191309376b9cf63948b2c91/deep-map/path.js#L41
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
    $atom.value = setPath($atom.value, fakedPath, newValue)
    // @ts-expect-error There is a hidden notify method
    $atom.notify(oldValue, path.join('.'))

    return newValue;
  }

  return $atom;
}

export { deepAtom }
export type { DeepAtom }
