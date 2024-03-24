import type {
	Renderer,
	RendererInit,
	AudioHandle,
	CharacterHandle,
	CustomHandlerFunctionGetFn,
	CustomHandler,
} from '@novely/core';
import { createRendererState, storeUpdate, createStartFunction } from '@novely/renderer-toolkit'
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
import { Howl } from 'howler';

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

			const getVolume = (type: 'music' | 'sound' | 'voice') => {
				const TYPE_META_MAP = {
					'music': 2,
					'sound': 3,
					'voice': 4
				} as const;

				return options.storageData.get().meta[TYPE_META_MAP[type]];
			}

			const getHowl = (ctx: SolidContext, type: 'music' | 'sound' | 'voice', src: string, loop: boolean) => {
				const kind = type === 'voice' ? 'voices' : type;
				const cached = ctx.store.audio[kind][src];

				if (cached) return cached;

				const howl = new Howl({
					src,
					volume: getVolume(type),
					loop
				});

				ctx.setStore((store) => store.audio[kind][src] = howl);

				return howl;
			}

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

							ctx.audio.voiceStop();

							const musics = Object.entries(ctx.store.audio.music).filter(([name]) => keepAudio.music && !keepAudio.music.has(name)).map(([_, h]) => h);
							const sounds = Object.entries(ctx.store.audio.sound).filter(([name]) => keepAudio.sounds && !keepAudio.sounds.has(name)).map(([_, h]) => h);

							for (const music of [...musics, ...sounds]) {
								if (!music) continue;

								music.stop();
							}

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

						audio: {
							music(src, method, loop = method === 'music') {
								const resource = getHowl(ctx, method, src, loop);

								/**
								 * Update
								 */
								resource.loop(loop);

								this.start();

								return {
									pause() {
										resource.fade(getVolume(method), 0, 300);
										resource.once('fade', resource.pause);
									},
									play() {
										if (resource.playing()) return;

										resource.play();
										resource.fade(0, getVolume(method), 300);
									},
									stop() {
										resource.fade(getVolume(method), 0, 300);
										resource.once('fade', resource.stop);
									},
								} satisfies AudioHandle;
							},
							voice(source) {
								this.start();
								this.voiceStop();

								const resource = ctx.store.audio.voice = getHowl(ctx, 'voice', source, false);

								resource.once('end', () => {
									ctx.setStore(store => store.audio.voice = undefined)
								});

								resource.play();
							},
							voiceStop() {
								ctx.store.audio.voice?.stop();
							},
							start() {
								if (!ctx.store.audio.onDocumentVisibilityChangeListener) {
									const onDocumentVisibilityChange = () => {
										if (document.visibilityState === 'hidden') {
											for (const howl of Object.values(ctx.store.audio.music)) {
												if (howl && howl.playing()) {
													ctx.setStore(store => store.audio.resumeList.push(howl))
													howl.pause();
												}
											}

											const currentVoice = ctx.store.audio.voice;

											if (currentVoice && currentVoice.playing()) {
												ctx.setStore(store => store.audio.resumeList.push(currentVoice))
												currentVoice.pause();
											}

										} else {
											for (const howl of ctx.store.audio.resumeList) {
												howl.play();
											}

											ctx.setStore(store => store.audio.resumeList = []);
										}
									}

									ctx.setStore(store => store.audio.onDocumentVisibilityChangeListener = onDocumentVisibilityChange)
									document.addEventListener('visibilitychange', onDocumentVisibilityChange)
								}
							},
							clear() {
								const musics = Object.values(ctx.store.audio.music);
								const sounds = Object.values(ctx.store.audio.sound);

								for (const music of [...musics, ...sounds]) {
									if (!music) continue;

									music.stop();
								}

								this.voiceStop();
							},
							destroy() {
								this.clear();

								if (ctx.store.audio.onDocumentVisibilityChangeListener) {
									document.removeEventListener('visibilitychange', ctx.store.audio.onDocumentVisibilityChangeListener);
								}
							}
						},

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

							getVolume,

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
					preloadAudioBlocking: (src) => {
						return new Promise((resolve) => {
							/**
							 * Howler automatically caches loaded sounds so this is enough
							 */
							const howl = new Howl({
								src,
							});

							/**
							 * @todo: can this happen?
							 */
							if (howl.state() === 'loaded') {
								resolve();
								return;
							}

							howl.once('load', resolve);
							howl.once('loaderror', () => resolve());
						})
					}
				},
			} satisfies Renderer;

			return renderer;
		},
		registerScreen(name: string, screen: StateScreen) {
			$rendererState.setKey(`screens.${name}`, screen);
		},
		registerMainmenuItem(fn: StateMainmenuItem) {
			// todo: fix maybe
			// @ts-ignore
			storeUpdate($rendererState, 'mainmenu', (mainmenu) => [...mainmenu, fn])
		},
	};
};

export { createSolidRenderer, Howl };
export type { StateScreen, StateScreens, SolidRendererStore };
