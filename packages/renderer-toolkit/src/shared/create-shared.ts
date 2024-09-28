/**
 * Creates a map of mutable objects
 *
 * todo: practical usage
 *
 * @example
 * ```ts
 * const { useShared, removeShared } = createShared<{ count: number }>(() => {
 *   return {
 *     count: 0
 *   }
 * })
 *
 * useShared('HELLO').count += 1
 * console.log(useShared('HELLO').count) // prints 1
 *
 * useShared('WORLD').count += 1
 * console.log(useShared('WORLD').count) // prints 1 too
 * ```
 */
const createShared = <T extends Record<PropertyKey, unknown>>(get: () => T) => {
	const CACHE = new Map<string, T>();

	const use = (id: string) => {
		const cached = CACHE.get(id);

		if (cached) {
			return cached;
		}

		const shared = get();

		CACHE.set(id, shared);

		return shared;
	};

	const remove = (id: string) => {
		CACHE.delete(id);
	};

	return {
		useShared: use,
		removeShared: remove,
	};
};

export { createShared };
