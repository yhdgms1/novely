import type { CustomHandler } from '@novely/core';
import type { DynCharacterThis } from './types';
import { getEmotionString, getSavedEmotion } from './utils';

const SHOW_CHARACTER = Symbol();

const showCharacter = function (this: DynCharacterThis) {
	const handler: CustomHandler = ({ rendererContext, state }) => {
		const emotion = getSavedEmotion(state, this.options.character, this.clothingData, {
			base: this.options.defaultBase,
			attributes: this.options.defaultAttributes,
		});

		const emotionString = getEmotionString(emotion);

		const character = rendererContext.character(this.options.character);

		character.emotion(emotionString, true);
		character.append();
	};

	handler.id = SHOW_CHARACTER;
	handler.key = `dynamic-show-character--${this.options.character}`;
	handler.callOnlyLatest = true;

	return handler;
};

export { showCharacter };
