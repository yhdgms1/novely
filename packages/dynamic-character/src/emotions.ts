import type { NovelyAsset } from '@novely/core';
import type { Attributes, EmotionsDefinition, EmotionsResult, Entries } from './types';
import { toArray, getEntries, getKeys, permutation } from './utils';

const generateEmotions = <BaseKeys extends string, Attribs extends Attributes<BaseKeys>>({
	base,
	attributes,
}: EmotionsDefinition<BaseKeys, Attribs>): EmotionsResult<BaseKeys, Attribs> => {
	const emotions: Record<string, NovelyAsset[]> = {};

	const combineBaseWithAttributes = (
		baseEmotion: BaseKeys,
		baseAssets: NovelyAsset[],
		currentAttributes: string[],
		attributesLeft: Entries<Attributes>,
	) => {
		if (attributesLeft.length === 0) {
			const key = `${baseEmotion}@${currentAttributes.join('__')}`;

			emotions[key] = baseAssets;

			return;
		}

		const [attribute, variants] = attributesLeft[0];
		const remainingAttributes = attributesLeft.slice(1);

		for (const [variant, emotions] of Object.entries(variants)) {
			const attributeAssets = emotions[baseEmotion];

			combineBaseWithAttributes(
				baseEmotion,
				[...baseAssets, ...toArray(attributeAssets)],
				[...currentAttributes, `${attribute}_${variant}`],
				remainingAttributes,
			);
		}
	};

	for (const [baseEmotion, baseAssets] of getEntries(base)) {
		for (const _permutation of permutation(getEntries(attributes))) {
			combineBaseWithAttributes(baseEmotion, toArray(baseAssets), [], _permutation);
		}
	}

	const clothingData = {
		base: getKeys(base),
		attributes: Object.fromEntries(getEntries(attributes).map(([name, value]) => [name, getKeys(value)])),
	};

	return {
		emotions,
		clothingData,
	} as any;
};

export { generateEmotions };
