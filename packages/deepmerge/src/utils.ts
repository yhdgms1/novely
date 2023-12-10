const { isArray } = Array;
const { hasOwnProperty, propertyIsEnumerable, getOwnPropertySymbols } = Object;

const propertyIsOnObject = <T extends Record<PropertyKey, unknown>, K extends PropertyKey>(
	object: T,
	property: K,
): object is T & { [Key in K]: unknown } => {
	try {
		return property in object;
	} catch {
		return false;
	}
};

const propertyIsUnsafe = (target: Record<PropertyKey, unknown>, key: PropertyKey) => {
	return (
		propertyIsOnObject(target, key) && // Properties are safe to merge if they don't exist in the target yet,
		!(
			hasOwnProperty.call(target, key) && // unsafe if they exist up the prototype chain,
			propertyIsEnumerable.call(target, key)
		)
	); // and also unsafe if they're nonenumerable.
};

const getEnumerableOwnPropertySymbols = (target: Record<PropertyKey, unknown>) => {
	if (!getOwnPropertySymbols) return [];

	return getOwnPropertySymbols(target).filter((symbol) => propertyIsEnumerable.call(target, symbol));
};

const keys = <T extends Record<PropertyKey, unknown>>(target: T): (keyof T)[] => {
	return [...Object.keys(target), ...getEnumerableOwnPropertySymbols(target)];
};

const isMergeableObject = (value: unknown): value is Record<PropertyKey, unknown> => {
	return (
		!!value &&
		typeof value === 'object' &&
		!['RegExp', 'Date'].includes(Object.prototype.toString.call(value).slice(8, -1))
	);
};

export { isArray, propertyIsOnObject, propertyIsUnsafe, getEnumerableOwnPropertySymbols, isMergeableObject, keys };
