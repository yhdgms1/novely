import type { CustomHandler } from '@novely/core';
import type { DynCharacterThis, EmotionObject } from './types';
import { render } from 'solid-js/web';
import { getEmotionString, getSavedEmotion, saveEmotion } from './utils';
import { Slider } from './components/Slider';
import { createEffect, createSignal, untrack } from 'solid-js';

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

		const Picker = () => {
			const [expanded, setExpanded] = createSignal(!flags.preview);
			const [appearance, setAppearance] = createSignal<EmotionObject>(initialEmotion);

			createEffect(() => {
				character.emotion(getEmotionString(appearance()), true);
				saveEmotion(state, characterId, appearance());
			});

			const variants = options.type === 'attribute' ? attributes[options.name] : base;
			const translationGroup =
				options.type === 'attribute' ? translation.attributes[options.name] : translation.base;

			const initialSlideIndex = (() => {
				const currentAppearance = untrack(appearance);

				if (options.type === 'base') {
					return base.indexOf(currentAppearance.base);
				}

				return variants.indexOf(currentAppearance.attributes[options.name]);
			})();

			const onIndexChange = (slide: number) => {
				const currentAppearance = untrack(appearance);
				const currentVariant = variants[slide];

				if (options.type === 'base') {
					const emotion = getEmotionString(
						setAppearance({
							base: currentVariant,
							attributes: currentAppearance.attributes,
						}),
					);

					character.emotion(emotion, true);
					PRELOADED_EMOTIONS.add(emotion);
				} else {
					const emotion = getEmotionString(
						setAppearance({
							base: currentAppearance.base,
							attributes: {
								...currentAppearance.attributes,
								[options.name]: currentVariant,
							},
						}),
					);

					character.emotion(emotion, true);
					PRELOADED_EMOTIONS.add(emotion);
				}

				const nextIndex = slide < variants.length ? slide : 0;
				const prevIndex = slide > 0 ? slide - 1 : variants.length - 1;

				for (const index of [nextIndex, prevIndex]) {
					const emotion =
						options.type === 'base'
							? getEmotionString({ base: variants[index], attributes: currentAppearance.attributes })
							: getEmotionString({
									base: currentAppearance.base,
									attributes: { ...currentAppearance.attributes, [options.name]: variants[index] },
								});

					if (PRELOADED_EMOTIONS.has(emotion)) {
						continue;
					} else {
						PRELOADED_EMOTIONS.add(emotion);
					}

					character.emotion(emotion, false);
				}
			};

			return (
				<div
					classList={{
						'ndc-picker-root': true,
						'ndc-picker-root-collapsed': !expanded(),
					}}
				>
					<button
						type="button"
						class="ndc-collapse-button"
						onClick={() => {
							setExpanded((value) => !value);
						}}
					>
						<svg
							data-icon
							fill="#fefefe"
							width="3rem"
							height="3rem"
							viewBox="0 0 256 256"
							classList={{
								'ndc-collapse-button-icon-collapsed': !expanded(),
							}}
						>
							<path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
						</svg>
					</button>

					<div
						classList={{
							'ndc-heading': true,
							'ndc-heading-picker-collapsed': !expanded(),
						}}
					>
						{options.type === 'base' ? translation.title.base : translation.title.attributes[options.name]}
					</div>

					<Slider
						expanded={expanded()}
						initialSlideIndex={initialSlideIndex}
						slides={variants}
						translation={translation}
						onIndexChange={onIndexChange}
					>
						{(variant) => (
							<>
								<p class="ndc-variant-name">{translationGroup[variant]}</p>

								<div class="ndc-control-buttons">
									<button
										type="button"
										class="button"
										onClick={() => {
											resolve();
										}}
									>
										{translation.ui.sumbit}
									</button>
								</div>
							</>
						)}
					</Slider>
				</div>
			);
		};

		const cleanup = render(() => <Picker />, element);

		clear(() => cleanup());
		promise.then(() => cleanup());

		return promise;
	};

	handler.id = CHARACTER_STYLE_PICKER;
	handler.key = `show-picker--${characterId}`;
	handler.callOnlyLatest = true;
	handler.requireUserAction = true;

	return handler;
};

export { showPicker };
