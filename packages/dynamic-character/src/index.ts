import type {
	EngineInstance,
	Attributes,
	ClothingData,
	DynCharacterOptions,
	DynCharacterThis,
	ShowPickerOptionsTypedAttribute,
	ShowPickerOptionsTypedBase,
} from './types';

import { showPicker } from './picker';
import { showCharacter } from './show';

const DEFAULT_SHOW_BASE_OPTIONS = {
	type: 'base',
	buy: async () => true,
	isBought: () => true,
} as const;

const DEFAULT_SHOW_ATTRIBUTE_OPTIONS = {
	type: 'attribute',
	buy: async () => true,
	isBought: () => true,
} as const;

const createDynamicCharacter = <
	Engine extends EngineInstance,
	BaseKeys extends string,
	Attribs extends Attributes<BaseKeys>,
>(
	engine: Engine,
	clothingData: ClothingData<BaseKeys, Attribs>,
	options: DynCharacterOptions<NoInfer<Engine['typeEssentials']>, NoInfer<BaseKeys>, NoInfer<Attribs>>,
) => {
	const that: DynCharacterThis = {
		clothingData,
		options,
	};

	return {
		showBasePicker: (options: ShowPickerOptionsTypedBase = {}) => {
			const handler = showPicker.call(that, {
				...DEFAULT_SHOW_BASE_OPTIONS,
				...options,
			});

			return engine.action.custom(handler);
		},
		showAttributePicker: (options: ShowPickerOptionsTypedAttribute<Attribs>) => {
			const handler = showPicker.call(that, {
				...DEFAULT_SHOW_ATTRIBUTE_OPTIONS,
				...options,
			});

			return engine.action.custom(handler);
		},
		showCharacter: () => {
			return engine.action.custom(showCharacter.call(that));
		},
	};
};

export { generateEmotions } from './emotions';
export { createDynamicCharacter };
