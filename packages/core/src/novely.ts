import type { Character } from './character';
import type {
	ActionProxyProvider,
	GetActionParameters,
	Story,
	ValidAction,
	Unwrappable,
	CustomHandler,
} from './action';
import type { Storage } from './storage';
import type {
	Save,
	State,
	Data,
	StorageData,
	DeepPartial,
	NovelyScreen,
	Migration,
	ActionFN,
	CoreData,
} from './types';
import type { Renderer, RendererInit } from './renderer';
import type { TranslationActions, Pluralization } from './translation';
import type { BaseTranslationStrings } from './translations';
import {
	matchAction,
	isNumber,
	isNull,
	isPromise,
	isEmpty,
	isCSSImage,
	str,
	isUserRequiredAction,
	getLanguage as defaultGetLanguage,
	throttle,
	isFunction,
	findLastIndex,
	createControlledPromise,
	findLastPathItemBeforeItemOfType,
	isBlockStatement,
	isBlockExitStatement,
	isSkippedDuringRestore,
	isAction,
	noop,
	flattenStory,
	isExitImpossible
} from './utils';
import { PRELOADED_ASSETS } from './global';
import { store } from './store';
import { deepmerge } from '@novely/deepmerge';
import { klona } from 'klona/json';
import { EMPTY_SET, DEFAULT_TYPEWRITER_SPEED } from './constants';
import { replace as replaceT9N } from './translation';
import { localStorageStorage } from './storage';
import pLimit from 'p-limit';

import { DEV } from 'esm-env';

interface NovelyInit<
	Languages extends string,
	Characters extends Record<string, Character<Languages>>,
	StateScheme extends State,
	DataScheme extends Data,
> {
	/**
	 * An array of languages supported by the game.
	 */
	languages: Languages[];
	/**
	 * An object containing the characters in the game.
	 */
	characters: Characters;
	/**
	 * An object that provides access to the game's storage system.
	 * @default localStorage // at key `novely-game-storage`
	 */
	storage?: Storage;
	/**
	 * Delay loading data until Promise is resolved
	 */
	storageDelay?: Promise<void>;
	/**
	 * A function that returns a Renderer object used to display the game's content
	 */
	renderer: (characters: RendererInit) => Renderer;
	/**
	 * An optional property that specifies the initial screen to display when the game starts
	 */
	initialScreen?: NovelyScreen;
	/**
	 * An object containing the translation functions used in the game
	 */
	translation: Record<
		Languages,
		{
			internal: Record<BaseTranslationStrings, string>;
			/**
			 * IETF BCP 47 language tag
			 */
			tag?: string;
			plural?: Record<string, Pluralization>;
			actions?: TranslationActions;
		}
	>;
	/**
	 * Initial state value
	 */
	state?: StateScheme;
	/**
	 * Initial data value
	 */
	data?: DataScheme;
	/**
	 * Enable autosaves or disable
	 * @default true
	 */
	autosaves?: boolean;
	/**
	 * Migration from old saves to newer
	 */
	migrations?: Migration[];
	/**
	 * For saves Novely uses `throttle` function. This might be needed if you want to control frequency of saves to the storage
	 * @default 799
	 */
	throttleTimeout?: number;
	/**
	 * Custom language detector
	 * @param languages Supported languages aka `languages: []` in the config
	 * @example ```ts
	 * novely({
	 * 		getLanguage(languages, original) {
	 * 				if (!sdk) return original(languages);
	 * 				return sdk.environment.i18n.lang // i.e. custom language from some sdk
	 * 		}
	 * })
	 * ```
	 */
	getLanguage?: (languages: string[], original: typeof defaultGetLanguage) => string;
	/**
	 * Ignores saved language, and uses `getLanguage` to get it on every engine start
	 * @default false
	 */
	overrideLanguage?: boolean;
	/**
	 * Show a prompt before exiting a game
	 * @default true
	 */
	askBeforeExit?: boolean;
	/**
	 * @default "lazy"
	 */
	preloadAssets?: 'lazy' | 'blocking';
}

const novely = <
	Languages extends string,
	Characters extends Record<string, Character<Languages>>,
	StateScheme extends State,
	DataScheme extends Data,
>({
	characters,
	storage = localStorageStorage({ key: 'novely-game-storage' }),
	storageDelay = Promise.resolve(),
	renderer: createRenderer,
	initialScreen = 'mainmenu',
	translation,
	languages,
	state: defaultState,
	data: defaultData,
	autosaves = true,
	migrations = [],
	throttleTimeout = 799,
	getLanguage = defaultGetLanguage,
	overrideLanguage = false,
	askBeforeExit = true,
	preloadAssets = 'lazy',
}: NovelyInit<Languages, Characters, StateScheme, DataScheme>) => {
	const limitScript = pLimit(1);

	const story: Story = {};

	const times = new Set<number>();

	const ASSETS_TO_PRELOAD = new Set<string>();
	const assetsLoaded = createControlledPromise();

	const dataLoaded = createControlledPromise();

	let scriptCalled = false;

	/**
	 * Prevent `undefined`
	 */
	defaultData ||= {} as DataScheme;
	defaultState ||= {} as StateScheme;

	/**
	 * Saves timestamps created in this session
	 */
	const intime = (value: number) => {
		return times.add(value), value;
	};

	const scriptBase = async (part: Story) => {
		Object.assign(story, flattenStory(part));

		if (preloadAssets === 'blocking' && ASSETS_TO_PRELOAD.size > 0) {
			renderer.ui.showScreen('loading');

			await renderer.misc.preloadImagesBlocking(ASSETS_TO_PRELOAD);
		}

		const screen = renderer.ui.getScreen();
		const nextScreen = (scriptCalled ? screen : initialScreen) as NovelyScreen;

		ASSETS_TO_PRELOAD.clear();
		assetsLoaded.resolve();

		if (nextScreen === 'game') {
			await assetsLoaded.promise;
			await dataLoaded.promise;

			if (!scriptCalled) {
				restore();
			}
		} else {
			renderer.ui.showScreen(nextScreen);
		}

		scriptCalled = true;
	};

	/**
	 * Setup your story here
	 *
	 * Call more than once to merge different story parts
	 *
	 * @example
	 *
	 * ```js
	 * engine.script({
	 *  start: [action.jump('another-part')]
	 * })
	 *
	 * engine.script({
	 *  'another-part': []
	 * })
	 * ```
	 */
	const script = (part: Story) => {
		return limitScript(() => scriptBase(part));
	}

	const action = new Proxy({} as ActionProxyProvider<Characters, Languages>, {
		get(_, prop) {
			return (...props: Parameters<ActionFN>) => {
				if (preloadAssets === 'blocking') {
					/**
					 * Load backgrounds
					 */
					if (prop === 'showBackground' && typeof props[0] === 'string' && isCSSImage(props[0])) {
						ASSETS_TO_PRELOAD.add(props[0]);
					}

					/**
					 * Load characters
					 */
					if (prop === 'showCharacter' && typeof props[0] === 'string' && typeof props[1] === 'string') {
						const images = characters[props[0]].emotions[props[1]];

						if (Array.isArray(images)) {
							for (const asset of images) {
								ASSETS_TO_PRELOAD.add(asset);
							}
						} else {
							ASSETS_TO_PRELOAD.add(images)
						}
					}
				}

				return [prop, ...props];
			};
		},
	});

	function state(value: DeepPartial<StateScheme> | ((prev: StateScheme) => StateScheme)): void;
	function state(): StateScheme;
	function state(value?: DeepPartial<StateScheme> | ((prev: StateScheme) => StateScheme)): StateScheme | void {
		if (!value) return stack.value[1] as StateScheme | void;

		const prev = stack.value[1];
		const val = isFunction(value) ? value(prev as StateScheme) : deepmerge(prev, value);

		stack.value[1] = val as StateScheme;
	}

	const getDefaultSave = (state = {}) => {
		return [
			[
				['jump', 'start'],
				[null, 0],
			],
			state,
			[intime(Date.now()), 'auto'],
		] as Save;
	};

	const createStack = (current: Save, stack = [current]) => {
		return {
			get value() {
				return stack.at(-1)!;
			},
			set value(value: Save) {
				stack[stack.length - 1] = value;
			},
			back() {
				if (stack.length > 1) stack.pop(), (goingBack = true);
			},
			push(value: Save) {
				stack.push(value);
			},
			clear() {
				stack = [getDefaultSave(klona(defaultState))];
			},
		};
	};

	const getLanguageWithoutParameters = () => {
		return getLanguage(languages, defaultGetLanguage);
	};

	/**
	 * 1) Novely rendered using the `initialData`, but you can't start new game or `load` an empty one - this is scary, imagine losing your progress
	 * 2) Actual stored data is loaded, language and etc is changed
	 */
	const initialData: StorageData = {
		saves: [],
		data: klona(defaultData) as Data,
		meta: [getLanguageWithoutParameters(), DEFAULT_TYPEWRITER_SPEED, 1, 1, 1],
	};

	const coreData: CoreData = {
		dataLoaded: false,
	};

	const $ = store(initialData);
	const $$ = store(coreData);

	const onStorageDataChange = (value: StorageData) => {
		if ($$.get().dataLoaded) storage.set(value);
	};

	const throttledOnStorageDataChange = throttle(onStorageDataChange, throttleTimeout);
	const throttledEmergencyOnStorageDataChange = throttle(() => {
		onStorageDataChange($.get());
	}, 10);

	$.subscribe(throttledOnStorageDataChange);

	const getStoredData = async () => {
		let stored = await storage.get();

		for (const migration of migrations) {
			stored = migration(stored) as StorageData;
		}

		/**
		 * Default `localStorageStorage` returns empty array
		 */
		stored.meta[1] ||= DEFAULT_TYPEWRITER_SPEED;

		if (overrideLanguage) {
			stored.meta[0] = getLanguageWithoutParameters();
		} else {
			stored.meta[0] ||= getLanguageWithoutParameters();
		}

		/**
		 * Sound Volumes
		 */
		stored.meta[2] ??= 1;
		stored.meta[3] ??= 1;
		stored.meta[4] ??= 1;

		/**
		 * When data is empty replace it with `defaultData`
		 * It also might be empty (default to empty)
		 */
		if (isEmpty(stored.data)) {
			stored.data = defaultData as Data;
		}

		/**
		 * Now the next store updates will entail saving via storage.set
		 */
		$$.update((prev) => ((prev.dataLoaded = true), prev));
		dataLoaded.resolve();

		/**
		 * Yay
		 */
		$.update(() => stored);
	};

	/**
	 * By default this is resolved immediately, but also can be delayed.
	 * I.e. storage has not loaded yet
	 */
	storageDelay.then(getStoredData);

	const initial = getDefaultSave(klona(defaultState));
	const stack = createStack(initial);

	/**
	 * Try to save data when page is switched
	 */
	addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			throttledEmergencyOnStorageDataChange();
		}
	});

	/**
	 * Try to save data when page is going to be unloaded
	 */
	addEventListener('beforeunload', throttledEmergencyOnStorageDataChange);

	const save = (override = false, type: Save[2][1] = override ? 'auto' : 'manual') => {
		if (!$$.get().dataLoaded) return;

		/**
		 * When autosaves diabled just return
		 */
		if (!autosaves && type === 'auto') return;

		const current = klona(stack.value);

		$.update((prev) => {
			/**
			 * Find latest save that were created in current session, and check if it is latest in an array
			 *
			 * We check if save was created in current session and it is latest in array
			 * When it is not then replacing it will break logical chain
			 *
			 * [auto save 1]
			 * [manual save 1]
			 * [auto save 2] <- should not replace first auto save
			 */
			const isLatest = findLastIndex(prev.saves, (value) => times.has(value[2][0])) === prev.saves.length - 1;

			/**
			 * Update type and time information
			 */
			current[2][0] = intime(Date.now());
			current[2][1] = type;

			if (!override || !isLatest) {
				prev.saves.push(current);

				return prev;
			}

			/**
			 * Get latest
			 */
			const latest = prev.saves.at(-1);

			/**
			 * When that save is the same type, replace it
			 */
			if (latest && latest[2][1] === type) {
				prev.saves[prev.saves.length - 1] = current;
			} else {
				prev.saves.push(current);
			}

			return prev;
		});
	};

	const newGame = () => {
		if (!$$.get().dataLoaded) return;

		const save = getDefaultSave(klona(defaultState));

		/**
		 * Initial save is automatic, and should be ignored when autosaves is turned off
		 */
		if (autosaves) {
			$.update((prev) => {
				return prev.saves.push(save), prev;
			});
		}

		restore(save);
	};

	/**
	 * Set's the save
	 */
	const set = (save: Save) => {
		stack.value = save;

		return restore(save);
	};

	let restoring = false;
	let goingBack = false;
	let interacted = 0;

	/**
	 * Restore
	 */
	const restore = async (save?: Save) => {
		if (!$$.get().dataLoaded) return;

		let latest = save || $.get().saves.at(-1);

		/**
		 * When there is no game, then make a new game
		 */
		if (!latest) {
			$.update(() => ({
				saves: [initial],
				data: klona(defaultData) as Data,
				meta: [getLanguageWithoutParameters(), DEFAULT_TYPEWRITER_SPEED, 1, 1, 1],
			}));

			latest = klona(initial);
		}

		(restoring = true), (stack.value = latest);

		const path = stack.value[0];

		/**
		 * Current item in the story
		 */
		let current: any = story;
		/**
		 * Previous `current` value
		 */
		let precurrent: any;
		/**
		 * Should we ignore some actions
		 */
		let ignoreNested = false;

		/**
		 * Current item of type `[null, int]`
		 */
		let index = 0;

		/**
		 * Cound of items of type `[null, int]`
		 */
		const max = stack.value[0].reduce((acc, [type, val]) => {
			if (isNull(type) && isNumber(val)) {
				return acc + 1;
			}

			return acc;
		}, 0);

		const queue = [] as [any, any][];
		const keep = new Set();
		const characters = new Set();
		const blocks = [];

		for (const [type, val] of path) {
			if (type === 'jump') {
				precurrent = story;
				current = current[val];
			} else if (type === null) {
				precurrent = current;

				if (isNumber(val)) {
					index++;

					let startIndex = 0;

					if (ignoreNested) {
						const prev = findLastPathItemBeforeItemOfType(path.slice(0, index), 'block');

						if (prev) {
							startIndex = prev[1];
							ignoreNested = false;
						}
					}

					/**
					 * Запустим все экшены которые идут в `[null, int]` от `0` до `int`
					 * Почему-то потребовалось изменить `<` на `<=`, чтобы последний action попадал сюда
					 */
					for (let i = startIndex; i <= val; i++) {
						const item = current[i];

						/**
						 * In case of broken save at least not throw
						 * But is should not happen
						 */
						if (!isAction(item)) continue;

						const [action, ...meta] = item;

						/**
						 * Add item to queue and action to keep
						 */
						const push = () => {
							keep.add(action);
							queue.push([action, meta]);
						};

						/**
						 * Do not remove characters that will be here anyways
						 */
						if (action === 'showCharacter') characters.add(meta[0]);

						/**
						 * Экшены, для закрытия которых пользователь должен с ними взаимодействовать
						 * Также в эту группу входят экшены, которые не должны быть вызваны при восстановлении
						 */
						if (isSkippedDuringRestore(action) || isUserRequiredAction(action, meta)) {
							if (index === max && i === val) {
								push();
							} else {
								continue;
							}
						}

						push();
					}
				}

				current = current[val];
			} else if (type === 'choice') {
				blocks.push(precurrent);
				current = current[val + 1][1];
			} else if (type === 'condition') {
				blocks.push(precurrent);
				current = current[2][val];
			} else if (type === 'block') {
				blocks.push(precurrent);
				current = story[val];
			} else if (type === 'block:exit' || type === 'choice:exit' || type === 'condition:exit') {
				current = blocks.pop();
				ignoreNested = true;
			}
		}

		/**
		 * Run these exactly before the main loop.
		 */
		renderer.ui.showScreen('game');
		/**
		 * Provide the `keep` in there
		 */
		match('clear', [keep, characters]);

		/**
		 * Get the next actions array.
		 */
		const next = (i: number) => queue.slice(i + 1);

		for await (const [i, [action, meta]] of queue.entries()) {
			if (action === 'function' || action === 'custom') {
				/**
				 * When `callOnlyLatest` is `true`
				 */
				if (action === 'custom' && (meta as GetActionParameters<'Custom'>)[0].callOnlyLatest) {
					/**
					 * We'll calculate it is `latest` or not
					 */
					const notLatest = next(i).some(([, _meta]) => {
						if (!_meta || !meta) return false;

						const c0 = _meta[0] as unknown as GetActionParameters<'Custom'>[0];
						const c1 = meta[0] as unknown as GetActionParameters<'Custom'>[0];

						/**
						 * Also check for `undefined`
						 */
						const isIdenticalID = c0.id && c1.id && c0.id === c1.id;
						const isIdenticalByReference = c0 === c1;

						return isIdenticalID || isIdenticalByReference || str(c0) === str(c1);
					});

					if (notLatest) continue;
				}

				/**
				 * Action can return Promise.
				 */
				const result = match(action, meta);

				/**
				 * Should wait until it resolved
				 */
				if (isPromise(result)) {
					/**
					 * Await it!
					 */
					await result;
				}
			} else if (action === 'showCharacter') {
				const skip = next(i).some(([_action, _meta]) => {
					/**
					 * Проверка на возможный `undefined`
					 */
					if (!_meta || !meta) return false;

					/**
					 * Будет ли персонаж скрыт в будущем
					 * Нет смысла при загрузке сохранения загружать и отрисовывать персонажа, который будет скрыт
					 */
					const hidden = _action === 'hideCharacter' && _meta[0] === meta[0];
					/**
					 * Не нужно запускать рендер персонажа, если после этого будет ещё один рендер этого персонажа
					 * Таким образом избегаем ситуации, когда при загрузке вследствие гонки при загрузки изображений отрисовывается не последняя эмоция
					 */
					const notLatest = _action === action && _meta[0] === meta[0];

					return hidden || notLatest;
				});

				if (skip) continue;

				match(action, meta);
			} else if (action === 'showBackground' || action === 'animateCharacter' || action === 'preload') {
				/**
				 * @todo: Также сравнивать персонажей в animateCharacter. Чтобы не просто последний запускался, а последний для персонажа.
				 * Тем не менее таким образом могут быть лишнии анимации.
				 * Можно проверить, что одна анимация идёт сразу за другой, а не через, например, dialog
				 */

				/**
				 * Такая же оптимизация применяется к фонам и анимированию персонажей, и `preload`.
				 * Если фон изменится, то нет смысла устанавливать или предзагружать текущий
				 */
				const notLatest = next(i).some(([_action]) => action === _action);

				if (notLatest) continue;

				match(action, meta);
			} else {
				match(action, meta);
			}
		}

		(restoring = goingBack = false), render();
	};

	const refer = (path = stack.value[0]) => {
		let current: any = story;
		let precurrent: any = story;

		const blocks: any[] = [];

		for (const [type, val] of path) {
			if (type === 'jump') {
				precurrent = story;
				current = current[val];
			} else if (type === null) {
				precurrent = current;
				current = current[val];
			} else if (type === 'choice') {
				blocks.push(precurrent);
				current = current[(val as number) + 1][1];
			} else if (type === 'condition') {
				blocks.push(precurrent);
				current = current[2][val];
			} else if (type === 'block') {
				blocks.push(precurrent);
				current = story[val];
			} else if (type === 'block:exit' || type === 'choice:exit' || type === 'condition:exit') {
				current = blocks.pop();
			}
		}

		return current;
	};

	/**
	 * @param force Force exit
	 */
	const exit = (force = false) => {
		if (interacted > 1 && !force && askBeforeExit) {
			renderer.ui.showExitPrompt();
			return;
		}

		const current = stack.value;

		stack.clear();
		renderer.ui.showScreen('mainmenu');
		renderer.audio.destroy();

		/**
		 * First two save elements and it's type
		 */
		const [time, type] = current[2];

		/**
		 * This is auto save and belongs to the current session
		 * Player did not interacted or did it once, so this is probably not-needed save
		 */
		if (type === 'auto' && interacted <= 1 && times.has(time)) {
			$.update((prev) => {
				prev.saves = prev.saves.filter((save) => save !== current);

				return prev;
			});
		}

		/**
		 * Reset interactive value
		 */
		interactivity(false);
		/**
		 * Reset session times
		 */
		times.clear();
	};

	const back = () => {
		return stack.back(), restore(stack.value);
	};

	const t = (key: BaseTranslationStrings, lang: string | Languages) => {
		return translation[lang as Languages].internal[key];
	};

	const renderer = createRenderer({
		characters,
		set,
		restore,
		save,
		newGame,
		exit,
		back,
		t,
		stack,
		languages,
		$,
		$$,
	});

	renderer.ui.start();

	const match = matchAction({
		wait([time]) {
			if (!restoring) setTimeout(push, isFunction(time) ? time() : time);
		},
		showBackground([background]) {
			renderer.background(background);
			push();
		},
		playMusic([source]) {
			renderer.audio.music(source, 'music', true).play();
			push();
		},
		stopMusic([source]) {
			renderer.audio.music(source, 'music').stop();
			push();
		},
		playSound([source, loop]) {
			renderer.audio.music(source, 'sound', loop || false).play();
			push();
		},
		stopSound([source]) {
			renderer.audio.music(source, 'sound').stop();
			push();
		},
		voice([source]) {
			renderer.audio.voice(source);
			push();
		},
		stopVoice() {
			renderer.audio.voiceStop();
			push();
		},
		showCharacter([character, emotion, className, style]) {
			if (DEV && !characters[character].emotions[emotion]) {
				throw new Error(`Attempt to show character "${character}" with unknown emotion "${emotion}"`)
			}

			const handle = renderer.character(character);

			handle.append(className, style, restoring);
			handle.withEmotion(emotion)();

			push();
		},
		hideCharacter([character, className, style, duration]) {
			renderer.character(character).remove(className, style, duration)(push, restoring);
		},
		dialog([character, content, emotion]) {
			/**
			 * Person name
			 */
			const name = (() => {
				const c = character;
				const cs = characters;
				const lang = $.get().meta[0];

				if (c && c in cs) {
					const block = cs[c].name;

					if (typeof block === 'string') {
						return block;
					}

					if (lang in block) {
						return block[lang as Languages];
					}
				}

				return c || '';
			})();

			const run = renderer.dialog(unwrap(content), unwrap(name), character, emotion);

			run(forward, goingBack);
		},
		function([fn]) {
			const result = fn(restoring, goingBack);

			if (!restoring) result ? result.then(push) : push();

			return result;
		},
		choice([question, ...choices]) {
			const isWithoutQuestion = Array.isArray(question);

			if (isWithoutQuestion) {
				/**
				 * Первый элемент может быть как строкой, так и элементов выбора
				 */
				choices.unshift(question as unknown as [Unwrappable<Languages>, ValidAction[], () => boolean]);
				/**
				 * Значит, текст не требуется
				 */
				question = '';
			}

			const unwrapped = choices.map(([content, action, visible]) => {
				if (DEV && action.length === 0 && (!visible || visible())) {
					console.warn(`Choice children should not be empty, either add content there or make item not selectable`)
				}

				return [unwrap(content), action, visible] as [string, ValidAction[], () => boolean];
			});

			if (DEV && unwrapped.length === 0) {
				throw new Error(`Running choice without variants to choose from, look at how to use Choice action properly [https://novely.pages.dev/guide/actions/choice#usage]`)
			}

			const run = renderer.choices(unwrap(question), unwrapped);

			run((selected) => {
				enmemory();

				/**
				 * If there is a question, then `index` should be shifted by `1`
				 */
				const offset = isWithoutQuestion ? 0 : 1;

				if (DEV && !unwrapped[selected + offset]) {
					throw new Error('Choice children is empty, either add content there or make item not selectable')
				}

				stack.value[0].push(['choice', selected + offset], [null, 0]);
				render();
				interactivity(true);
			});
		},
		jump([scene]) {
			if (DEV && !story[scene]) {
				throw new Error(`Attempt to jump to unknown scene "${scene}"`)
			}

			if (DEV && story[scene].length === 0) {
				throw new Error(`Attempt to jump to empty scene "${scene}"`)
			}

			/**
			 * `-1` index is used here because `clear` will run `next` that will increase index to `0`
			 */
			stack.value[0] = [
				['jump', scene],
				[null, -1],
			];

			match('clear', []);
		},
		clear([keep, characters]) {
			/**
			 * Remove vibration
			 */
			renderer.vibrate(0);
			/**
			 * Call the actual `clear`
			 */
			renderer.clear(goingBack, keep || EMPTY_SET, characters || EMPTY_SET)(push);

			renderer.audio.clear();
		},
		condition([condition, variants]) {
			if (DEV && Object.values(variants).length === 0) {
				throw new Error(`Attempt to use Condition action with empty variants object`)
			}

			if (!restoring) {
				const val = String(condition());

				if (DEV && !variants[val]) {
					throw new Error(`Attempt to go to unknown variant "${val}"`)
				}

				if (DEV && variants[val].length === 0) {
					throw new Error(`Attempt to go to empty variant "${val}"`)
				}

				stack.value[0].push(['condition', val], [null, 0]);

				render();
			}
		},
		end() {
			/**
			 * Clear the Scene
			 */
			renderer.vibrate(0);
			/**
			 * No-op used there because using push will make an infinite loop
			 */
			renderer.clear(goingBack, EMPTY_SET, EMPTY_SET)(noop);

			/**
			 * Go to the main menu
			 */
			renderer.ui.showScreen('mainmenu');
			/**
			 * Reset interactive value
			 */
			interactivity(false);
			/**
			 * Reset session times
			 */
			times.clear();
		},
		input([question, onInput, setup]) {
			renderer.input(unwrap(question), onInput, setup)(forward);
		},
		custom([handler]) {
			const result = renderer.custom(handler, goingBack, () => {
				if (!restoring && handler.requireUserAction) enmemory(), interactivity(true);
				if (!restoring) push();
			});

			return result;
		},
		vibrate(pattern) {
			renderer.vibrate(pattern);
			push();
		},
		next() {
			push();
		},
		animateCharacter([character, timeout, ...classes]) {
			if (DEV && classes.length === 0) {
				throw new Error('Attempt to use AnimateCharacter without classes. Classes should be provided [https://novely.pages.dev/guide/actions/animateCharacter.html]')
			}

			if (DEV && (timeout <= 0 || !Number.isFinite(timeout) || Number.isNaN(timeout))) {
				throw new Error('Attempt to use AnimateCharacter with unacceptable timeout. It should be finite and greater than zero')
			}

			const handler: CustomHandler = (get) => {
				const { clear } = get('@@internal-animate-character', false);
				const char = renderer.store.characters[character];

				/**
				 * Character is not defined, maybe, `animateCharacter` was called before `showCharacter` OR character was not just loaded yet
				 */

				if (!char) return;

				const target = char.canvas;

				/**
				 * Character is not found
				 */
				if (!target) return;

				const classNames = classes.filter((className) => !target.classList.contains(className));

				target.classList.add(...classNames);

				const timeoutId = setTimeout(() => {
					target.classList.remove(...classNames);
				}, timeout);

				clear(() => {
					target.classList.remove(...classNames);

					/**
					 * Clear timeout, because when you will game re-runs some callback might remove classes from character
					 */
					clearTimeout(timeoutId);
				});
			};

			/**
			 * `callOnlyLatest` property will not have any effect, because `custom` is called directly
			 */
			match('custom', [handler]);
		},
		text(text) {
			const string = text.map((content) => unwrap(content)).join(' ');

			if (DEV && string.length === 0) {
				throw new Error(`Action Text was called with empty string or array`)
			}

			renderer.text(string, forward, goingBack);
		},
		exit() {
			if (restoring) return;

			const path = stack.value[0];
			const last = path.at(-1);
			const ignore: ('choice:exit' | 'condition:exit' | 'block:exit')[] = [];

			/**
			 * - should be an array
			 * - first element is action name
			 */
			if (!isAction(refer(path))) {
				if (last && isNull(last[0]) && isNumber(last[1])) {
					last[1]--;
				} else {
					path.pop();
				}
			}

			if (isExitImpossible(path)) {
				const referred = refer(path);

				if (isAction(referred) && isSkippedDuringRestore(referred[0])) {
					match('end', []);
				}

				return;
			}

			for (let i = path.length - 1; i > 0; i--) {
				const [name] = path[i];

				/**
				 * Remember already exited paths
				 */
				if (isBlockExitStatement(name)) {
					ignore.push(name);
				}

				/**
				 * Ignore everything that we do not need there
				 */
				if (!isBlockStatement(name)) continue;

				/**
				 * When we found an already exited path we remove it from the list
				 */
				if (ignore.at(-1)?.startsWith(name)) {
					ignore.pop();
					continue;
				}

				/**
				 * Exit from the path
				 */
				path.push([`${name}:exit`]);

				const prev = findLastPathItemBeforeItemOfType(path.slice(0, i + 1), name);

				/**
				 * When possible also go to the next action (or exit from one layer above)
				 */
				if (prev) path.push([null, prev[1] + 1]);

				/**
				 * If we added an `[null, int]` but it points not to action, then
				 *
				 * - remove that item
				 * - close another block
				 */
				if (!isAction(refer(path))) {
					path.pop();
					continue;
				}

				break;
			}

			render();
		},
		preload([source]) {
			if (!goingBack && !restoring && !PRELOADED_ASSETS.has(source)) {
				/**
				 * Make image load
				 */
				PRELOADED_ASSETS.add(renderer.misc.preloadImage(source));
			}

			push();
		},
		block([scene]) {
			if (DEV && !story[scene]) {
				throw new Error(`Attempt to call Block action with unknown scene "${scene}"`)
			}

			if (DEV && story[scene].length === 0) {
				throw new Error(`Attempt to call Block action with empty scene "${scene}"`)
			}

			if (!restoring) {
				stack.value[0].push(['block', scene], [null, 0]);

				render();
			}
		},
	});

	const enmemory = () => {
		if (restoring) return;

		const current = klona(stack.value);

		current[2][1] = 'auto';

		stack.push(current);

		save(true, 'auto');
	};

	const next = () => {
		const path = stack.value[0];

		/**
		 * Last path element
		 */
		const last = path.at(-1);

		if (last && (isNull(last[0]) || last[0] === 'jump') && isNumber(last[1])) {
			last[1]++;
		} else {
			path.push([null, 0]);
		}
	};

	const render = () => {
		const referred = refer();

		if (isAction(referred)) {
			const [action, ...props] = referred;

			match(action, props);
		} else {
			match('exit', []);
		}
	};

	const push = () => {
		if (!restoring) next(), render();
	};

	const forward = () => {
		enmemory();
		push();
		interactivity(true);
	};

	const interactivity = (value = false) => {
		interacted = value ? interacted + 1 : 0;
	};

	/**
	 * Unwraps translatable content to string
	 *
	 * @example ```
	 * unwrap({ en: 'Hello', ru: 'Привет' });
	 * unwrap({ en: () => data().ad_viewed ? 'Diamond Hat' : 'Diamond Hat (Watch Adv)' })
	 * unwrap(() => `Today is ${new Date()}`)
	 * unwrap('Hello, {{name}}');
	 * ```
	 */
	const unwrap = (content: Unwrappable<Languages>, global = false) => {
		const {
			data,
			meta: [lang],
		} = $.get();

		const obj = global ? data : state();
		const cnt = isFunction(content)
			? content()
			: typeof content === 'string'
			  ? content
			  : content[lang as Languages];

		const str = isFunction(cnt) ? cnt() : cnt;

		const trans = translation[lang as Languages];

		if (trans.actions || trans.plural) {
			/**
			 * Should kinda work, but creating PluralRules each time is not really efficient
			 */
			return replaceT9N(str, obj, trans.plural, trans.actions, new Intl.PluralRules(trans.tag || lang));
		}

		return replaceT9N(str, obj);
	};

	function data(value: DeepPartial<DataScheme> | ((prev: DataScheme) => DataScheme)): void;
	function data(): DataScheme;
	function data(value?: DeepPartial<DataScheme> | ((prev: DataScheme) => DataScheme)): DataScheme | void {
		if (!value) return $.get().data as DataScheme | void;

		const prev = $.get().data;
		const val = isFunction(value) ? value(prev as DataScheme) : deepmerge(prev, value);

		$.update((prev) => {
			prev.data = val;

			return prev;
		});
	}

	return {
		/**
		 * Function to set game script
		 */
		script,
		/**
		 * Function to get actions
		 */
		action,
		/**
		 * State that belongs to games
		 */
		state,
		/**
		 * Unlike `state`, stored at global scope instead and shared between games
		 */
		data,
		/**
		 * Unwraps translatable content to a string value
		 */
		unwrap(content: Exclude<Unwrappable<Languages>, Record<string, string>> | Record<Languages, string>) {
			return unwrap(content, true);
		},
	};
};

export { novely };
