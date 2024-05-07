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
	CoreData,
	NovelyInit,
	StateFunction,
	Lang,
	TypeEssentials
} from './types';
import type { Stored } from './store';
import type { Context } from './renderer';
import type { BaseTranslationStrings } from './translations';
import type { ControlledPromise, MatchActionOptions } from './utils';
import {
	matchAction,
	isEmpty,
	getLanguage as defaultGetLanguage,
	throttle,
	isFunction,
	createControlledPromise,
	isSkippedDuringRestore,
	isAction,
	noop,
	flattenStory,
	getActionsFromPath,
	createUseStackFunction,
	createQueueProcessor,
	mapSet,
	isAudioAction,
	isString,
	isImageAsset,
	getResourseType,
	isUserRequiredAction,
	capitalize,
	getIntlLanguageDisplayName,
	createReferFunction,
	exitPath,
	nextPath,
} from './utils';
import { dequal } from 'dequal/lite';
import { store } from './store';
import { deepmerge } from '@novely/deepmerge';
import { klona } from 'klona/json';
import { EMPTY_SET, DEFAULT_TYPEWRITER_SPEED, MAIN_CONTEXT_KEY } from './constants';
import { replace as replaceTranslation, flattenAllowedContent } from './translation';
import { localStorageStorage } from './storage';
import { setupBrowserVisibilityChangeListeners } from './browser';
import pLimit from 'p-limit';

import { DEV } from 'esm-env';
import { STACK_MAP, PRELOADED_ASSETS } from './shared';

const novely = <
	$Language extends string,
	$Characters extends Record<string, Character<$Language>>,
	$State extends State,
	$Data extends Data,
	$Actions extends Record<string, (...args: any[]) => ValidAction>
>({
	characters,
	defaultEmotions = {},
	storage = localStorageStorage({ key: 'novely-game-storage' }),
	storageDelay = Promise.resolve(),
	renderer: createRenderer,
	initialScreen = 'mainmenu',
	translation,
	state: defaultState = {} as $State,
	data: defaultData = {} as $Data,
	autosaves = true,
	migrations = [],
	throttleTimeout = 799,
	getLanguage = defaultGetLanguage,
	overrideLanguage = false,
	askBeforeExit = true,
	preloadAssets = 'lazy',
	parallelAssetsDownloadLimit = 15,
	fetch: request = fetch,
	saveOnUnload = true,
	startKey = 'start'
}: NovelyInit<$Language, $Characters, $State, $Data, $Actions>) => {
	// Local type declaration to not repeat code
	/**
	 * All action functions
	 */
	type Actions = $Actions & ActionProxy<$Characters, $Language, $State>;

	const languages = Object.keys(translation) as $Language[];

	const limitScript = pLimit(1);
	const limitAssetsDownload = pLimit(parallelAssetsDownloadLimit);

	const story: Story = {};

	const times = new Set<number>();

	const ASSETS_TO_PRELOAD = new Set<string>();

	const dataLoaded = createControlledPromise();

	let initialScreenWasShown = false;

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
		get<Action extends keyof Actions & string>(_: unknown, action: Action) {
			if (action in renderer.actions) {
				return renderer.actions[action];
			}

			return (...props: Parameters<Actions[Action]>) => {
				// todo: figure out how to preload audio
				// preloading every languages especially in browser (not in Electron or Tauri, however, this is thill is browser, but there is no huge latency) is not effective

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
				['jump', startKey],
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
		if (languages.includes(language as $Language)) {
			return language as $Language;
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
	const initialData: StorageData<$Language, $Data> = {
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

			if (DEV && !stored) {
				throw new Error('Migrations should return a value.')
			}
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

		storageData.set(stored as StorageData<$Language, $Data>);
	};

	/**
	 * By default this is resolved immediately, but also can be delayed.
	 * I.e. storage has not loaded yet
	 */
	storageDelay.then(getStoredData);

	const initial = getDefaultSave(klona(defaultState));

	const unsubscribeFromBrowserVisibilityChange = setupBrowserVisibilityChangeListeners({
		onChange: throttledEmergencyOnStorageDataChange
	})

	const save = (type: Save[2][1]) => {
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
			const replace = () => {
				prev.saves[prev.saves.length - 1] = current;

				return prev;
			}

			const add = () => {
				prev.saves.push(current);

				return prev;
			}

			/**
			 * Get latest
			 */
			const last = prev.saves.at(-1);

			/**
			 * We cannot compare anything here, thus just reutrn
			 */
			if (!last) return add();

			/**
			 * Update type and time information
			 */
			current[2][0] = intime(Date.now());
			current[2][1] = type;

			const isIdentical = (dequal(last[0], current[0]) && dequal(last[1], current[1]));
			const isLastMadeInCurrentSession = times.has(last[2][0]);

			/**
			 * Even in override is false, we will replace auto save with maual, because they are the same thing basically
			 */
			if (isLastMadeInCurrentSession && last[2][1] === 'auto' && type === 'manual') {
				return replace();
			}

			/**
			 * Player has made a manual save, novely decided to make an auto save
			 * But it is identical to previously created manual save so completely not wanted
			 */
			if (last[2][1] === 'manual' && type === 'auto' && isIdentical) {
				return prev;
			}

			if (isLastMadeInCurrentSession && last[2][1] === 'auto' && type === 'auto') {
				return replace();
			}

			return add();
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
		if (isEmpty(story)) {
			if (DEV) {
				throw new Error('Story is empty. You should call an `enine.script` function [https://novely.pages.dev/guide/story.html]')
			}

			return;
		}

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
		const { run, keep: { keep, characters, audio } } = createQueueProcessor(queue, {
			skip,
			skipPreserve
		});

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
				 *  ['showBackground', ...props]
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

		if (context.meta.goingBack) {
			/**
			 * Context is cleared at exit, so it is dirty only when goingBack
			 */
			match('clear', [keep, characters, audio], {
				ctx: context,
				data: latest[1]
			});
		}

		const lastQueueItem = queue.at(-1) || []
		const lastQueueItemRequiresUserAction = isSkippedDuringRestore(lastQueueItem[0]) || isUserRequiredAction(lastQueueItem)

		await run((item) => {
			if (!latest) return;

			/**
			 * Skip because last item will be ran again by `render(context)` call
			 */
			if (lastQueueItem === item && lastQueueItemRequiresUserAction) {
				return
			}

			const [action, ...props] = item;

			return match(action, props, {
				ctx: context,
				data: latest[1]
			});
		});

		// todo: MAKE SURE THIS IS RIGHT
		if (!context.meta.goingBack) {
			/**
			 * When not goingBack setting restoring to false is required to go forward
			 * Because when restoring action do not call the resolve function which goes to next action but are controlled
			 */
			context.meta.restoring = false;
		}

		render(context);

		context.meta.restoring = context.meta.goingBack = false;
	};

	const refer = createReferFunction(story);

	/**
	 * @param force Force exit
	 */
	const exit = (force = false, saving = true) => {
		/**
		 * Exit only possible in main context
		 */
		const ctx = renderer.getContext(MAIN_CONTEXT_KEY);

		const stack = useStack(ctx);
		const current = stack.value;

		const isSaved = () => {
			const { saves } = storageData.get();
			const [currentPath, currentData] = stack.value;

			return saves.some(([path, data, [date, type]]) => type === 'manual' && times.has(date) && dequal(path, currentPath) && dequal(data, currentData))
		}

		if (interacted > 1 && !force && askBeforeExit && !isSaved()) {
			renderer.ui.showExitPrompt();
			return;
		}

		/**
		 * Imagine list of actions like
		 *
		 * [
		 *  ['input', ...args]
		 *  ['dialog', ...args]
		 * ]
		 *
		 * When you have done with input, you will go to the dialog
		 * And at that moment you exit the game
		 *
		 * What happens? Input was "enmemoried", but dialog not. So when you will open saves, you'll see input action.
		 * We cannot "enmemory" dialog when it's just started, because goingBack is going to last enmemoried item, which will be that dialog, so impossible to go back.
		 *
		 * What we do is enmemory on exit.
		 */
		if (interacted > 0 && saving) {
			save('auto');
		}

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

		const valueBeforeBack = stack.value;

		stack.back();

		/**
		 * There was only one item in the stack so there is no `stack.previous`, also `ctx.meta.goingBack` did not changed
		 */
		if (dequal(valueBeforeBack, stack.value) && !stack.previous) {
			return;
		}

		await restore(stack.value);
	};

	const t = (key: BaseTranslationStrings, lang: string | $Language) => {
		return translation[lang as $Language].internal[key];
	};

	/**
	 * Execute save in context at `name`
	 */
	const preview = async (save: Save, name: string) => {
		if (isEmpty(story)) return;

		const [path, data] = save;

		const { queue } = getActionsFromPath(story, path, true);
		const ctx = renderer.getContext(name);

		/**
		 * Enter restoring mode in action
		 */
		ctx.meta.restoring = true;
		ctx.meta.preview = true;

		const processor = createQueueProcessor(queue, {
			skip: EMPTY_SET,
		});

		useStack(ctx).push(klona(save))

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

	const getLanguageDisplayName = (lang: Lang) => {
		const language = translation[lang as $Language];

		if (DEV && !language) {
			throw new Error(`Attempt to use unsupported language "${language}". Supported languages: ${languages.join(', ')}.`)
		}

		return capitalize(language.nameOverride || getIntlLanguageDisplayName(lang));
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

		getLanguageDisplayName
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

		save('auto');
	};

	const next = (ctx: Context) => {
		const stack = useStack(ctx);
		const path = stack.value[0];

		nextPath(path);
	};

	const matchActionOptions: MatchActionOptions = {
		getContext: renderer.getContext,
		push(ctx) {
			if (ctx.meta.restoring) return;

			next(ctx);
			render(ctx);
		},
		forward(ctx) {
			if (!ctx.meta.preview) enmemory(ctx);

			matchActionOptions.push(ctx);

			if (!ctx.meta.preview) interactivity(true);
		},
	};

	const match = matchAction(matchActionOptions, {
		wait({ ctx, push }, [time]) {
			if (ctx.meta.restoring) return;

			setTimeout(push, isFunction(time) ? time(getStateAtCtx(ctx)) : time);
		},
		showBackground({ ctx, push }, [background]) {
			ctx.background(background);
			push();
		},
		playMusic({ ctx, push }, [source]) {
			ctx.audio.music(source, 'music').play(true);
			push();
		},
		pauseMusic({ ctx, push }, [source]) {
			ctx.audio.music(source, 'music').pause();
			push();
		},
		stopMusic({ ctx, push }, [source]) {
			ctx.audio.music(source, 'music').stop();
			push();
		},
		playSound({ ctx, push }, [source, loop]) {
			ctx.audio.music(source, 'sound').play(loop || false);
			push();
		},
		pauseSound({ ctx, push }, [source]) {
			ctx.audio.music(source, 'sound').pause();
			push();
		},
		stopSound({ ctx, push }, [source]) {
			ctx.audio.music(source, 'sound').stop();
			push();
		},
		voice({ ctx, push }, [source]) {
			const [lang] = storageData.get().meta;

			const audioSource = isString(source) ? source : source[lang]

			/**
			 * We allow ignoring voice because it is okay to not have voiceover for certain languages
			 */
			if (!audioSource) {
				push();
				return;
			}

			ctx.audio.voice(audioSource);
			push();
		},
		stopVoice({ ctx, push }) {
			ctx.audio.voiceStop();
			push();
		},
		showCharacter({ ctx, push }, [character, emotion, className, style]) {
			emotion ??= defaultEmotions[character];

			if (DEV && !emotion) {
				throw new Error(`Attemp to show character "${character}" without emotion provided.`)
			}

			if (!emotion) return;

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
						return block[lang as $Language];
					}
				}

				return c || '';
			})();

			ctx.clearBlockingActionsExceptFor('dialog');

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
				choices.unshift(question as unknown as [TextContent<$Language, State>, ValidAction[], () => boolean]);
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

			ctx.clearBlockingActionsExceptFor('choice');

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

				// todo: calculate offset dynamically

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

			exit(true, false);
		},
		input({ ctx, data, forward }, [question, onInput, setup]) {
			ctx.clearBlockingActionsExceptFor('input');

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

			ctx.clearBlockingActionsExceptFor('text');

			ctx.text(string, forward);
		},
		exit({ ctx, data }) {
			if (ctx.meta.restoring) return;

			const { exitImpossible } = exitPath({
				path: useStack(ctx).value[0],
				refer: refer,
				onExitImpossible: () => {
					match('end', [], {
						ctx,
						data,
					});
				}
			});

			if (!exitImpossible) {
				render(ctx);
			}
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
		} else if (Object.values(story).some((branch) => branch === referred)) {
			/**
			 * Developer might not write the end action on their own, so we will catch situation when there are no other options than end the game.
			 *
			 * There are three options right now.
			 * - We've got to the action — gonna render it
			 * - We've got `undefined`. This means we are tried to go forward, but story array ended already, so we are gonna run exit
			 * - We've got branch of story object. This means we exitied from where it's possible to exit and now we can only end the game
			 */
			match('end', [], {
				ctx,
				data: stack.value[1]
			})
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
	const templateReplace = (content: TextContent<$Language, Data>, values?: Data) => {
		const { data, meta: [lang] } = storageData.get();

		// Object to take values from
		const obj = values || data;

		// String
		const str = flattenAllowedContent(
			!isFunction(content) && !isString(content) ? content[lang] : content,
			obj
		);

		const t = translation[lang];
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

		const val = isFunction(value) ? value(_data) : deepmerge(_data, value as $Data);

		storageData.update((prev) => {
			prev.data = val;

			return prev;
		})

		return undefined;
	}) as StateFunction<$Data>;

	const typeEssentials: TypeEssentials<$Language, $State, $Data, $Characters> = {
		l: null,
		s: null,
		d: null,
		c: null
	}

	const getCurrentStorageData = () => {
		return coreData.get().dataLoaded ? klona(storageData.get()) : null;
	}

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
		 * Used in combination with type utilities
		 *
		 * @example
		 * ```ts
		 * import type { ConditionParams, StateFunction } from '@novely/core';
     *
		 * const conditionCheck = (state: StateFunction<ConditionParams<typeof engine.typeEssintials>>) => {
		 *   return state.age >= 18;
		 * }
		 * ```
		 */
		typeEssentials,
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
		templateReplace(content: TextContent<$Language, $Data>) {
			return templateReplace(content as TextContent<$Language, Data>)
		},
		/**
		 * Cancel data loading, hide UI, ignore page change events
		 * Data updates still will work in case Novely already was loaded
		 */
		destroy() {
			dataLoaded.cancel();

			UIInstance.unmount();

			unsubscribeFromBrowserVisibilityChange();
		},
		/**
		 * Funtion to get current storage data
		 *
		 * @example
		 * ```ts
		 * const currentStorageData = engine.getCurrentStorageData();
		 * ```
		 */
		getCurrentStorageData
	};
};

export { novely };
