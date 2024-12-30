import type {
	DefaultTypeEssentials,
	Attributes,
	ClothingData,
	DynCharacterOptions,
	DynCharacterThis,
} from './types';

export { generateEmotions } from './emotions';
import { showPicker } from './picker';
import { showCharacter } from './show';

const createDynamicCharacter = <
	TE extends DefaultTypeEssentials,
	BaseKeys extends string,
	Attribs extends Attributes<BaseKeys>,
>(
	_: TE,
	clothingData: ClothingData<BaseKeys, Attribs>,
	options: DynCharacterOptions<NoInfer<TE>, NoInfer<BaseKeys>, NoInfer<Attribs>>,
) => {
	const that: DynCharacterThis = {
		clothingData,
		options,
	};

	return {
		showPicker: showPicker.bind(that),
		showCharacter: showCharacter.bind(that),
	};
};

export { createDynamicCharacter };
