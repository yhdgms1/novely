import type { Atom, ReadableAtom } from 'nanostores';
import { onMount, atom } from 'nanostores';

const memo = <T, K>(input: Atom<T>, cb: (value: T) => K) => {
  const $memoized = atom<K>(cb(input.get()));

  const unsubscribe = input.subscribe((value) => {
    const comparable = cb(value);

    if (!Object.is($memoized.get(), comparable)) {
      $memoized.set(comparable)
    }
  })

  onMount($memoized, () => {
    return () => {
      unsubscribe()
    }
  })

  return $memoized as ReadableAtom<K>;
}

export { memo }
