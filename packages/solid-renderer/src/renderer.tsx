import type {
	Renderer,
	RendererInit,
	CharacterHandle,
	CustomHandler,
	Context
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
	storeUpdate,
	createRootSetter,
	Howl,

	handleBackgroundAction,
	handleDialogAction,
	handleChoiceAction,
	handleClearAction,
	handleCustomAction,
	handleClearCustomAction,
	handleTextAction,
	handleInputAction,
	handleVibrateAction
} from '@novely/renderer-toolkit'
import { createEmitter } from './emitter';
import { useContextState, removeContextState } from './context-state'
import { canvasDrawImages, createImage } from '$utils';
import { PRELOADED_IMAGE_MAP, useShared } from './shared';
import { createRootComponent } from './components/Root';

const { preloadAudioBlocking } = createAudioMisc();

const createSolidRenderer = ({
	fullscreen = false,
	controls = 'outside',
	skipTypewriterWhenGoingBack = true,
	target = document.body,
}: CreateSolidRendererOptions = {}) => {
	const emitter = createEmitter<EmitterEventsMap>();

	const $rendererState = createRendererState<RendererStoreExtension>({
		screens: {},
		mainmenu: []
	});

	const { getContextCached, removeContext } = createGetContext();

	return {
		emitter,

		renderer(options: RendererInit) {
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
							handleBackgroundAction($contextState, background)
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
										canvasDrawImages(canvas, canvasContext, stored);
									}
								},
								append(className, style) {
									clearTimeout($contextState.get().characters[character]?.hideTimeoutId);

									/**
									 * Set style and show
									 */
									$contextState.setKey(`characters.${character}`, { style, visible: true })

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
										if (restoring) {
											/**
											 * Ignore remove animations, because it is not shown anyway
											 */
											$contextState.setKey(`characters.${character}.visible`, false)
											resolve();

											return;
										}

										const timeoutId = setTimeout(() => {
											$contextState.setKey(`characters.${character}.visible`, false)
											resolve();
										}, duration);

										/**
										 * Set className directly
										 */
										if (className) {
											chars[character].canvas.className = className as string;
										}

										$contextState.setKey(`characters.${character}.style`, style)
										$contextState.setKey(`characters.${character}.hideTimeoutId`, timeoutId)
									})
								},
								animate(timeout, classes) {
									/**
									 * Using custom action it is easier to make this action
									 */
									const handler: CustomHandler = ({ get }) => {
										const { clear } = get(false);

										const target = this.canvas;

										/**
										 * Character is not found
										 */
										if (!target) return;

										const classNames = classes.filter((className) => !target.classList.contains(className));

										target.classList.add(...classNames);

										const removeClassNames = () => {
											target.classList.remove(...classNames);
										}

										const timeoutId = setTimeout(removeClassNames, timeout);

										clear(() => {
											removeClassNames();
											clearTimeout(timeoutId);
										});
									};

									/**
									 * `callOnlyLatest` property will not have any effect, because `custom` is called directly
									 */
									handler.key = '@@internal-animate-character';

									context.custom(handler, () => {});
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
							handleClearAction($rendererState, $contextState, context, keep, keepCharacters)

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
						custom(fn, resolve) {
							return handleCustomAction($contextState, options, context, fn, resolve)
						},
						clearCustom(fn) {
							handleClearCustomAction($contextState, fn)
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
								$contextState.setKey('meta.restoring', value)
							},

							get preview() {
								return $contextState.get().meta.preview;
							},
							set preview(value) {
								$contextState.setKey('meta.preview', value)
							},

							get goingBack() {
								return $contextState.get().meta.goingBack;
							},
							set goingBack(value) {
								$contextState.setKey('meta.goingBack', value)
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
						$rendererState.setKey('screen', name);
					},
					getScreen() {
						return $rendererState.get().screen;
					},
					showLoading() {
						$rendererState.setKey('loadingShown', true);
					},
					hideLoading() {
						$rendererState.setKey('loadingShown', false);
					},
					showExitPrompt() {
						$rendererState.setKey('exitPromptShown', true)
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

							rendererContext: renderer.getContext(options.mainContextKey),

							coreOptions: options,

							$rendererState,
							$contextState: useContextState(options.mainContextKey)
						})

						return render(() => <Root />, target);
					})
				},
				misc: {
					preloadImage: (image) => {
						return (document.createElement('img').src = image);
					},
					preloadImageBlocking: (image) => {
						const img = createImage(image);

						return new Promise<any>((resolve) => {
							const done = () => {
								PRELOADED_IMAGE_MAP.set(image, img);
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
			} satisfies Renderer;

			return renderer;
		},
		registerScreen(name: string, screen: StateScreen) {
			$rendererState.setKey(`screens.${name}`, screen);
		},
		registerMainmenuItem(fn: StateMainmenuItem) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore Deep dive
			storeUpdate($rendererState, 'mainmenu', (mainmenu) => [...mainmenu, fn])
		},
	};
};

export { createSolidRenderer, Howl };
export type { StateScreen, StateScreens, SolidRendererStore };
