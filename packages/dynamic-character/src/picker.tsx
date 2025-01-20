import type { CustomHandler } from '@novely/core';
import type { Setter } from 'solid-js';
import type { DynCharacterThis, EmotionObject } from './types';
import { render } from 'solid-js/web';
import { getEmotionString, getSavedEmotion, once, saveEmotion } from './utils';
import { Picker } from './components/Picker';

const CHARACTER_STYLE_PICKER = Symbol();
const PRELOADED_EMOTIONS = new Set<string>();

// todo: generic type in index.ts
type ShowPickerOptions =
	| {
			type: 'base';
	  }
	| {
			type: 'attribute';
			name: string;
	  };

const showPicker = function (this: DynCharacterThis, options: ShowPickerOptions) {
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

		const { title, slides, translationGroup, getInitialSlideIndex } = (() => {
			if (options.type === 'attribute') {
				return {
					title: translation.title.attributes[options.name],
					slides: attributes[options.name],
					translationGroup: translation.attributes[options.name],

					getInitialSlideIndex(appearance: EmotionObject): number {
						return this.slides.indexOf(appearance.attributes[options.name]);
					},
				};
			}

			return {
				title: translation.title.base,
				slides: base,
				translationGroup: translation.base,

				getInitialSlideIndex(appearance: EmotionObject): number {
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
			() => (
				<Picker
					title={/* @once */ title}
					initialExpanded={/* @once */ !flags.preview}
					initialEmotion={/* @once */ initialEmotion}
					slides={/* @once */ slides}
					translation={/* @once */ translation}
					translationGroup={/* @once */ translationGroup}
					getInitialSlideIndex={/* @once */ getInitialSlideIndex}
					onIndexChange={/* @once */ onIndexChange}
					saveEmotion={/* @once */ saveEmotionWrapper}
					sumbit={/* @once */ resolve}
				/>
			),
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
