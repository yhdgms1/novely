import type {
	Renderer,
	RendererInit,
	RendererStore,
	Character,
	ValidAction,
	CustomHandler,
	CustomHandlerGetResult,
	NovelyScreen,
} from '@novely/core';
import type { JSX } from 'solid-js';
import type { MountableElement } from 'solid-js/web';

import { Switch, Match, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { render } from 'solid-js/web';

import { canvasDrawImages, createImage, escape, toMedia, findLast, createCanVibrate } from '$utils';
import { Provider } from '$context';
import { Game, MainMenu, Saves, Settings, Loading, CustomScreen } from '$screens';

interface StateCharacter {
	/**
	 * `element.style`
	 */
	style: string;
	/**
	 * Показывать ли элемент
	 */
	visible: boolean;
	/**
	 * `id` для `setTimeout`, который отвечает за `duration` в `hideCharacter`
	 */
	timeoutId: number;
}

interface StateDialog {
	/**
	 * Контент диалога
	 */
	content: string;
	/**
	 * Мини-персонаж
	 */
	character?: string;
	/**
	 * Эмоция мини-персонажа
	 */
	emotion?: string;
	/**
	 * Должен ли диалог быть показан
	 */
	visible: boolean;
	/**
	 * Имя персонажа
	 */
	name: string;
	/**
	 * Is goingBack
	 */
	goingBack: boolean;
	/**
	 * Функция `resolve`
	 */
	resolve?: () => void;
}

interface StateChoices {
	/**
	 * Функция `resolve`
	 * @param selected `index` выбранного
	 */
	resolve?: (selected: number) => void;
	/**
	 * Вопрос (а что выбирать)
	 */
	question: string;
	/**
	 * Выборы
	 */
	choices: ([string, ValidAction[]] | [string, ValidAction[], () => boolean])[];
	/**
	 * Должен ли отображаться диалог
	 */
	visible: boolean;
}

interface StateInput {
	/**
	 * Вопрос (что делает этот input)
	 */
	question: string;
	/**
	 * Элемент `input`
	 */
	element?: HTMLInputElement;
	/**
	 * Должен ли отображаться диалог с `input`
	 */
	visible: boolean;
	/**
	 * Функция `resolve`
	 */
	resolve?: () => void;
	/**
	 * Запускается для очистки результата setup
	 */
	cleanup?: () => void;
	/**
	 * Ошибка
	 */
	error: string;
}

interface StateText {
	/**
	 * Текст
	 */
	content: string;
	/**
	 * Is goingBack
	 */
	goingBack: boolean;
	/**
	 * Функция `resolve`
	 */
	resolve?: () => void;
}

type StateLayers = Record<
	string,
	| {
			value: CustomHandlerGetResult;
			fn: CustomHandler;
			clear: () => void;
			dom: null | HTMLDivElement;
	  }
	| undefined
>;

type StateScreen = () => {
	mount(): Element | JSX.Element;
	unmount?(): void;
};

type StateScreens = Record<string, StateScreen>;

type PossibleScreen = NovelyScreen | (string & Record<never, never>);

type StateMainmenuItem = (goto: (name: PossibleScreen) => void) => JSX.ButtonHTMLAttributes<HTMLButtonElement>;
type StateMainmenuItems = StateMainmenuItem[];

interface State {
	background: string;
	characters: Record<string, StateCharacter>;
	dialog: StateDialog;
	choices: StateChoices;
	input: StateInput;
	layers: StateLayers;
	screens: StateScreens;
	mainmenu: {
		items: StateMainmenuItems;
	};
	text: StateText;
	screen: PossibleScreen;

	exitPromptShown: boolean;
}

interface SolidRendererStore extends RendererStore {
	dialogRef?: HTMLParagraphElement;
	textRef?: HTMLParagraphElement;
}

interface CreateSolidRendererOptions {
	/**
	 * Enter fullscreen mode when opening a game, exit when opening main-menu
	 * @default false
	 */
	fullscreen?: boolean;
	/**
	 * Controls position
	 * @default "outside"
	 */
	controls?: 'inside' | 'outside';
	/**
	 * When `goingBack` typewriter effect won't be applied
	 * @default true
	 */
	skipTypewriterWhenGoingBack?: boolean;
	/**
	 * Where Novely will be mounted
	 * @default document.body
	 */
	target?: MountableElement;
	/**
	 * In the settings screen languages will be shown in it's own language instead of selected language
	 * @default true
	 */
	useNativeLanguageNames?: boolean;
}

const canVibrate = createCanVibrate();

const createSolidRenderer = ({
	fullscreen = false,
	controls = 'outside',
	skipTypewriterWhenGoingBack = true,
	useNativeLanguageNames = true,
	target = document.body,
}: CreateSolidRendererOptions = {}) => {
	const [state, setState] = createStore<State>({
		background: '',
		characters: {},
		dialog: {
			content: '',
			name: '',
			visible: false,
			goingBack: false,
		},
		choices: {
			question: '',
			visible: false,
			choices: [],
		},
		input: {
			question: '',
			error: '',
			visible: false,
		},
		text: {
			content: '',
			goingBack: false,
		},
		layers: {},
		screens: {},
		mainmenu: {
			items: [],
		},
		screen: 'mainmenu',
		exitPromptShown: false,
	});

	const store: SolidRendererStore = {
		characters: {},
		audio: {
			music: undefined,
		},
	};

	let characters!: Record<string, Character>;
	let renderer!: Renderer;
	let options: RendererInit;

	let root!: HTMLElement;

	let currentBackground: string | Record<string, string>;

	let unmount: (() => void) | undefined | void;

	const Novely = () => {
		createEffect(() => {
			/**
			 * Access `screen` outside of if statement
			 */
			const screen = state.screen;

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
		});

		return (
			<div ref={root as HTMLDivElement}>
				<Provider storeData={options.$} coreData={options.$$} options={options} renderer={renderer}>
					<Switch>
						<Match when={state.screen === 'game'}>
							<Game
								state={state}
								setState={/* @once */ setState}
								store={/* @once */ store}
								characters={/* @once */ characters}
								renderer={/* @once */ renderer}
								controls={/* @once */ controls}
								skipTypewriterWhenGoingBack={/* @once */ skipTypewriterWhenGoingBack}
							/>
						</Match>
						<Match when={state.screen === 'mainmenu'}>
							<MainMenu state={state} setState={/* @once */ setState} />
						</Match>
						<Match when={state.screen === 'saves'}>
							<Saves setState={/* @once */ setState} />
						</Match>
						<Match when={state.screen === 'settings'}>
							<Settings setState={/* @once */ setState} useNativeLanguageNames={useNativeLanguageNames} />
						</Match>
						<Match when={state.screen === 'loading'}>
							<Loading />
						</Match>
					</Switch>

					<CustomScreen name={state.screen} state={state} setState={/* @once */ setState} />
				</Provider>
			</div>
		);
	};

	return {
		createRenderer(init: RendererInit): Renderer {
			(options = init), (characters = init.characters);

			renderer = {
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
					if (store.characters[character]) return store.characters[character];

					const canvas = (<canvas data-character={character} />) as HTMLCanvasElement;
					const ctx = canvas.getContext('2d')!;

					const render = (images: HTMLImageElement[]) => {
						return () => {
							canvasDrawImages(canvas, ctx, images);
						};
					};

					return (store.characters[character] = {
						canvas,
						ctx,
						emotions: {},
						withEmotion(emotion) {
							const stored = this.emotions[emotion];

							if (stored) {
								return render(Object.values(stored));
							}

							const characterEmotion = characters[character].emotions[emotion];
							const emotionData = (unknown => Array.isArray(unknown) ? unknown : [unknown])(characterEmotion);

							this.emotions[emotion] = emotionData.map(src => createImage(src));

							return render(this.emotions[emotion]);
						},
						append(className, style) {
							clearTimeout(state.characters[character]?.timeoutId);

							/**
							 * Set style and show
							 */
							setState('characters', character, { style, visible: true });

							const { canvas: element } = store.characters[character];

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
						remove(className, style, duration) {
							return (resolve, restoring) => {
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
									store.characters[character].canvas.className = className as string;
								}

								setState('characters', character, { style, timeoutId });
							};
						},
					});
				},
				dialog(content, name, character, emotion) {
					return (resolve, goingBack) => {
						setState('dialog', () => ({
							content,
							name,
							character,
							emotion,
							visible: true,
							resolve,
							goingBack,
						}));
					};
				},
				choices(question, choices) {
					return (resolve) => {
						setState('choices', { choices, question, resolve, visible: true });
					};
				},
				clear(goingBack, keep, keepCharacters) {
					return (resolve) => {
						setState('exitPromptShown', false);

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
							if (!(goingBack && layer.fn.skipClearOnGoingBack)) {
								layer.clear(), setState('layers', id, undefined);
							}
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

						const input = (
							<input type="text" name="novely-input" required autocomplete="off" onInput={onInputHandler} />
						) as HTMLInputElement;

						if (setup) {
							setup(input, (callback) => {
								setState('input', { cleanup: callback });
							});
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
				music(source, method) {
					const stored = store.audio?.[method];

					if (stored && stored.element.src.endsWith(source)) return (stored.element.currentTime = 0), stored;

					const element = new Audio(source);

					const onClick = () => {
						removeEventListener('click', onClick), element.play();
					};

					const handle = {
						element,
						pause: element.pause,
						play() {
							/**
							 * Пользователь должен сначала взаимодействовать с документом
							 */
							addEventListener('click', onClick);
						},
						stop() {
							removeEventListener('click', onClick);
							element.pause();
							element.currentTime = 0;
						},
					};

					return (store.audio[method] = handle);
				},
				custom(fn, goingBack, resolve) {
					const get: Parameters<CustomHandler>[0] = (id, insert = true) => {
						/**
						 * Get `chched` value
						 */
						const cached = state.layers[id];

						/**
						 * Return it
						 */
						if (cached) return cached.value;

						/**
						 * `Clear` function
						 */
						let clear = () => {};
						let store = {};

						/**
						 * Function that call the `Clear` defined by the action itself, and then deletes the layer
						 */
						const clearManager = () => {
							clear(), setState('layers', id, undefined);
						};

						/**
						 * When no need to insert - just do not create it.
						 */
						const element = insert ? ((<div id={id} />) as HTMLDivElement) : null;

						setState('layers', id, {
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

						return state.layers[id]!.value;
					};

					/**
					 * Wait untill it is resolved
					 */
					const result = fn(get, goingBack, fn.requireUserAction ? resolve : () => {});

					if (!fn.requireUserAction) result ? result.then(resolve) : resolve();

					return result;
				},
				vibrate(pattern) {
					try {
						if (canVibrate() && 'vibrate' in navigator) {
							navigator.vibrate(pattern);
						}
					} catch {}
				},
				text(content, resolve, goingBack) {
					setState('text', { content, resolve, goingBack });
				},
				store,
				ui: {
					showScreen(name) {
						setState('screen', name);
					},
					getScreen() {
						return state.screen;
					},
					showExitPrompt() {
						setState('exitPromptShown', true);
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
				},
			};

			return renderer;
		},
		registerScreen(name: string, screen: StateScreen) {
			setState('screens', name, () => screen);
		},
		registerMainmenuItem(fn: StateMainmenuItem) {
			setState('mainmenu', 'items', (prev) => [...prev, fn]);
		},
	};
};

export { createSolidRenderer };
export type { State, StateScreen, StateScreens, SolidRendererStore };
