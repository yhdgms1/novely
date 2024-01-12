import type {
	Renderer,
	RendererInit,
	Character,
	CustomHandler,
	AudioHandle,
	CharacterHandle,
} from '@novely/core';
import type {
  StateScreen,
  StateScreens,
  StateMainmenuItem,
  SolidRendererStore,
  CreateSolidRendererOptions,
	EmitterEventsMap,
	SolidContext
} from './types';
import type { JSX } from 'solid-js';

import { Switch, Match, createEffect } from 'solid-js';
import { render } from 'solid-js/web';
import { Howl } from 'howler';

import { createEmitter } from './emitter';
import { canvasDrawImages, createImage, escape, toMedia, findLast, vibrate } from '$utils';
import { Provider } from '$context';
import { Game, MainMenu, Saves, Settings, Loading, CustomScreen } from '$screens';
import { createGlobalState, useContextState } from './store';
import { produce } from 'solid-js/store';

const createSolidRenderer = ({
	fullscreen = false,
	controls = 'outside',
	skipTypewriterWhenGoingBack = true,
	useNativeLanguageNames = true,
	target = document.body,
}: CreateSolidRendererOptions = {}) => {
	const emitter = createEmitter<EmitterEventsMap>();
	const [globalState, setGlobalState] = createGlobalState();

	const getVolume = (type: 'music' | 'sound' | 'voice') => {
		const TYPE_META_MAP = {
			'music': 2,
			'sound': 3,
			'voice': 4
		} as const;

		return options.$.get().meta[TYPE_META_MAP[type]];
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

	let characters!: Record<string, Character>;

	let renderer!: Omit<Renderer, 'getContext'> & {
		/**
		 * Context in which `store` is not an `unknown`
		 */
		getContext(name: string): SolidContext;
	};

	let options: RendererInit;

	let root!: HTMLElement;

	let currentBackground: string | Record<string, string>;

	let unmount: (() => void) | undefined | void;

	const Novely = () => {
		const ctx = renderer.getContext(options.mainContextKey);

		createEffect(() => {
			const screen = globalState.screen;

			if (fullscreen && document.fullscreenEnabled) {
				/**
				 * Will not work when initial screen is set to `game` because user interaction is required
				 */
				if (screen === 'game' && !document.fullscreenElement) {
					document.documentElement.requestFullscreen().catch(() => {});

					/**
					 * When mainmenu is opened, then exit fullscreen
					 */
				} else if (screen === 'mainmenu' && document.fullscreenElement && 'exitFullscreen' in document) {
					document.exitFullscreen().catch(() => {});
				}
			}

			if (screen !== 'game' && screen !== 'settings' && screen !== 'loading') {
				ctx.audio.destroy();
			}

			emitter.emit('screen:change', screen)
		});

		options.$.subscribe(() => {
			const ctx = renderer.getContext(options.mainContextKey);
			const store = ctx.store;

			for (const type of ['music', 'sound', 'voice'] as const) {
				const volume = getVolume(type);

				if (type === 'music' || type === 'sound') {
					for (const howl of Object.values(store.audio[type])) {
						if (!howl) continue;

						howl.fade(howl.volume(), volume, 150);
					}
				}

				if (type === 'voice') {
					const howl = store.audio.voice;

					if (howl) {
						howl.fade(howl.volume(), volume, 150);
					}
				}
			}
		});

		return (
			<div ref={root as HTMLDivElement}>
				<Provider
					globalState={globalState}
					setGlobalState={setGlobalState}

					storeData={options.$}
					coreData={options.$$}
					options={options}
					renderer={renderer}
					emitter={emitter}

					characters={characters}

					getContext={renderer.getContext}
				>
					<Switch>
						<Match when={globalState.screen === 'game'}>
							<Game
								state={useContextState(options.mainContextKey).state}
								setState={/* @once */ useContextState(options.mainContextKey).setState}
								store={/* @once */ renderer.getContext(options.mainContextKey).store}
								context={/* @once */ renderer.getContext(options.mainContextKey)}
								controls={/* @once */ controls}
								skipTypewriterWhenGoingBack={/* @once */ skipTypewriterWhenGoingBack}
							/>
						</Match>
						<Match when={globalState.screen === 'mainmenu'}>
							<MainMenu />
						</Match>
						<Match when={globalState.screen === 'saves'}>
							<Saves />
						</Match>
						<Match when={globalState.screen === 'settings'}>
							<Settings useNativeLanguageNames={/* @once */ useNativeLanguageNames} />
						</Match>
						<Match when={globalState.screen === 'loading'}>
							<Loading />
						</Match>
					</Switch>

					<CustomScreen name={globalState.screen} />
				</Provider>
			</div>
		);
	};

	return {
		emitter,

		renderer(init: RendererInit): Renderer {
			options = init;
			characters = init.characters;

			renderer = {
				getContext(name) {
					const { state, setState } = useContextState(name);

					const ctx: SolidContext = {
						id: name,
						background(background) {
							currentBackground = background;

							if (typeof background === 'string') {
								setState('background', background);

								return;
							}

							/**
							 * Change `portrait` to (orientation: portrait)
							 * Same for `landscape`
							 */
							for (const [key, value] of Object.entries(background)) {
								delete background[key];

								background[toMedia(key)] = value;
							}

							const mediaQueries = Object.keys(background).map((media) => matchMedia(media));

							/**
							 * @todo: We can throttle that function, but should we?
							 */
							const handle = () => {
								if (currentBackground !== background) {
									for (const mq of mediaQueries) {
										mq.onchange = null;
									}

									return;
								}

								/**
								 * Using ponyfill here because `Array.prototype.findLast` has not enough support
								 * @see https://caniuse.com/?search=findLast
								 */
								const last = findLast(mediaQueries, ({ matches }) => matches);
								const bg = last ? background[last.media] : '';

								setState('background', bg);
							};

							for (const mq of mediaQueries) {
								mq.onchange = handle;
							}

							handle();
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
									const stored = this.emotions[emotion];

									if (!stored) {
										const characterEmotion = characters[character].emotions[emotion];
										const emotionData = (unknown => Array.isArray(unknown) ? unknown : [unknown])(characterEmotion);

										this.emotions[emotion] = emotionData.map(src => createImage(src));
									}

									if (shouldRender) {
										canvasDrawImages(canvas, canvasContext, this.emotions[emotion]);
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
							} satisfies CharacterHandle;

							this.setStore((store) => store.characters[character] = characterHandle)

							return characterHandle;
						},
						dialog(content, name, character, emotion) {
							return (resolve) => {
								setState('dialog', () => ({
									content,
									name,
									character,
									emotion,
									visible: true,
									resolve,
								}));
							};
						},
						choices(question, choices) {
							return (resolve) => {
								setState('choices', { choices, question, resolve, visible: true });
							};
						},
						clear(keep, keepCharacters, keepAudio) {
							return (resolve) => {
								setGlobalState('exitPromptShown', false);

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

								const musics = Object.entries(ctx.store.audio.music).filter(([name]) => !keepAudio.music.has(name)).map(([_, h]) => h);
								const sounds = Object.entries(ctx.store.audio.sound).filter(([name]) => !keepAudio.sounds.has(name)).map(([_, h]) => h);

								for (const music of [...musics, ...sounds]) {
									if (!music) continue;

									music.stop();
								}

								resolve();
							};
						},
						input(question, onInput, setup) {
							return (resolve) => {
								const error = (value: string) => {
									setState('input', { error: value });
								};

								const onInputHandler: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
									let value: string | undefined;

									onInput({
										input,
										event,
										error,
										get value() {
											if (value) return value;
											return (value = escape(input.value));
										},
									});
								};

								const jsx = <input
									type="text"
									name="novely-input"
									required
									autocomplete="off"
									onInput={onInputHandler}
								/>;

								const input = jsx as HTMLInputElement;

								if (setup) {
									setup(input, (callback) => setState('input', { cleanup: callback }));
								}

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
							};
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
						custom(fn, resolve) {
							const get: Parameters<CustomHandler>[0] = (insert = true) => {
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

								/**
								 * When no need to insert - just do not create it.
								 */
								const element = insert ? ((<div id={fn.key} />) as HTMLDivElement) : null;

								setState('layers', fn.key, {
									fn,
									dom: element,
									clear: clearManager,
									value: {
										root,
										element,
										delete: clearManager,
										data(data) {
											return data ? (store = data) : store;
										},
										clear(cb) {
											clear = cb;
										},
									},
								});

								return state.layers[fn.key]!.value;
							};

							const result = fn(get, ctx.meta.goingBack);

							result ? result.then(resolve) : resolve();

							return result;
						},
						vibrate(pattern) {
							vibrate(pattern);
						},
						text(content, resolve) {
							setState('text', { content, resolve });
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

						getCharacter(character) {
							return state.store.characters[character]
						}
					};

					return ctx;
				},
				ui: {
					showScreen(name) {
						setGlobalState('screen', name);
					},
					getScreen() {
						return globalState.screen;
					},
					showExitPrompt() {
						setGlobalState('exitPromptShown', true);
					},
					start() {
						unmount?.();

						unmount = render(() => <Novely />, target);

						return {
							unmount() {
								unmount?.();
								unmount = void 0;
							},
						};
					},
				},
				misc: {
					preloadImagesBlocking: (images) => {
						return Promise.allSettled(
							[...images].map((src) => {
								const img = document.createElement('img');

								img.src = src;

								return new Promise<unknown>((resolve, reject) => {
									/**
									 * Image is already loaded
									 */
									if (img.complete && img.naturalHeight !== 0) {
										resolve(void 0);
									}

									img.addEventListener('load', resolve);
									img.addEventListener('abort', reject);
									img.addEventListener('error', reject);
								});
							}),
						);
					},
					preloadImage: (image) => {
						return (document.createElement('img').src = image);
					},
					preloadAudioBlocking: (type, source) => {
						/**
						 * It's unlikely that we really need to pre-load this audio.
						 */
						if (getVolume(type) === 0) return Promise.resolve()

						return new Promise((resolve) => {
							// todo: there should be another way
							const howl = getHowl(renderer.getContext(options.mainContextKey), type, source, false)

							if (howl.state() === 'loaded') {
								resolve();
								return;
							}

							howl.once('load', resolve);
							howl.once('loaderror', () => resolve());
						})
					}
				},
			};

			return renderer;
		},
		registerScreen(name: string, screen: StateScreen) {
			setGlobalState('screens', name, () => screen);
		},
		registerMainmenuItem(fn: StateMainmenuItem) {
			setGlobalState('mainmenu', 'items', (prev) => [...prev, fn]);
		},
	};
};

export { createSolidRenderer, Howl };
export type { StateScreen, StateScreens, SolidRendererStore };
