import type { CustomHandler } from '@novely/core';
import type { Attributes, ClothingData, DynCharacterThis, EmotionObject } from './types';
import { render } from 'solid-js/web';
import { getKeys, getEmotionString, getSavedEmotion, saveEmotion } from './utils';
import { createEffect, createSignal, createUniqueId, For, onCleanup, untrack } from 'solid-js';
import { slidy } from '@slidy/core';

const CHARACTER_STYLE_PICKER = Symbol();
const PRELOADED_EMOTIONS = new Set<string>();

type GetTabsOptions = ClothingData<string, Attributes> & {
	excludeAttributes: string[] | undefined;
};

type Tab = {
	type: 'base' | 'attribute';
	value: string;
	tab: string;
	panel: string;
};

const getTabs = ({ base, attributes, excludeAttributes }: GetTabsOptions) => {
	const tabs: Tab[] = [];

	if (base.length >= 2) {
		tabs.push({
			type: 'base',
			value: '',
			tab: createUniqueId(),
			panel: createUniqueId(),
		});
	}

	const attributesKeys = excludeAttributes
		? getKeys(attributes).filter((name) => excludeAttributes.includes(name))
		: getKeys(attributes);
	const attributesTabs: Tab[] = attributesKeys.map((name) => {
		return {
			type: 'attribute',
			value: name,
			tab: createUniqueId(),
			panel: createUniqueId(),
		};
	});

	tabs.push(...attributesTabs);

	return tabs;
};

const showPicker = function (this: DynCharacterThis) {
	const {
		clothingData,
		options: {
			character: characterId,
			defaultAttributes,
			defaultBase,
			excludeAttributes,
			translation: translations,
		},
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
			const tabs = getTabs({
				attributes,
				base,
				excludeAttributes,
			});

			const [activeTab, setActiveTab] = createSignal(0);
			const [tabElements, setTabElements] = createSignal<HTMLButtonElement[]>([]);
			const [expanded, setExpanded] = createSignal(!flags.preview);
			const [appearance, setAppearance] = createSignal<EmotionObject>(initialEmotion);

			createEffect(() => {
				character.emotion(getEmotionString(appearance()), true);
				saveEmotion(state, characterId, appearance());
			});

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
						role="tablist"
						aria-label={translation.ui.tablist}
						ref={(element) => onCleanup(slidy(element, { axis: 'x' }).destroy)}
						classList={{
							'ndc-tablist': true,
							'ndc-tablist-picker-collapsed': !expanded(),
						}}
					>
						<For each={tabs}>
							{(tab, i) => (
								<button
									role="tab"
									class="ndc-tab-button"
									id={tab.tab}
									aria-controls={tab.panel}
									aria-selected={i() === activeTab()}
									tabIndex={i() === activeTab() ? undefined : -1}
									onClick={() => {
										setActiveTab(i());
									}}
									onKeyDown={(event) => {
										const change = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;

										if (change === 0) {
											return;
										}

										event.stopPropagation();
										event.preventDefault();

										const nextTab = activeTab() + change;

										if (nextTab < 0) {
											setActiveTab(tabs.length - 1);
										} else if (nextTab > tabs.length - 1) {
											setActiveTab(0);
										} else {
											setActiveTab(nextTab);
										}

										const activeTabElement = tabElements()[activeTab()];

										if (activeTabElement) {
											activeTabElement.focus();
										}
									}}
									ref={(element) => {
										setTabElements((elements) => {
											elements[i()] = element;

											return elements;
										});
									}}
								>
									{tab.type === 'attribute' ? translation.tabs.attributes[tab.value] : translation.tabs.base}
								</button>
							)}
						</For>
					</div>

					<For each={tabs}>
						{(tab, i) => {
							const variants = tab.type === 'attribute' ? attributes[tab.value] : base;
							const translationGroup =
								tab.type === 'attribute' ? translation.attributes[tab.value] : translation.base;

							const initialSlideIndex = (() => {
								const currentAppearance = untrack(appearance);

								if (tab.type === 'base') {
									return base.indexOf(currentAppearance.base);
								}

								return variants.indexOf(currentAppearance.attributes[tab.value]);
							})();

							const [currentSlide, setCurrentSlide] = createSignal(initialSlideIndex);

							createEffect(() => {
								if (activeTab() !== i()) {
									return;
								}

								const currentAppearance = untrack(appearance);
								const slide = currentSlide();
								const currentVariant = variants[slide];

								if (tab.type === 'base') {
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
												[tab.value]: currentVariant,
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
										tab.type === 'base'
											? getEmotionString({ base: variants[index], attributes: currentAppearance.attributes })
											: getEmotionString({
													base: currentAppearance.base,
													attributes: { ...currentAppearance.attributes, [tab.value]: variants[index] },
												});

									if (PRELOADED_EMOTIONS.has(emotion)) {
										continue;
									} else {
										PRELOADED_EMOTIONS.add(emotion);
									}

									character.emotion(emotion, false);
								}
							});

							return (
								<div
									role="tabpanel"
									aria-labelledby={tab.tab}
									tabIndex={0}
									id={tab.panel}
									classList={{
										'ndc-tabpanel-hidden': activeTab() !== i(),
									}}
								>
									<div
										role="region"
										aria-label={translation.ui.variants}
										classList={{
											'ndc-slider': true,
											'ndc-slider-picker-collapsed': !expanded(),
										}}
										onKeyDown={(event) => {
											if (event.key === 'ArrowLeft') {
												setCurrentSlide((value) => (value > 0 ? value - 1 : variants.length - 1));
											} else if (event.key === 'ArrowRight') {
												setCurrentSlide((value) => (value < variants.length - 1 ? value + 1 : 0));
											}
										}}
									>
										<div role="group" class="ndc-controls" aria-label={translation.ui.slidesControl}>
											<button
												type="button"
												class="ndc-button-nav ndc-button-nav-prev"
												aria-label={translation.ui.prevSlide}
												onClick={() => {
													setCurrentSlide((slide) => {
														if (slide > 0) {
															return slide - 1;
														}

														return variants.length - 1;
													});
												}}
											>
												<svg data-icon fill="currentColor" viewBox="0 0 256 256">
													<path d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z" />
												</svg>
											</button>

											<button
												type="button"
												class="ndc-button-nav ndc-button-nav-next"
												aria-label={translation.ui.nextSlide}
												onClick={() => {
													setCurrentSlide((slide) => {
														if (slide < variants.length - 1) {
															return slide + 1;
														}

														return 0;
													});
												}}
											>
												<svg data-icon fill="currentColor" viewBox="0 0 256 256">
													<path d="m181.66 133.66-80 80a8 8 0 0 1-11.32-11.32L164.69 128 90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32Z" />
												</svg>
											</button>
										</div>

										<div class="ndc-slides" aria-live="polite">
											<For each={variants}>
												{(variant, i) => {
													const titleId = createUniqueId();

													return (
														<div
															role="group"
															aria-labelledby={titleId}
															classList={{
																'ndc-slide': true,
																'ndc-slide-active': i() == currentSlide(),
															}}
														>
															<p class="ndc-variant-name" id={titleId}>
																{translationGroup[variant]}
															</p>

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
														</div>
													);
												}}
											</For>
										</div>
									</div>
								</div>
							);
						}}
					</For>
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
