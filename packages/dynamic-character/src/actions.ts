import type {
	EngineInstance,
	Attributes,
	ClothingData,
	AllOptions,
	AllThis,
	ShowPickerOptionsAttribute,
	ShowPickerOptionsBase,
	DefaultTypeEssentials,
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

const createActions = function (
	this: ClothingData<string, Attributes>,
	engine: EngineInstance,
	options: AllOptions<DefaultTypeEssentials, string, Attributes>,
) {
	const that: AllThis = {
		clothingData: this,
		options,
	};

	return {
		showBasePicker: (options: ShowPickerOptionsBase = {}) => {
			const handler = showPicker.call(that, {
				...DEFAULT_SHOW_BASE_OPTIONS,
				...options,
			});

			return engine.action.custom(handler);
		},
		showAttributePicker: (options: ShowPickerOptionsAttribute<Attributes>) => {
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

export { createActions };
