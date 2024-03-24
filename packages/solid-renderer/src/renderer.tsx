import type {
	Renderer,
	RendererInit,
	AudioHandle,
	CharacterHandle,
	CustomHandlerFunctionGetFn,
	CustomHandler,
} from '@novely/core';
import { createRendererState, storeUpdate, createStartFunction, createAudio, Howl } from '@novely/renderer-toolkit'
import type {
  StateScreen,
  StateScreens,
  StateMainmenuItem,
  SolidRendererStore,
  CreateSolidRendererOptions,
	EmitterEventsMap,
	SolidContext,
	RendererStoreExtension
} from './types';
import type { JSX } from 'solid-js';

import { render } from 'solid-js/web';

import { createEmitter } from './emitter';
import { canvasDrawImages, createImage, escape, vibrate, useBackground } from '$utils';
import { useContextState } from './store';
import { produce } from 'solid-js/store';
import { PRELOADED_IMAGE_MAP } from './shared';
import { createRootComponent } from './components/Root';

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

	const CTX_MAP = new Map<string, SolidContext>();

	return {
		emitter,

		renderer(options: RendererInit) {
			const { characters } = options;

			const audio = createAudio(options.storageData);

			let root: HTMLDivElement;

			const renderer = {
				getContext(name) {
					const cached = CTX_MAP.get(name);

					if (cached) return cached;

					const { state, setState } = useContextState(name);

					const ctx: SolidContext = {
						id: name,
						root,

						background(background) {
							/**
							 * I'm not quite sure this should be inside the `state` because this is a function that does action
							 * And state is about just describing stuff
							 *
							 * Also, not really relevent, but there is two contexts at the same `useContextState` and `renderer.getContext`,
							 * Maybe even more if we cound core's stack context
							 */
							state.disposeBackground?.();

							if (typeof background === 'string') {
								setState('background', background);

								return;
							}

							const { dispose } = useBackground(background, (value) => {
								setState('background', value);
							})

							setState('disposeBackground', () => dispose);
						},
						character(character) {
							const chars = this.store.characters;

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
									clearTimeout(state.characters[character]?.timeoutId);

									/**
									 * Set style and show
									 */
									setState('characters', character, { style, visible: true });

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
											setState('characters', character, { visible: false });
											resolve();

											return;
										}

										const timeoutId = setTimeout(() => {
											setState('characters', character, { visible: false });
											resolve();
										}, duration);

										/**
										 * Set className directly
										 */
										if (className) {
											chars[character].canvas.className = className as string;
										}

										setState('characters', character, { style, timeoutId });
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

							ctx.setStore((store) => store.characters[character] = characterHandle)

							return characterHandle;
						},
						dialog(content, name, character, emotion, resolve) {
							setState('dialog', {
								content,
								name,
								character,
								emotion,
								visible: true,
								resolve,
							});
						},
						choices(question, choices, resolve) {
							setState('choices', { choices, question, resolve, visible: true });
						},
						clear(keep, keepCharacters, keepAudio, resolve) {
							$rendererState.setKey('exitPromptShown', false);

							if (!keep.has('showBackground')) setState('background', '#000');
							if (!keep.has('choice'))
								setState('choices', {
									choices: [],
									visible: false,
									resolve: undefined,
									question: '',
								});
							if (!keep.has('input'))
								setState('input', {
									element: undefined,
									question: '',
									visible: false,
									error: '',
								});
							if (!keep.has('dialog')) setState('dialog', { visible: false, content: '', name: '' });
							if (!keep.has('text')) setState('text', { content: '' });

							for (const character of Object.keys(state.characters)) {
								if (!keepCharacters.has(character)) setState('characters', character, { visible: false });
							}

							for (const [id, layer] of Object.entries(state.layers)) {
								if (!layer) continue;

								/**
								 * Если происходит переход назад, и слой просит пропустить очистку при переходе назад, то не будем очищать слой
								 */
								if (!(ctx.meta.goingBack && layer.fn.skipClearOnGoingBack)) {
									layer.clear();
									setState('layers', id, undefined);
								}
							}

							audio.clear(keepAudio);

							resolve();
						},
						input(question, onInput, setup, resolve) {
							const error = (value: string) => {
								setState('input', { error: value });
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

							setup(input, (callback) => setState('input', { cleanup: callback }));

							setState('input', {
								element: input,
								question,
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
								const cached = state.layers[fn.key];

								if (cached) {
									return cached.value;
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
									setState('layers', fn.key, undefined);
								};

								const element = insert ? ((<div data-id={fn.key} />) as HTMLDivElement) : null;

								setState('layers', fn.key, {
									fn,
									dom: element,
									clear: clearManager,
									value: {
										root: ctx.root,
										element,
										delete: clearManager,
										data(data: any) {
											return data ? (store = data) : store;
										},
										clear(cb: () => void) {
											clear = cb;
										},
									},
								});

								return state.layers[fn.key]!.value;
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
							const data = state.layers[fn.key];

							if (data) data.clear();
						},
						vibrate(pattern) {
							vibrate(pattern);
						},
						text(content, resolve) {
							setState('text', { content, resolve });
						},

						audio: audio.context,

						meta: {
							get restoring() {
								return state.meta.restoring;
							},
							set restoring(value: boolean) {
								setState('meta', { restoring: value })
							},

							get preview() {
								return state.meta.preview;
							},
							set preview(value: boolean) {
								setState('meta', { preview: value })
							},

							get goingBack() {
								return state.meta.goingBack;
							},
							set goingBack(value: boolean) {
								setState('meta', { goingBack: value })
							}
						},

						store: state.store,
						setStore: (fn) => {
							setState('store', produce(fn))
						},
					};

					CTX_MAP.set(name, ctx);

					return ctx;
				},
				removeContext(name) {
					CTX_MAP.delete(name);
					useContextState(name).remove();
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

							getVolume: audio.getVolume,

							rendererContext: renderer.getContext(options.mainContextKey),
							stateContext: useContextState(options.mainContextKey),

							coreOptions: options,

							$rendererState
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
					preloadAudioBlocking: audio.misc.preloadAudioBlocking
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
