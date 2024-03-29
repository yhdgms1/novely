import type { Character } from './character';
import type {
	ActionProxy,
	Story,
	ValidAction,
	TextContent,
} from './action';
import type {
	Save,
	State,
	Data,
	StorageData,
	NovelyScreen,
	CoreData,
	Path,
	NovelyInit,
	StateFunction
} from './types';
import type { Stored } from './store';
import type { Context } from './renderer';
import type { BaseTranslationStrings } from './translations';
import type { ControlledPromise, MatchActionInit } from './utils';
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
	getResourseType,
	isUserRequiredAction
} from './utils';
import { PRELOADED_ASSETS } from './global';
import { store } from './store';
import { deepmerge } from '@novely/deepmerge';
import { klona } from 'klona/json';
import { EMPTY_SET, DEFAULT_TYPEWRITER_SPEED, MAIN_CONTEXT_KEY } from './constants';
import { replace as replaceTranslation, flattenAllowedContent } from './translation';
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
	fetch: request = fetch,
	saveOnUnload = true
}: NovelyInit<Languages, Characters, StateScheme, DataScheme>) => {
	/**
	 * Local type declaration to not repeat code
	 */
	type Actions = ActionProxy<Characters, Languages, StateScheme>;

	const languages = Object.keys(translation) as Languages[];

	const limitScript = pLimit(1);
	const limitAssetsDownload = pLimit(parallelAssetsDownloadLimit);

	const story: Story = {};

	const times = new Set<number>();

	const ASSETS_TO_PRELOAD = new Set<string>();

	const dataLoaded = createControlledPromise();

	let initialScreenWasShown = false;

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

		let loadingIsShown = false;

		/**
		 * This is the first `script` call, likely data did not loaded yet
		 */
		if (!initialScreenWasShown) {
			renderer.ui.showLoading();
			loadingIsShown = true;
		}

		if (preloadAssets === 'blocking' && ASSETS_TO_PRELOAD.size > 0) {
			/**
			 * Likely updating this will not break anything, but just to be sure nothing breaks
			 * We want to avoid flashes, and who knows how some renderer will use it
			 */
			if (!loadingIsShown) {
				renderer.ui.showLoading();
			}

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

		ASSETS_TO_PRELOAD.clear();

		await dataLoaded.promise;

		renderer.ui.hideLoading()

		if (!initialScreenWasShown) {
			initialScreenWasShown = true;

			if (initialScreen === 'game') {
				restore();
			} else {
				renderer.ui.showScreen(initialScreen);
			}
		}
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

				return [action, ...props] as ValidAction;
			};
		},
	});

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

	/**
	 * Calls `getLanguage`, passes needed arguments
	 * @returns language
	 */
	const getLanguageWithoutParameters = () => {
		const language = getLanguage(languages, defaultGetLanguage);

		/**
		 * This is valid language
		 */
		if (languages.includes(language as Languages)) {
			return language as Languages;
		}

		if (DEV) {
			throw new Error(`Attempt to use unsupported language "${language}". Supported languages: ${languages.join(', ')}.`)
		}

		throw 0;
	};

	/**
	 * 1) Novely rendered using the `initialData`, but you can't start new game or `load` an empty one - this is scary, imagine losing your progress
	 * 2) Actual stored data is loaded, language and etc is changed
	 */
	const initialData: StorageData<Languages, DataScheme> = {
		saves: [],
		data: klona(defaultData),
		meta: [getLanguageWithoutParameters(), DEFAULT_TYPEWRITER_SPEED, 1, 1, 1],
	};

	const storageData = store(initialData);
	const coreData = store<CoreData>({
		dataLoaded: false
	});

	const onDataLoadedPromise = ({ cancelled }: Awaited<ControlledPromise<void>>) => {
		/**
		 * Promise cancelled? Re-subscribe
		 */
		if (cancelled) {
			dataLoaded.promise.then(onDataLoadedPromise);
			return;
		}

		/**
		 * When promise is resolved data is marked loaded
		 */
		coreData.update((data) => {
			data.dataLoaded = true;

			return data;
		})
	};

	dataLoaded.promise.then(onDataLoadedPromise);

	const onStorageDataChange = (value: StorageData) => {
		if (coreData.get().dataLoaded) storage.set(value);
	};

	const throttledOnStorageDataChange = throttle(onStorageDataChange, throttleTimeout);
	const throttledEmergencyOnStorageDataChange = throttle(() => {
		if (saveOnUnload === true || saveOnUnload === 'prod' && !DEV) {
			onStorageDataChange(storageData.get());
		}
	}, 10);

	storageData.subscribe(throttledOnStorageDataChange);

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
		dataLoaded.resolve();

		storageData.set(stored as StorageData<Languages, DataScheme>);
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
	 * Try to save data when page is switched OR is going to be unloaded
	 */
	addEventListener('visibilitychange', onVisibilityChange);
	addEventListener('beforeunload', throttledEmergencyOnStorageDataChange);

	const save = (override = false, type: Save[2][1] = override ? 'auto' : 'manual') => {
		if (!coreData.get().dataLoaded) return;

		/**
		 * When autosaves diabled just return
		 */
		if (!autosaves && type === 'auto') return;

		/**
		 * Saves only possible in main context, so there is no reason for context to be used here
		 */
		const stack = useStack(MAIN_CONTEXT_KEY);
		const current = klona(stack.value);

		storageData.update((prev) => {
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
		if (!coreData.get().dataLoaded) return;

		const save = getDefaultSave(klona(defaultState));

		/**
		 * Initial save is automatic, and should be ignored when autosaves is turned off
		 */
		if (autosaves) {
			storageData.update((prev) => {
				return prev.saves.push(save), prev;
			});
		}

		restore(save);
	};

	/**
	 * Set's the save and restores onto it
	 */
	const set = (save: Save, ctx?: Context) => {
		const stack = useStack(ctx || MAIN_CONTEXT_KEY);

		stack.value = save;

		return restore(save);
	};

	let interacted = 0;

	/**
	 * Restore save or if none is passed then look for latest save, if there is no saves will create a new save
	 */
	const restore = async (save?: Save) => {
		if (!coreData.get().dataLoaded) return;

		let latest = save || storageData.get().saves.at(-1);

		/**
		 * When there is no save, make a new save
		 */
		if (!latest) {
			latest = klona(initial)

			storageData.update((prev) => {
				/**
				 * `latest` will be not undefined because this callback called immediately and variable is not changed
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

		const { queue, skip, skipPreserve } = getActionsFromPath(story, path, false);
		const processor = createQueueProcessor(queue, {
			skip,
			skipPreserve
		});
		const { keep, characters, audio } = processor.keep;

		if (previous) {
			const { queue: prevQueue } = getActionsFromPath(story, previous[0], false);

			for (let i = prevQueue.length - 1; i > queue.length - 1; i--) {
				const element = prevQueue[i];

				/**
				 * Just in case 🤷
				 */
				if (!isAction(element)) {
					continue
				}

				const [action, fn] = element;

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
					context.clearCustom(fn);
				}
			}
		}

		match('clear', [keep, characters, audio], {
			ctx: context,
			data: latest[1]
		});

		const lastQueueItem = queue.at(-1) || [];
		const isLastQueueItemRequiresUserAction = isUserRequiredAction(lastQueueItem)

		await processor.run((item) => {
			if (!latest) return;

			/**
			 * Skip because this item will be ran again by `render(context)` call
			 *
			 * Double call breaks custom actions which depens on promise.
			 *
			 * !todo more detailed analysis
			 */
			if (isLastQueueItemRequiresUserAction && lastQueueItem === item) {
				return
			}

			const [action, ...props] = item;

			return match(action, props, {
				ctx: context,
				data: latest[1]
			});
		});

		context.meta.restoring = context.meta.goingBack = false;

		render(context);
	};

	const refer = (path: Path) => {
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

		return current as Exclude<ValidAction, ValidAction[]>;
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
		ctx.clear(EMPTY_SET, EMPTY_SET, { music: EMPTY_SET, sounds: EMPTY_SET }, noop);
		renderer.ui.showScreen('mainmenu');
		ctx.audio.destroy();

		const [time, type] = current[2];

		/**
		 * This is auto save and belongs to the current session
		 * Player did not interacted or did it once, so this is probably not-needed save
		 */
		if (type === 'auto' && interacted <= 1 && times.has(time)) {
			storageData.update((prev) => {
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
		const { queue } = getActionsFromPath(story, path, true);
		const ctx = renderer.getContext(name);

		/**
		 * Enter restoring mode in action
		 */
		ctx.meta.restoring = true;
		ctx.meta.preview = true;

		const processor = createQueueProcessor(queue, {
			skip: new Set,
		});

		await processor.run(([action, ...props]) => {
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

	const getStateAtCtx = (context: string | Context) => {
		return useStack(context).value[1];
	}

	const getStateFunction = (context: string | Context) => {
		const stack = useStack(context);

		const state = ((value) => {
			const _state = getStateAtCtx(context);

			if (!value) {
				return _state;
			}

			const prev = _state;
			const val = isFunction(value) ? value(prev) : deepmerge(prev, value);

			stack.value[1] = val;

			return undefined;
		}) as StateFunction<State>;

		return state;
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
		getStateFunction,
		languages,
		storageData: storageData as unknown as Stored<StorageData<string, Data>>,
		coreData,
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

	const nextPath = (path: Path) => {
		/**
		 * Last path element
		 */
		const last = path.at(-1);

		if (last && (isNull(last[0]) || last[0] === 'jump') && isNumber(last[1])) {
			last[1]++;
		} else {
			path.push([null, 0]);
		}

		return path;
	}

	const next = (ctx: Context) => {
		const stack = useStack(ctx);
		const path = stack.value[0];

		nextPath(path);
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
		}
	};

	const match = matchAction(matchActionInit, {
		wait({ ctx, push }, [time]) {
			if (ctx.meta.restoring) return;

			setTimeout(push, isFunction(time) ? time(getStateAtCtx(ctx)) : time);
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
				const [lang] = storageData.get().meta;

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
				templateReplace(content, data),
				templateReplace(name, data),
				character,
				emotion,
				forward
			);
		},
		say({ ctx, data }, [character, content]) {
			if (DEV && !characters[character]) {
				throw new Error(`Attempt to call Say action with unknown character "${character}"`);
			}

			match('dialog', [character, content], {
				ctx,
				data
			});
		},
		function({ ctx, push }, [fn]) {
			const { restoring, goingBack, preview } = ctx.meta;

			const result = fn({
				lang: storageData.get().meta[0],
				goingBack,
				restoring,
				preview,
				state: getStateFunction(ctx)
			});

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
				choices.unshift(question as unknown as [TextContent<Languages, State>, ValidAction[], () => boolean]);
				/**
				 * Значит, текст не требуется
				 */
				question = '';
			}

			const transformedChoices = choices.map(([content, action, visible]) => {
				const shown = !visible || visible({
					lang: storageData.get().meta[0],
					state: getStateAtCtx(ctx)
				});

				if (DEV && action.length === 0 && !shown) {
					console.warn(`Choice children should not be empty, either add content there or make item not selectable`)
				}

				return [templateReplace(content, data),  shown] as [string, boolean];
			});

			if (DEV && transformedChoices.length === 0) {
				throw new Error(`Running choice without variants to choose from, look at how to use Choice action properly [https://novely.pages.dev/guide/actions/choice#usage]`)
			}

			ctx.choices(templateReplace(question, data), transformedChoices, (selected) => {
				if (!ctx.meta.preview) {
					enmemory(ctx);
				}

				const stack = useStack(ctx);

				/**
				 * If there is a question, then `index` should be shifted by `1`
				 */
				const offset = isWithoutQuestion ? 0 : 1;

				if (DEV && !transformedChoices[selected]) {
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
				const val = String(condition(getStateAtCtx(ctx)));

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
				templateReplace(question, data),
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
			const string = text.map((content) => templateReplace(content, data)).join(' ');

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
	 * Basically replaces content inside of {{braces}}.
	 */
	const templateReplace = (content: TextContent<Languages, Data>, values?: Data) => {
		const {
			data,
			meta: [lang],
		} = storageData.get();

		// `values` or else global data
		const obj = values || data;
		// string or function value
		const cnt = isFunction(content)
			? content(obj)
			: typeof content === 'string'
				? content
				: content[lang as Languages];

		const str = flattenAllowedContent(
			isFunction(cnt) ? cnt(obj) : cnt,
			obj as State
		);

		const t = translation[lang as Languages];
		const pluralRules = (t.plural || t.actions) && new Intl.PluralRules(t.tag || lang);

		return replaceTranslation(
			str,
			obj,
			t.plural,
			t.actions,
			pluralRules
		);
	};

	const data = ((value) => {
		const _data = storageData.get().data;

		if (!value) return _data;

		const val = isFunction(value) ? value(_data) : deepmerge(_data, value as DataScheme);

		storageData.update((prev) => {
			prev.data = val;

			return prev;
		})

		return undefined;
	}) as StateFunction<DataScheme>;

	return {
		/**
		 * Function to set game script
		 *
		 * @example
		 * ```ts
		 * engine.script({
		 *   start: [
		 *     action.function(() => {})
		 *   ]
		 * })
		 * ```
		 */
		script,
		/**
		 * Get actions
		 *
		 * @example
		 * ```ts
		 * engine.script({
		 *   start: [
		 *     action.function(() => {})
		 *   ]
		 * })
		 * ```
		 */
		action,
		/**
		 * @deprecated Will be removed BUT replaced with state passed into actions as a parameter
		 */
		state: getStateFunction(MAIN_CONTEXT_KEY),
		/**
		 * Store data between games
		 *
		 * @example
		 * ```ts
		 * engine.script({
		 *   start: [
		 *     action.function(() => {
		 *       // Paid content should be purchased only once
		 *       // So it will be available in any save
		 *       data({ paid_content_purchased: true })
		 *     })
		 *   ]
		 * })
		 * ```
		 */
		data,
		/**
		 * @deprecated Renamed into `templateReplace`
		 */
		unwrap(content: TextContent<Languages, DataScheme>) {
			return templateReplace(content as TextContent<Languages, Data>);
		},
		/**
		 * Replaces content inside {{braces}} with using global data
		 * @example
		 * ```ts
		 * data({ name: 'Alexei' })
		 *
		 * templateReplace('{{name}} is our hero')
		 * templateReplace({
		 *  en: (data) => 'Hello, ' + data.name
		 * })
		 * ```
		 */
		templateReplace(content: TextContent<Languages, DataScheme>) {
			return templateReplace(content as TextContent<Languages, Data>)
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
