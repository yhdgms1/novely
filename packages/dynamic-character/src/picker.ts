import type { CustomHandler } from '@novely/core';
import type { Setter } from 'solid-js';
import type { DynCharacterThis, EmotionObject, InternalShowPickerOptions } from './types';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { getEmotionString, getSavedEmotion, once, saveEmotion } from './utils';
import { Picker } from './components/Picker';

const CHARACTER_STYLE_PICKER = Symbol();
const PRELOADED_EMOTIONS = new Set<string>();

const showPicker = function (this: DynCharacterThis, options: InternalShowPickerOptions) {
	const {
		clothingData,
		options: { character: characterId, defaultAttributes, defaultBase, translation: translations },
	} = this;
	const { base, attributes } = clothingData;

	const handler: CustomHandler = ({ clear, flags, getDomNodes, rendererContext, lang, state }) => {
		const translation = translations[lang];

		const initialEmotion = getSavedEmotion(state, characterId, clothingData, {
			base: defaultBase,
			attributes: defaultAttributes,
		});

		const { promise, resolve } = Promise.withResolvers<void>();
		const { element } = getDomNodes(true);

		const character = rendererContext.character(characterId);

		character.emotion(getEmotionString(initialEmotion), true);
		character.append();

		const { title, slides, translationGroup, pricing, getInitialSlideIndex } = (() => {
			if (options.type === 'attribute') {
				const slides = attributes[options.name];

				return {
					title: translation.title.attributes[options.name],
					slides: attributes[options.name],
					translationGroup: translation.attributes[options.name],
					pricing: slides.map((slide) => (clothingData.pricing ? clothingData.pricing[options.name][slide] : 0)),

					getInitialSlideIndex: (appearance: EmotionObject): number => {
						return slides.indexOf(appearance.attributes[options.name]);
					},
				};
			}

			return {
				title: translation.title.base,
				slides: base,
				translationGroup: translation.base,
				pricing: [],

				getInitialSlideIndex: (appearance: EmotionObject): number => {
					return base.indexOf(appearance.base);
				},
			};
		})();

		const onIndexChange = (appearance: EmotionObject, setAppearance: Setter<EmotionObject>, slide: number) => {
			/**
			 * Update current
			 */
			const updated = slides[slide];

			let emotion = '';

			if (options.type === 'base') {
				emotion = getEmotionString(
					setAppearance({
						base: updated,
						attributes: appearance.attributes,
					}),
				);
			} else {
				emotion = getEmotionString(
					setAppearance({
						base: appearance.base,
						attributes: {
							...appearance.attributes,
							[options.name]: updated,
						},
					}),
				);
			}

			character.emotion(emotion, true);
			PRELOADED_EMOTIONS.add(emotion);

			/**
			 * Preload previous and next
			 */
			const nextIndex = slide < slides.length - 1 ? slide + 1 : 0;
			const prevIndex = slide > 0 ? slide - 1 : slides.length - 1;

			for (const index of [nextIndex, prevIndex]) {
				let emotion = '';

				if (options.type === 'base') {
					emotion = getEmotionString({ base: slides[index], attributes: appearance.attributes });
				} else {
					emotion = getEmotionString({
						base: appearance.base,
						attributes: { ...appearance.attributes, [options.name]: slides[index] },
					});
				}

				if (PRELOADED_EMOTIONS.has(emotion)) {
					continue;
				} else {
					PRELOADED_EMOTIONS.add(emotion);
				}

				character.emotion(emotion, false);
			}
		};

		const saveEmotionWrapper = (appearance: EmotionObject) => {
			saveEmotion(state, characterId, appearance);
		};

		const cleanup = render(
			() =>
				createComponent(Picker, {
					title,
					initialExpanded: !flags.preview,
					initialEmotion,
					slides,
					pricing,
					translation,
					translationGroup,
					getInitialSlideIndex,
					onIndexChange,
					saveEmotion: saveEmotionWrapper,
					sumbit: resolve,
					buy: options.buy,
					isBought: options.isBought,
				}),
			element,
		);

		const cleanupOnce = once(cleanup);

		clear(cleanupOnce);
		promise.then(cleanupOnce);

		return promise;
	};

	handler.id = CHARACTER_STYLE_PICKER;
	handler.key = `show-picker--${characterId}`;
	handler.callOnlyLatest = true;
	handler.requireUserAction = true;

	return handler;
};

export { showPicker };
