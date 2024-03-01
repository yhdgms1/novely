import type { Character } from './character';
import type {
	ActionProxyProvider,
	Story,
	ValidAction,
	Unwrappable,
} from './action';
import type {
	Save,
	State,
	Data,
	StorageData,
	DeepPartial,
	NovelyScreen,
	CoreData,
	Path,
	NovelyInit
} from './types';
import type { Context } from './renderer';
import type { BaseTranslationStrings } from './translations';
import type { MatchActionInit } from './utils';
import {
	matchAction,
	isNumber,
	isNull,
	isEmpty,
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
	isExitImpossible,
	getActionsFromPath,
	createUseStackFunction,
	createQueueProcessor,
	mapSet,
	isAudioAction,
	isString,
	isImageAsset,
	getResourseType
} from './utils';
import { PRELOADED_ASSETS } from './global';
import { store } from './store';
import { deepmerge } from '@novely/deepmerge';
import { klona } from 'klona/json';
import { EMPTY_SET, DEFAULT_TYPEWRITER_SPEED, MAIN_CONTEXT_KEY } from './constants';
import { replace as replaceT9N } from './translation';
import { localStorageStorage } from './storage';
import pLimit from 'p-limit';

import { DEV } from 'esm-env';
import { STACK_MAP } from './shared';

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
	state: defaultState,
	data: defaultData,
	autosaves = true,
	migrations = [],
	throttleTimeout = 799,
	getLanguage = defaultGetLanguage,
	overrideLanguage = false,
	askBeforeExit = true,
	preloadAssets = 'lazy',
	parallelAssetsDownloadLimit = 15,
	fetch: request = fetch
}: NovelyInit<Languages, Characters, StateScheme, DataScheme>) => {
	/**
	 * Local type declaration to not repeat code
	 */
	type Actions = ActionProxyProvider<Characters, Languages>;

	const languages = Object.keys(translation) as Languages[];

	const limitScript = pLimit(1);
	const limitAssetsDownload = pLimit(parallelAssetsDownloadLimit);

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

			const { preloadAudioBlocking, preloadImageBlocking } = renderer.misc;

			const list = mapSet(ASSETS_TO_PRELOAD, (asset) => {
				return limitAssetsDownload(async () => {
					const type = await getResourseType(request, asset);

					switch (type) {
						case 'audio': {
							await preloadAudioBlocking(asset);
							break;
						}

						case 'image': {
							await preloadImageBlocking(asset);
							break;
						}
					}
				})
			});

			/**
			 * `allSettled` is used because even if error happens game should run
			 *
			 * Ideally, there could be a notification for player, maybe developer could be also notified
			 * But I don't think it's really needed
			 */
			await Promise.allSettled(list);
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

	const action = new Proxy({} as Actions, {
		get<Action extends keyof Actions>(_: unknown, action: Action) {
			return (...props: Parameters<Actions[Action]>) => {
				if (preloadAssets === 'blocking') {
					if (action === 'showBackground') {
						/**
						 * There are two types of showBackground currently
						 *
						 * Parameter is a `string`
						 * Parameter is a `Record<'CSS Media', string>`
						 */
						if (isImageAsset(props[0])) {
							ASSETS_TO_PRELOAD.add(props[0]);
						}

						if (props[0] && typeof props[0] === 'object') {
							for (const value of Object.values(props[0])) {
								if (!isImageAsset(value)) continue;

								ASSETS_TO_PRELOAD.add(value);
							}
						}
					}

					/**
					 * Here "stop" action also matches condition, but because `ASSETS_TO_PRELOAD` is a Set, there is no problem
					 */
					if (isAudioAction(action) && isString(props[0])) {
						ASSETS_TO_PRELOAD.add(props[0])
					}

					/**
					 * Load characters
					 */
					if (action === 'showCharacter' && isString(props[0]) && isString(props[1])) {
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

				return [action, ...props];
			};
		},
	});

	function state(value: DeepPartial<StateScheme> | ((prev: StateScheme) => StateScheme)): void;
	function state(): StateScheme;
	function state(value?: DeepPartial<StateScheme> | ((prev: StateScheme) => StateScheme)): StateScheme | void {
		const stack = useStack(MAIN_CONTEXT_KEY);

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

		if (overrideLanguage || !stored.meta[0]) {
			stored.meta[0] = getLanguageWithoutParameters();
		}

		/**
		 * Default `localStorageStorage` returns empty array
		 */
		stored.meta[1] ||= DEFAULT_TYPEWRITER_SPEED;

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
		$.set(stored);
	};

	/**
	 * By default this is resolved immediately, but also can be delayed.
	 * I.e. storage has not loaded yet
	 */
	storageDelay.then(getStoredData);

	const initial = getDefaultSave(klona(defaultState));

	const onVisibilityChange = () => {
		if (document.visibilityState === 'hidden') {
			throttledEmergencyOnStorageDataChange();
		}
	}

	/**
	 * Try to save data when page is switched
	 */
	addEventListener('visibilitychange', onVisibilityChange);

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

		/**
		 * Saves only possible in main context, so there is no reason for context to be used here
		 */
		const stack = useStack(MAIN_CONTEXT_KEY);
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
	 * Set's the save and restores onto it
	 */
	const set = (save: Save, ctx?: Context) => {
		const stack = useStack(ctx || renderer.getContext(MAIN_CONTEXT_KEY));

		stack.value = save;

		return restore(save);
	};

	let interacted = 0;

	/**
	 * Restore save or if none is passed then look for latest save, if there is no saves will create a new save
	 */
	const restore = async (save?: Save) => {
		if (!$$.get().dataLoaded) return;

		let latest = save || $.get().saves.at(-1);

		/**
		 * When there is no save, make a new save
		 */
		if (!latest) {
			latest = klona(initial)

			$.update((prev) => {
				/**
				 * `latest` will be not undefined because this callback called immediately
				 */
				prev.saves.push(latest!);

				return prev
			})
		}

		const context = renderer.getContext(MAIN_CONTEXT_KEY);
		const stack = useStack(context);

		context.meta.restoring = true;

		const previous = stack.previous;

		const [path] = stack.value = latest;

		renderer.ui.showScreen('game');

		const queue = getActionsFromPath(story, path);
		const processor = createQueueProcessor(queue);
		const { keep, characters, audio } = processor.getKeep();

		if (previous) {
			const prevQueue = getActionsFromPath(story, previous[0], true);
			const currQueue = getActionsFromPath(story, path, true);

			for (let i = prevQueue.length - 1; i > currQueue.length; i--) {
				const element = prevQueue[i];

				/**
				 * Just in case 🤷
				 */
				if (isAction(element)) {
					const [action, props] = element as ValidAction;

					/**
					 * Imagine array of actions like
					 *
					 * [
					 *  ['dialog', ...props]
					 *  ['dialog', ...props]
					 *  ['custom', function]
					 * ]
					 *
					 * When player goes back array changes to
					 *
					 * [
					 *  ['dialog', ...props]
					 * ]
					 *
					 * We catch these custom actions that are gone and
					 * call their clear methods so there is no side effects
					 * from future in the past
					 */
					if (action === 'custom') {
						context.clearCustom(props[0]);
					}
				}
			}
		}

		match('clear', [keep, characters, audio], {
			ctx: context,
			data: latest[1]
		});

		await processor.run((action, props) => {
			if (!latest) return;

			return match(action, props, {
				ctx: context,
				data: latest[1]
			});
		});

		context.meta.restoring = context.meta.goingBack = false;

		render(context);
	};

	const refer = (path?: Path) => {
		if (!path) {
			path = useStack(MAIN_CONTEXT_KEY).value[0]
		}

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

		/**
		 * Exit only possible in main context
		 */
		const ctx = renderer.getContext(MAIN_CONTEXT_KEY);

		const stack = useStack(ctx);
		const current = stack.value;

		stack.clear();
		renderer.ui.showScreen('mainmenu');
		ctx.audio.destroy();

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

	const back = async () => {
		/**
		 * Back also happens in main context only
		 */
		const stack = useStack(MAIN_CONTEXT_KEY);

		stack.back();

		await restore(stack.value);
	};

	const t = (key: BaseTranslationStrings, lang: string | Languages) => {
		return translation[lang as Languages].internal[key];
	};

	/**
	 * Execute save in context at `name`
	 */
	const preview = async ([path, data]: Save, name: string) => {
		const queue = getActionsFromPath(story, path);
		const ctx = renderer.getContext(name);

		/**
		 * Enter restoring mode in action
		 */
		ctx.meta.restoring = true;
		ctx.meta.preview = true;

		const processor = createQueueProcessor(queue);

		await processor.run((action, props) => {
			if (isAudioAction(action)) return;
			if (action === 'vibrate') return;
			if (action === 'end') return;

			return match(action, props, {
				ctx,
				data,
			});
		});
	}

	const removeContext = (name: string) => {
		STACK_MAP.delete(name);
	}

	const renderer = createRenderer({
		mainContextKey: MAIN_CONTEXT_KEY,

		characters,
		set,
		restore,
		save,
		newGame,
		exit,
		back,
		t,
		preview,
		removeContext,
		languages,
		$,
		$$,
	});

	const useStack = createUseStackFunction(renderer);

	/**
	 * Initiate
	 */
	useStack(MAIN_CONTEXT_KEY).push(initial);

	const UIInstance = renderer.ui.start();

	const enmemory = (ctx: Context) => {
		if (ctx.meta.restoring) return;

		const stack = useStack(ctx);

		const current = klona(stack.value);

		current[2][1] = 'auto';

		stack.push(current);

		save(true, 'auto');
	};

	const next = (ctx: Context) => {
		const stack = useStack(ctx);
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

	const matchActionInit: MatchActionInit = {
		getContext: renderer.getContext,
		push(ctx) {
			if (ctx.meta.restoring) return;

			next(ctx);
			render(ctx);
		},
		forward(ctx) {
			/**
			 * There should be way to determine when it's better to enmemory before push and when after
			 */
			if (!ctx.meta.preview) enmemory(ctx);

			matchActionInit.push(ctx);

			if (!ctx.meta.preview) interactivity(true);
		},
	};

	const match = matchAction(matchActionInit, {
		wait({ ctx, push }, [time]) {
			if (ctx.meta.restoring) return;

			setTimeout(push, isFunction(time) ? time() : time);
		},
		showBackground({ ctx, push }, [background]) {
			ctx.background(background);
			push();
		},
		playMusic({ ctx, push }, [source]) {
			ctx.audio.music(source, 'music', true).play();
			push();
		},
		stopMusic({ ctx, push }, [source]) {
			ctx.audio.music(source, 'music').stop();
			push();
		},
		playSound({ ctx, push }, [source, loop]) {
			ctx.audio.music(source, 'sound', loop || false).play();
			push();
		},
		stopSound({ ctx, push }, [source]) {
			ctx.audio.music(source, 'sound').stop();
			push();
		},
		voice({ ctx, push }, [source]) {
			ctx.audio.voice(source);
			push();
		},
		stopVoice({ ctx, push }) {
			ctx.audio.voiceStop();
			push();
		},
		showCharacter({ ctx, push }, [character, emotion, className, style]) {
			if (DEV && !characters[character].emotions[emotion]) {
				throw new Error(`Attempt to show character "${character}" with unknown emotion "${emotion}"`)
			}

			const handle = ctx.character(character);

			handle.append(className, style, ctx.meta.restoring);
			handle.emotion(emotion, true);

			push();
		},
		hideCharacter({ ctx, push }, [character, className, style, duration]) {
			ctx.character(character).remove(className, style, duration, ctx.meta.restoring).then(push)
		},
		dialog({ ctx, data, forward }, [character, content, emotion]) {
			/**
			 * Person name
			 */
			const name = (() => {
				const c = character;
				const cs = characters;
				const [lang] = $.get().meta;

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

			ctx.dialog(
				unwrap(content, data),
				unwrap(name, data),
				character,
				emotion,
				forward
			);
		},
		function({ ctx, push }, [fn]) {
			const result = fn(ctx.meta.restoring, ctx.meta.goingBack, ctx.meta.preview);

			if (!ctx.meta.restoring) {
				result ? result.then(push) : push();
			}

			return result;
		},
		choice({ ctx, data }, [question, ...choices]) {
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

			const unwrappedChoices = choices.map(([content, action, visible]) => {
				if (DEV && action.length === 0 && (!visible || visible())) {
					console.warn(`Choice children should not be empty, either add content there or make item not selectable`)
				}

				return [unwrap(content, data), action, visible] as [string, ValidAction[], () => boolean];
			});

			if (DEV && unwrappedChoices.length === 0) {
				throw new Error(`Running choice without variants to choose from, look at how to use Choice action properly [https://novely.pages.dev/guide/actions/choice#usage]`)
			}

			ctx.choices(unwrap(question, data), unwrappedChoices, (selected) => {
				if (!ctx.meta.preview) {
					enmemory(ctx);
				}

				const stack = useStack(ctx);

				/**
				 * If there is a question, then `index` should be shifted by `1`
				 */
				const offset = isWithoutQuestion ? 0 : 1;

				if (DEV && !unwrappedChoices[selected]) {
					throw new Error('Choice children is empty, either add content there or make item not selectable')
				}

				stack.value[0].push(['choice', selected + offset], [null, 0]);
				render(ctx);
				interactivity(true);
			});
		},
		jump({ ctx, data }, [scene]) {
			if (DEV && !story[scene]) {
				throw new Error(`Attempt to jump to unknown scene "${scene}"`)
			}

			if (DEV && story[scene].length === 0) {
				throw new Error(`Attempt to jump to empty scene "${scene}"`)
			}

			const stack = useStack(ctx);

			/**
			 * `-1` index is used here because `clear` will run `next` that will increase index to `0`
			 */
			stack.value[0] = [
				['jump', scene],
				[null, -1],
			];

			match('clear', [], {
				ctx,
				data,
			});
		},
		clear({ ctx, push }, [keep, characters, audio]) {
			/**
			 * Remove vibration
			 */
			ctx.vibrate(0);

			/**
			 * Call the actual `clear`
			 */
			ctx.clear(
				keep || EMPTY_SET,
				characters || EMPTY_SET,
				audio || { music: EMPTY_SET, sounds: EMPTY_SET },
				push
			);
		},
		condition({ ctx }, [condition, variants]) {
			if (DEV && Object.values(variants).length === 0) {
				throw new Error(`Attempt to use Condition action with empty variants object`)
			}

			if (!ctx.meta.restoring) {
				const val = String(condition());

				if (DEV && !variants[val]) {
					throw new Error(`Attempt to go to unknown variant "${val}"`)
				}

				if (DEV && variants[val].length === 0) {
					throw new Error(`Attempt to go to empty variant "${val}"`)
				}

				const stack = useStack(MAIN_CONTEXT_KEY);

				stack.value[0].push(['condition', val], [null, 0]);

				render(ctx);
			}
		},
		end({ ctx }) {
			if (ctx.meta.preview) return;

			ctx.vibrate(0);
			ctx.clear(EMPTY_SET, EMPTY_SET, { music: EMPTY_SET, sounds: EMPTY_SET }, noop);

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
		input({ ctx, data, forward }, [question, onInput, setup]) {
			ctx.input(
				unwrap(question, data),
				onInput,
				setup || noop,
				forward
			);
		},
		custom({ ctx, push }, [handler]) {
			const result = ctx.custom(handler, () => {
				if (ctx.meta.restoring) return;

				if (handler.requireUserAction && !ctx.meta.preview) {
					enmemory(ctx);
					interactivity(true);
				}

				push();
			});

			return result;
		},
		vibrate({ ctx, push }, pattern) {
			ctx.vibrate(pattern);
			push();
		},
		next({ push }) {
			push();
		},
		animateCharacter({ ctx, push }, [character, timeout, ...classes]) {
			if (DEV && classes.length === 0) {
				throw new Error('Attempt to use AnimateCharacter without classes. Classes should be provided [https://novely.pages.dev/guide/actions/animateCharacter.html]')
			}

			if (DEV && (timeout <= 0 || !Number.isFinite(timeout) || Number.isNaN(timeout))) {
				throw new Error('Attempt to use AnimateCharacter with unacceptable timeout. It should be finite and greater than zero')
			}

			if (ctx.meta.preview) return;

			ctx.character(character).animate(timeout, classes);

			push();
		},
		text({ ctx, data, forward }, text) {
			const string = text.map((content) => unwrap(content, data)).join(' ');

			if (DEV && string.length === 0) {
				throw new Error(`Action Text was called with empty string or array`)
			}

			ctx.text(string, forward);
		},
		exit({ ctx, data }) {
			if (ctx.meta.restoring) return;

			const stack = useStack(ctx);

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
					match('end', [], {
						ctx,
						data,
					});
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

			render(ctx);
		},
		preload({ ctx, push }, [source]) {
			if (!ctx.meta.goingBack && !ctx.meta.restoring && !PRELOADED_ASSETS.has(source)) {
				/**
				 * Make image load
				 */
				PRELOADED_ASSETS.add(renderer.misc.preloadImage(source));
			}

			push();
		},
		block({ ctx }, [scene]) {
			if (DEV && !story[scene]) {
				throw new Error(`Attempt to call Block action with unknown scene "${scene}"`)
			}

			if (DEV && story[scene].length === 0) {
				throw new Error(`Attempt to call Block action with empty scene "${scene}"`)
			}

			if (!ctx.meta.restoring) {
				const stack = useStack(ctx);

				stack.value[0].push(['block', scene], [null, 0]);

				render(ctx);
			}
		},
	});

	const render = (ctx: Context) => {
		const stack = useStack(ctx);
		const referred = refer(stack.value[0]);

		if (isAction(referred)) {
			const [action, ...props] = referred;

			match(action, props, {
				ctx,
				data: stack.value[1]
			});
		} else {
			match('exit', [], {
				ctx,
				data: stack.value[1]
			});
		}
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
	const unwrap = (content: Unwrappable<Languages>, values?: Data) => {
		const {
			data,
			meta: [lang],
		} = $.get();

		const obj = values ? values : data;
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
			return unwrap(content, $.get().data);
		},
		/**
		 * Cancel data loading, hide UI, ignore page change events
		 * Data updates still will work in case Novely already was loaded
		 */
		destroy() {
			dataLoaded.cancel();

			UIInstance.unmount();

			removeEventListener('visibilitychange', onVisibilityChange);
			removeEventListener('beforeunload', throttledEmergencyOnStorageDataChange);
		}
	};
};

export { novely };
