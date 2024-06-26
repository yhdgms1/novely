import type {
	Renderer,
	RendererInit,
	CharacterHandle,
	Context,
	Character,
	Lang
} from '@novely/core';
import type {
  StateScreen,
  StateScreens,
  StateMainmenuItem,
  SolidRendererStore,
  CreateSolidRendererOptions,
	EmitterEventsMap,
	RendererStoreExtension
} from './types';

import { render } from 'solid-js/web';
import {
	createGetContext,
	createRendererState,
	createStartFunction,
	createAudio,
	createAudioMisc,
	createRootSetter,
	Howl,

	handleBackgroundAction,
	handleDialogAction,
	handleChoiceAction,
	handleClearAction,
	handleCustomAction,
	handleTextAction,
	handleInputAction,
	handleVibrateAction,
	handleClearBlockingActions
} from '@novely/renderer-toolkit'
import { createEmitter } from './emitter';
import { useContextState, removeContextState } from './context-state'
import { canvasDrawImages, createImage, isCSSImage } from '$utils';
import { PRELOADED_IMAGE_MAP, useShared } from './shared';
import { createRootComponent } from './components/Root';
import { createShowArbitraryCharacterAction, hideImage, showImage } from './custom-actions';
import { settingsIcons as settingsIconsDefault } from './constants'

const { preloadAudioBlocking } = createAudioMisc();

const createSolidRenderer = ({
	fullscreen = false,
	controls = 'outside',
	skipTypewriterWhenGoingBack = true,
	target = document.body,
	settingsIcons = settingsIconsDefault
}: CreateSolidRendererOptions = {}) => {
	const emitter = createEmitter<EmitterEventsMap>();

	const $rendererState = createRendererState<RendererStoreExtension>({
		screens: {},
		mainmenu: []
	});

	const { getContextCached, removeContext } = createGetContext();

	return {
		emitter,

		renderer<$Language extends Lang, $Characters extends Record<string, Character<$Language>>>(options: RendererInit<$Language, $Characters>) {
			const { characters } = options;

			const { root, setRoot } = createRootSetter(() => renderer.getContext(options.mainContextKey));

			const renderer = {
				getContext: getContextCached((name) => {
					const audio = createAudio(options.storageData);
					const $contextState = useContextState(name);

					const context: Context = {
						id: name,
						root: root(),

						background(background) {
							handleBackgroundAction($contextState, background, (bg) => {
								if (!isCSSImage(bg)) return;

								renderer.misc.preloadImage(bg);
							})
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
								ctx: canvasContext,
								emotions: {},
								emotion(emotion, shouldRender) {
									let stored = this.emotions[emotion];

									if (!stored) {
										const characterEmotion = characters[character].emotions[emotion];
										const emotionData = (unknown => Array.isArray(unknown) ? unknown : [unknown])(characterEmotion);

										stored = this.emotions[emotion] = emotionData.map(src => {
											return PRELOADED_IMAGE_MAP.get(src) || createImage(src);
										});
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

										canvasDrawImages(canvas, canvasContext, stored);
									}
								},
								append(className, style) {
									clearTimeout($contextState.get().characters[character]?.hideTimeoutId);

									$contextState.mutate((s) => s.characters[character], { style, visible: true });

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
											$contextState.mutate((s) => s.characters[character]!, (prev) => {
												return {
													...prev,
													visible: false
												}
											})
										}

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

										$contextState.mutate((s) => s.characters[character]!, (prev) => {
											return {
												...prev,
												style: style,
												hideTimeoutId: timeoutId
											}
										});
									})
								},
								animate(classes) {
									const target = this.canvas;

									/**
									 * Character is not found
									 */
									if (!target) return;

									const classNames = classes.filter((className) => !target.classList.contains(className));

									target.classList.add(...classNames);

									const onAnimationEnd = () => {
										target.classList.remove(...classNames);
									}

									target.addEventListener('animationend', onAnimationEnd, { once: true })
								}
							} satisfies CharacterHandle;

							useShared(name).characters[character] = characterHandle;

							return characterHandle;
						},
						dialog(content, name, character, emotion, resolve) {
							handleDialogAction($contextState, content, name, character, emotion, resolve)
						},
						choices(label, choices, resolve) {
							handleChoiceAction($contextState, label, choices, resolve)
						},
						clear(keep, keepCharacters, keepAudio, resolve) {
							handleClearAction($rendererState, $contextState, options, context, keep, keepCharacters)

							audio.clear(keepAudio);

							resolve();
						},
						input(label, onInput, setup, resolve) {
							handleInputAction(
								$contextState,
								options,
								context,
								label,
								onInput,
								setup,
								resolve
							);
						},
						custom(fn) {
							return handleCustomAction($contextState, fn)
						},
						clearBlockingActions(name) {
							handleClearBlockingActions($contextState, name)
						},
						vibrate(pattern) {
							handleVibrateAction(pattern)
						},
						text(content, resolve) {
							handleTextAction($contextState, content, resolve)
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
							}
						}
					};

					return context;
				}),
				removeContext(name) {
					removeContext(name);
					removeContextState(name);
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

							characters,

							fullscreen,
							emitter,

							controls,
							skipTypewriterWhenGoingBack,

							settingsIcons,

							rendererContext: renderer.getContext(options.mainContextKey),

							coreOptions: options,

							$rendererState,
							$contextState: useContextState(options.mainContextKey)
						})

						return render(() => <Root />, target);
					})
				},
				misc: {
					preloadImage: (src) => {
						/**
						 * We are not awaiting this
						 */
						renderer.misc.preloadImageBlocking(src);

						return src;
					},
					preloadImageBlocking: (src) => {
						const img = createImage(src);

						return new Promise<any>((resolve) => {
							const done = () => {
								PRELOADED_IMAGE_MAP.set(src, img);
								resolve(1);
							}

							if (img.complete && img.naturalHeight !== 0) {
								done()
							}

							img.addEventListener('load', done);
							img.addEventListener('abort', done);
							img.addEventListener('error', done);
						});
					},
					preloadAudioBlocking
				},
				actions: {
					showArbitraryCharacter: createShowArbitraryCharacterAction(options.characters),
					showImage: showImage,
					hideImage: hideImage
				}
			} satisfies Renderer;

			return renderer;
		},
		registerScreen(name: string, screen: StateScreen) {
			$rendererState.mutate((s) => s.screens[name], () => screen);
		},
		registerMainmenuItem(fn: StateMainmenuItem) {
			$rendererState.mutate((s) => s.mainmenu, (mainmenu) => [...mainmenu, fn]);
		},
	};
};

export { createSolidRenderer, Howl };
export type { StateScreen, StateScreens, SolidRendererStore };
