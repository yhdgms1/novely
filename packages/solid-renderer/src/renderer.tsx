import type { Character, Context, Lang, Renderer, RendererInit } from '@novely/core';
import type {
	CreateSolidRendererOptions,
	CustomCharacterHandle,
	EmitterEventsMap,
	RendererStoreExtension,
	SolidRendererStore,
	StateMainmenuItem,
	StateScreen,
	StateScreens,
} from './types';

import { canvasDrawImages, imagePreloadWithCaching, imagePreloadWithCachingNotComplete } from '$utils';
import {
	createAudio,
	createAudioMisc,
	createGetContext,
	createRendererState,
	createRootSetter,
	createStartFunction,
	handleBackgroundAction,
	handleChoiceAction,
	handleClearAction,
	handleClearBlockingActions,
	handleCustomAction,
	handleDialogAction,
	handleInputAction,
	handleTextAction,
	handleVibrateAction,
	noop,
} from '@novely/renderer-toolkit';
import { render } from 'solid-js/web';
import { createRootComponent } from './components/Root';
import { removeContextState, useContextState } from './context-state';
import { hideImage, setMood, showImage } from './custom-actions';
import { createEmitter } from './emitter';
import { useShared } from './shared';

const { preloadAudioBlocking } = createAudioMisc();

const createSolidRenderer = ({
	fullscreen = false,
	controls = 'outside',
	skipTypewriterWhenGoingBack = true,
	target = document.body,
	showAudioSettings = true,
}: CreateSolidRendererOptions = {}) => {
	const emitter = createEmitter<EmitterEventsMap>();

	const $rendererState = createRendererState<RendererStoreExtension>({
		screens: {},
		mainmenu: [],
	});

	const { getContextCached, removeContext } = createGetContext();

	return {
		emitter,

		renderer<$Language extends Lang, $Characters extends Record<string, Character<$Language>>>(
			options: RendererInit<$Language, $Characters>,
		) {
			const { characterAssetSizes } = options;
			const { root, setRoot } = createRootSetter(() => renderer.getContext(options.mainContextKey));

			const audio = createAudio(options.storageData);

			const cleanup: Record<string, (() => void) | undefined> = {};

			const renderer = {
				getContext: getContextCached((name) => {
					const $contextState = useContextState(name);

					{
						/**
						 * Makes saves loading better by preloading images
						 */
						const unsub = $contextState.listen((state, prev) => {
							if (state.background.background !== prev.background.background) {
								renderer.misc.preloadImage(state.background.background);
							}
						});

						const handler = cleanup[name];

						cleanup[name] = () => {
							handler?.();
							unsub();
						};
					}

					const context: Context = {
						id: name,
						root: root(),

						background(background) {
							handleBackgroundAction($contextState, background);
						},
						character(character) {
							const chars = useShared(name).characters;

							if (chars[character]) {
								return chars[character];
							}

							const canvas = (<canvas data-character={character} />) as HTMLCanvasElement;
							const canvasContext = canvas.getContext('2d')!;

							const characterHandle = {
								canvas,
								emotions: {},
								emotion(emotion, shouldRender) {
									let stored = this.emotions[emotion];

									if (!stored) {
										stored = this.emotions[emotion] = options
											.getCharacterAssets(character, emotion)
											.map((src) => imagePreloadWithCachingNotComplete(src));
									}

									if (shouldRender && stored) {
										/**
										 * Clear previous emotion
										 */
										canvasContext.clearRect(0, 0, canvas.width, canvas.height);

										/**
										 * Will resize canvas to image size
										 */
										canvas.dataset.resized = 'false';

										if (root() !== context.root) {
											const { clientWidth: mainClientWidth, clientHeight: mainClientHeight } = root();
											const { clientWidth: contextClientWidth, clientHeight: contextClientHeight } = context.root;

											const widthFactor = mainClientWidth / contextClientWidth;
											const heightFactor = mainClientHeight / contextClientHeight;

											const maxFactor = Math.ceil(Math.max(widthFactor, heightFactor));

											canvas.dataset.scaleBy = (1 / maxFactor).toFixed(3);
										} else {
											canvas.dataset.scalyBy = '1';
										}

										const sizes = characterAssetSizes[character];

										if (sizes) {
											const scaleBy = canvas.dataset.scaleBy ? Number(canvas.dataset.scaleBy) : 1;

											canvas.width = Math.min(sizes.width * scaleBy * 2, sizes.width) * devicePixelRatio;
											canvas.height = Math.min(sizes.height * scaleBy * 2, sizes.height) * devicePixelRatio;

											canvas.dataset.resized = 'true';
										}

										canvasDrawImages(canvas, canvasContext, stored);
									}
								},
								append(className, style) {
									clearTimeout($contextState.get().characters[character]?.hideTimeoutId);

									$contextState.mutate((s) => s.characters[character]!, { style, visible: true });

									const { canvas: element } = chars[character];

									/**
									 * Remove className directly
									 */
									element.className = '';

									if (className) {
										/**
										 * Trigger reflow
										 */
										void element.offsetHeight;
										/**
										 * Set className directly
										 */
										element.className = className;
									}
								},
								remove(className, style, duration, restoring) {
									return new Promise((resolve) => {
										const hide = () => {
											$contextState.mutate(
												(s) => s.characters[character]!,
												(prev) => {
													return {
														...prev,
														visible: false,
													};
												},
											);
										};

										if (restoring) {
											/**
											 * Ignore remove animations, because it is not shown anyway
											 */
											hide();
											resolve();

											return;
										}

										const timeoutId = setTimeout(() => {
											hide();
											resolve();
										}, duration);

										/**
										 * Set className directly
										 */
										if (className) {
											chars[character].canvas.className = className as string;
										}

										$contextState.mutate(
											(s) => s.characters[character]!,
											(prev) => {
												return {
													...prev,
													style: style,
													hideTimeoutId: timeoutId,
												};
											},
										);
									});
								},
								animate(classes) {
									const classNames = classes.filter((className) => !canvas.classList.contains(className));

									canvas.classList.add(...classNames);

									const onAnimationEnd = () => {
										canvas.classList.remove(...classNames);
									};

									canvas.addEventListener('animationend', onAnimationEnd, { once: true });
								},
							} satisfies CustomCharacterHandle;

							useShared(name).characters[character] = characterHandle;

							return characterHandle;
						},
						dialog(content, name, character, emotion, resolve) {
							handleDialogAction($contextState, content, name, character, emotion, resolve);
						},
						choices(label, choices, resolve) {
							handleChoiceAction($contextState, label, choices, resolve);
						},
						clear(keep, keepCharacters, keepAudio, resolve) {
							handleClearAction($rendererState, $contextState, options, context, keep, keepCharacters);

							audio.clear(keepAudio);

							resolve();
						},
						input(label, onInput, setup, resolve) {
							handleInputAction($contextState, options, context, label, onInput, setup, resolve);
						},
						custom(fn) {
							return handleCustomAction($contextState, fn);
						},
						clearBlockingActions(name) {
							handleClearBlockingActions($contextState, name);
						},
						vibrate(pattern) {
							handleVibrateAction(pattern);
						},
						text(content, resolve) {
							handleTextAction($contextState, content, resolve);
						},

						audio: audio.context,

						meta: {
							get restoring() {
								return $contextState.get().meta.restoring;
							},
							set restoring(value) {
								$contextState.mutate((s) => s.meta.restoring, value);
							},

							get preview() {
								return $contextState.get().meta.preview;
							},
							set preview(value) {
								$contextState.mutate((s) => s.meta.preview, value);
							},

							get goingBack() {
								return $contextState.get().meta.goingBack;
							},
							set goingBack(value) {
								$contextState.mutate((s) => s.meta.goingBack, value);
							},
						},
					};

					return context;
				}),
				removeContext(name) {
					removeContext(name);
					removeContextState(name);

					cleanup[name]?.();
					cleanup[name] = noop;
				},
				ui: {
					showScreen(name) {
						$rendererState.mutate((s) => s.screen, name);
					},
					getScreen() {
						return $rendererState.get().screen;
					},
					showLoading() {
						$rendererState.mutate((s) => s.loadingShown, true);
					},
					hideLoading() {
						$rendererState.mutate((s) => s.loadingShown, false);
					},
					showExitPrompt() {
						$rendererState.mutate((s) => s.exitPromptShown, true);
					},
					start: createStartFunction(() => {
						const Root = createRootComponent({
							setRoot,

							renderer,

							fullscreen,
							emitter,

							controls,
							skipTypewriterWhenGoingBack,

							showAudioSettings,

							rendererContext: renderer.getContext(options.mainContextKey),

							coreOptions: options,

							$rendererState,
							$contextState: useContextState(options.mainContextKey),

							audio,
						});

						return render(() => <Root />, target);
					}),
				},
				misc: {
					preloadImage: (src) => {
						/**
						 * We are not awaiting this
						 */
						renderer.misc.preloadImageBlocking(src);

						return src;
					},
					preloadImageBlocking: async (src) => {
						await imagePreloadWithCaching(src);
					},
					preloadAudioBlocking,
				},
				actions: {
					showImage,
					hideImage,
					setMood,
				},
			} satisfies Renderer;

			return renderer;
		},
		registerScreen(name: string, screen: StateScreen) {
			$rendererState.mutate(
				(s) => s.screens[name],
				() => screen,
			);
		},
		registerMainmenuItem(fn: StateMainmenuItem) {
			$rendererState.mutate(
				(s) => s.mainmenu,
				(mainmenu) => [...mainmenu, fn],
			);
		},
	};
};

export { createSolidRenderer };
export type { StateScreen, StateScreens, SolidRendererStore };
