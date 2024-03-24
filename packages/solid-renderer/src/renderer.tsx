import type {
	Renderer,
	RendererInit,
	CharacterHandle,
	CustomHandlerFunctionGetFn,
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
import type { JSX } from 'solid-js';

import { render } from 'solid-js/web';
import { createRendererState, storeUpdate, createStartFunction, createAudio, createAudioMisc, Howl } from '@novely/renderer-toolkit'
import { createEmitter } from './emitter';
import { useContextState, removeContextState } from './context-state'
import { canvasDrawImages, createImage, escape, vibrate, useBackground } from '$utils';
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

	const CTX_MAP = new Map<string, Context>();

	return {
		emitter,

		renderer(options: RendererInit) {
			const { characters } = options;

			let root: HTMLDivElement;

			const renderer = {
				getContext(name) {
					const cached = CTX_MAP.get(name);

					if (cached) return cached;

					const audio = createAudio(options.storageData);
					const $contextState = useContextState(name);

					const ctx: Context = {
						id: name,
						root,

						background(background) {
							$contextState.get().background.clear?.();

							if (typeof background === 'string') {
								$contextState.setKey('background.background', background);

								return;
							}

							const { dispose } = useBackground(background, (value) => {
								$contextState.setKey('background.background', value);
							})

							$contextState.setKey('background.clear', dispose);
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

									ctx.custom(handler, () => {});
								}
							} satisfies CharacterHandle;

							useShared(name).characters[character] = characterHandle;

							return characterHandle;
						},
						dialog(content, name, character, emotion, resolve) {
							$contextState.setKey('dialog', {
								content,
								name,
								miniature: {
									character,
									emotion,
								},
								visible: true,
								resolve,
							});
						},
						choices(label, choices, resolve) {
							$contextState.setKey('choice', { choices, label, resolve, visible: true });
						},
						clear(keep, keepCharacters, keepAudio, resolve) {
							$rendererState.setKey('exitPromptShown', false);

							if (!keep.has('showBackground')) {
								$contextState.setKey('background.background', '#000');
							}

							if (!keep.has('choice')) {
								$contextState.setKey('choice', {
									choices: [],
									visible: false,
									label: '',
								});
							}

							if (!keep.has('input')) {
								$contextState.setKey('input', {
									element: null,
									label: '',
									visible: false,
									error: '',
								});
							}

							if (!keep.has('dialog')) {
								$contextState.setKey('dialog', { visible: false, content: '', name: '', miniature: {} });
							}

							if (!keep.has('text')) {
								$contextState.setKey('text', { content: '' });
							}

							const { characters, custom } = $contextState.get();

							for (const character of Object.keys(characters)) {
								if (!keepCharacters.has(character)) {
									$contextState.setKey(`characters.${character}`, {
										style: undefined,
										visible: false
									})
								}
							}

							for (const [id, layer] of Object.entries(custom)) {
								if (!layer) continue;

								/**
								 * Если происходит переход назад, и слой просит пропустить очистку при переходе назад, то не будем очищать слой
								 */
								if (!(ctx.meta.goingBack && layer.fn.skipClearOnGoingBack)) {
									layer.clear();
									$contextState.setKey(`custom.${id}`, undefined);
								}
							}

							audio.clear(keepAudio);

							resolve();
						},
						input(label, onInput, setup, resolve) {
							const error = (value: string) => {
								$contextState.setKey('input.error', value);
							};

							const onInputHandler: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
								let value: string | undefined;

								onInput({
									lang: options.storageData.get().meta[0],
									input,
									event,
									error,
									state: options.getStateFunction(name),
									get value() {
										if (value) return value;
										return (value = escape(input.value));
									},
								});
							};

							const input = <input
								type="text"
								name="novely-input"
								required
								autocomplete="off"
								onInput={onInputHandler}
							/> as HTMLInputElement;

							setup(input, (callback) => $contextState.setKey('input.cleanup', callback));

							$contextState.setKey('input', {
								element: input,
								label,
								error: '',
								visible: true,
								resolve,
							});

							/**
							 * Initially run the fake input event to handle errors & etc
							 */
							input.dispatchEvent(new InputEvent('input', { bubbles: true }));
						},
						custom(fn, resolve) {
							// @ts-expect-error I don't understand
							const get: CustomHandlerFunctionGetFn = (insert = true) => {
								const cached = $contextState.get().custom[fn.key]

								if (cached) {
									return cached.getReturn
								}

								/**
								 * `Clear` function
								 */
								let clear = () => {};
								let store = {};

								/**
								 * Function that call the `Clear` defined by the action itself, and then deletes the layer
								 */
								const clearManager = () => {
									clear();
									$contextState.setKey(`custom.${fn.key}`, undefined);
								};

								const element = insert ? ((<div data-id={fn.key} />) as HTMLDivElement) : null;

								const getReturn = {
									root: ctx.root,
									element,
									delete: clearManager,
									data(data: any) {
										return data ? (store = data) : store;
									},
									clear(cb: () => void) {
										clear = cb;
									},
								}

								$contextState.setKey(`custom.${fn.key}`, {
									dom: element,
									fn,
									getReturn,

									clear: clearManager,
								})

								return getReturn
							};

							const result = fn({
								get,

								goingBack: ctx.meta.goingBack,
								preview: ctx.meta.preview,

								lang: options.storageData.get().meta[0],

								state: options.getStateFunction(name)
							});

							result ? result.then(resolve) : resolve();

							return result;
						},
						clearCustom(fn) {
							const data = $contextState.get().custom[fn.key];

							if (data) data.clear();
						},
						vibrate(pattern) {
							vibrate(pattern);
						},
						text(content, resolve) {
							$contextState.setKey('text', { content, resolve })
						},

						audio: audio.context,

						meta: {
							get restoring() {
								return $contextState.get().meta.restoring;
							},
							set restoring(value: boolean) {
								$contextState.setKey('meta.restoring', value)
							},

							get preview() {
								return $contextState.get().meta.preview;
							},
							set preview(value: boolean) {
								$contextState.setKey('meta.preview', value)
							},

							get goingBack() {
								return $contextState.get().meta.goingBack;
							},
							set goingBack(value: boolean) {
								$contextState.setKey('meta.goingBack', value)
							}
						}
					};

					CTX_MAP.set(name, ctx);

					return ctx;
				},
				removeContext(name) {
					CTX_MAP.delete(name);
					removeContextState(name);
				},
				ui: {
					showScreen(name) {
						$rendererState.setKey('screen', name);
					},
					getScreen() {
						return $rendererState.get().screen;
					},
					showExitPrompt() {
						$rendererState.setKey('exitPromptShown', true)
					},
					start: createStartFunction(() => {
						const Root = createRootComponent({
							setRoot(_root) {
								root = _root;
							},

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
			// @ts-expect-error Deep dive
			storeUpdate($rendererState, 'mainmenu', (mainmenu) => [...mainmenu, fn])
		},
	};
};

export { createSolidRenderer, Howl };
export type { StateScreen, StateScreens, SolidRendererStore };
