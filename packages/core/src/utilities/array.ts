const mapSet = <T, K>(set: Set<T>, fn: (value: T, index: number, array: T[]) => K): K[] => {
	return [...set].map(fn);
};

const toArray = <T>(target: T | T[]) => {
	return Array.isArray(target) ? target : [target];
};

export { mapSet, toArray };
