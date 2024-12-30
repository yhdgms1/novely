import type { StateFunction, State } from '@novely/core';
import type { EmotionObject, ClothingData, Attributes } from './types';

const getEntries = <T extends PropertyKey, K>(object: Record<T, K>): [T, K][] => {
	return Object.entries(object) as any;
};

const getKeys = <T extends PropertyKey>(object: Record<T, unknown>): T[] => {
	return Object.keys(object) as any;
};

const toArray = <T>(target: T | T[]): T[] => {
	return Array.isArray(target) ? target : [target];
};

const permutation = <T>(items: T[], size: number = items.length): T[][] => {
	if (!size) {
		return [[]];
	}

	size = Math.min(items.length, size);

	return items.flatMap((item) => {
		return permutation(
			items.filter((it) => it !== item),
			size - 1,
		).map((permutation) => [item, ...permutation]);
	});
};

const getEmotionString = ({ base, attributes }: EmotionObject) => {
	return `${base}@${getEntries(attributes)
		.map(([name, value]) => `${name}_${value}`)
		.join('__')}`;
};

/**
 * Return fallback value joined with saved emotion, when there is no saved, returns only fallback
 * @param character Character Id
 * @param fallback Default emotions
 */
const getSavedEmotion = (
	state: StateFunction<State>,
	character: string,
	clothingData: ClothingData<string, Attributes>,
	fallback: EmotionObject,
): EmotionObject => {
	const id = `$$emotion_${character}`;
	const saved: EmotionObject | undefined = state()[id];

	if (!saved) {
		return fallback;
	}

	/**
	 * The `fallback` has ALL keys. Not less.
	 * In case saved value has more keys than needed, we are going to remove them
	 */
	const filteredAttributes = Object.keys(saved.attributes)
		.filter((key) => key in fallback.attributes)
		.reduce(
			(acc, key) => {
				acc[key] = saved.attributes[key];

				return acc;
			},
			{} as typeof fallback.attributes,
		);

	/**
	 * In case saved `base` is not in clothingData, then it will error while attempting to render it
	 * So we replace with fallback value
	 */
	const base = clothingData.base.includes(saved.base) ? saved.base : fallback.base;

	return {
		base,
		attributes: {
			...fallback.attributes,
			...filteredAttributes,
		},
	};
};

const saveEmotion = (state: StateFunction<State>, character: string, emotion: EmotionObject) => {
	state({ [`$$emotion_${character}`]: emotion });
};

export { getEntries, getKeys, toArray, permutation, getEmotionString, saveEmotion, getSavedEmotion };
