import type { ActionProxy, DefaultActionProxy, CustomHandler, Story, ValidAction, GetActionParameters } from './action';
import type { Character } from './character';
import type { Thenable, Path, PathItem, Save, UseStackFunctionReturnType, StackHolder, State } from './types';
import type { Context, Renderer } from './renderer';
import { BLOCK_STATEMENTS, BLOCK_EXIT_STATEMENTS, SKIPPED_DURING_RESTORE, AUDIO_ACTIONS, HOWLER_SUPPORTED_FILE_FORMATS, SUPPORTED_IMAGE_FILE_FORMATS } from './constants';
import { STACK_MAP } from './shared';

import { DEV } from 'esm-env';

type MatchActionParams = {
	data: Record<string, unknown>
	ctx: Context;

	push: () => void;
	forward: () => void;
}

type MatchActionMap = {
	[Key in keyof DefaultActionProxy]: (params: MatchActionParams, data: Parameters<DefaultActionProxy[Key]>) => void;
};

type MatchActionMapComplete = Omit<MatchActionMap, 'custom'> & {
	custom: (params: MatchActionParams, value: [handler: CustomHandler]) => Thenable<void>;
};

type MatchActionParameters = {
	/**
	 * Name of context or context
	 */
	ctx: string | Context;
	/**
	 * Data from the save
	 */
	data: Record<string, unknown>;
}

type MatchActionInit = {
	push: (ctx: Context) => void;
	forward: (ctx: Context) => void;

	getContext: (name: string) => Context;
}

const matchAction = <M extends MatchActionMapComplete>({ getContext, push, forward }: MatchActionInit, values: M) => {
	return (action: keyof MatchActionMapComplete, props: any, { ctx, data }: MatchActionParameters) => {
		const context = typeof ctx === 'string' ? getContext(ctx) : ctx;

		return values[action]({
			ctx: context,
			data,

			push() {
				if (context.meta.preview) return;

				push(context)
			},
			forward() {
				if (context.meta.preview) return;

				forward(context)
			}
		}, props);
	};
};

const isNumber = (val: unknown): val is number => {
	return typeof val === 'number';
};

const isNull = (val: unknown): val is null => {
	return val === null;
};

const isString = (val: unknown): val is string => {
	return typeof val === 'string';
};

const isFunction = (val: unknown): val is (...parameters: any[]) => any => {
	return typeof val === 'function';
};

const isPromise = (val: unknown): val is Promise<any> => {
	return Boolean(val) && (typeof val === 'object' || isFunction(val)) && isFunction((val as any).then);
};

const isEmpty = (val: unknown): val is Record<PropertyKey, never> => {
	return typeof val === 'object' && !isNull(val) && Object.keys(val).length === 0;
};

const isCSSImage = (str: string) => {
	const startsWith = String.prototype.startsWith.bind(str);

	return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
};

const str = String;

const isUserRequiredAction = ([action, ...meta]: ValidAction) => {
	return Boolean(action === 'custom' && meta[0] && (meta[0] as unknown as CustomHandler).requireUserAction);
};

const getLanguage = (languages: string[]) => {
	let { language } = navigator;

	if (languages.includes(language)) {
		return language;
	} else if (languages.includes((language = language.slice(0, 2)))) {
		return language;
	} else if ((language = languages.find((value) => navigator.languages.includes(value))!)) {
		return language;
	}

	/**
	 * We'v checked the `en-GB` format, `en` format, and maybe any second languages, but there were no matches
	 */
	return languages[0];
};

/**
 * @copyright Techlead LLC
 * @see https://learn.javascript.ru/task/throttle
 */
const throttle = <Fn extends (...args: any[]) => any>(fn: Fn, ms: number) => {
	let throttled = false,
		savedArgs: any,
		savedThis: any;

	function wrapper(this: any, ...args: any[]) {
		if (throttled) {
			savedArgs = args;
			/* eslint-disable @typescript-eslint/no-this-alias */
			savedThis = this;
			return;
		}

		fn.apply(this, args as unknown as any[]);

		throttled = true;

		setTimeout(function () {
			throttled = false;

			if (savedArgs) {
				wrapper.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}

	return wrapper as unknown as (...args: Parameters<Fn>) => void;
};

const findLastIndex = <T>(array: T[], fn: (this: T[], item: T, index: number, array: T[]) => boolean) => {
	for (let i = array.length - 1; i >= 0; i--) {
		if (fn.call(array, array[i], i, array)) {
			return i;
		}
	}

	return -1;
};

/**
 * Using this because `Array.prototype.findLast` has not enough support
 * @see https://caniuse.com/?search=findLast
 */
const findLast = <T>(array: T[], fn: (this: T[], item: T, index: number, array: T[]) => boolean) => {
	return array[findLastIndex(array, fn)];
}

type ControlledPromise<T> = Promise<
	| {
			value: T;
			cancelled: false;
	  }
	| {
			value: null;
			cancelled: true;
	  }
>;

type ControlledPromiseObj<T> = {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;

	promise: ControlledPromise<T>;

	cancel: () => void;
};

const createControlledPromise = <T = void>() => {
	const object = {
		resolve: null,
		reject: null,

		promise: null,

		cancel: null,
	} as unknown as ControlledPromiseObj<T>;

	const init = () => {
		const promise = new Promise((resolve, reject) => {
			object.reject = reject;
			object.resolve = (value) => {
				resolve({ cancelled: false, value });
			};

			object.cancel = () => {
				resolve({ cancelled: true, value: null });
				init();
			};
		});

		object.promise = promise as ControlledPromise<T>;
	};

	return init(), object;
};

const findLastPathItemBeforeItemOfType = (path: Path, name: PathItem[0]) => {
	const index = findLastIndex(path, ([_name, _value], i, array) => {
		const next = array[i + 1];

		return isNull(_name) && isNumber(_value) && next != null && next[0] === name;
	});

	return path[index] as undefined | [null, number];
};

const isBlockStatement = (statement: unknown): statement is 'choice' | 'condition' | 'block' => {
	return BLOCK_STATEMENTS.has(statement as any);
};

const isBlockExitStatement = (
	statement: unknown,
): statement is 'choice:exit' | 'condition:exit' | 'block:exit' => {
	return BLOCK_EXIT_STATEMENTS.has(statement as any);
};

const isSkippedDuringRestore = (item: unknown): item is 'vibrate' | 'dialog' | 'input' | 'choice' | 'text' => {
	return SKIPPED_DURING_RESTORE.has(item as any);
};

const isAudioAction = (action: unknown): action is   'playMusic' | 'stopMusic' | 'playSound' | 'stopSound' | 'voice' | 'stopVoice' => {
	return AUDIO_ACTIONS.has(action as any);
}

const noop = () => {};

const isAction = (element: unknown,): element is Exclude<ValidAction, ValidAction[]> => {
	return Array.isArray(element) && isString(element[0]);
};

/**
 * Transforms `(ValidAction | ValidAction[])[]` to `ValidAction[]`
 */
const flattenStory = (story: Story) => {
	const entries = Object.entries(story).map(([name, items]) => {
		const flat = (item: (ValidAction | ValidAction[])[]): ValidAction[] => {
			return item.flatMap((data) => {
				const type = data[0];

				/**
				 * This is not just an action like `['name', ...arguments]`, but an array of actions
				 */
				if (Array.isArray(type)) return flat(data as ValidAction[]);

				return [data as ValidAction];
			});
		};

		return [name, flat(items)];
	});

	return Object.fromEntries(entries);
};

/**
 * A wrapper on `fn` to make it run only once!
 * @param fn Function that needed to run no more than one time
 */
const once = (fn: () => void) => {
	let ran = false;

	return () => {
		if (ran) return;

		ran = true;
		fn();
	};
};

const isExitImpossible = (path: Path) => {
	const blockStatements = path.filter(([item]) => isBlockStatement(item));
	const blockExitStatements = path.filter(([item]) => isBlockExitStatement(item));

	/**
	 * There were no blocks nor exits from blocks
	 */
	if (blockStatements.length === 0 && blockExitStatements.length === 0) {
		return true;
	}

	/**
	 * There is block that can be exited
	 */
	if (blockStatements.length > blockExitStatements.length) {
		return false;
	}

	return !blockExitStatements.every(([name], i) => name && name.startsWith(blockStatements[i][0]!))
}

const getOppositeAction = (action: 'showCharacter' | 'playSound' | 'playMusic' | 'voice' | any) => {
	const MAP = {
		'showCharacter': 'hideCharacter',
		'playSound': 'stopSound',
		'playMusic': 'stopMusic',
		'voice': 'stopVoice'
	} as const;

	return MAP[action as keyof typeof MAP];
}

/**
 * @param story A story object
 * @param path A path by that actions will be gathered
 * @param filter true — actions that should be skipped would not be returned
 */
const getActionsFromPath = (story: Story, path: Path, filter: boolean) => {
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
	 * Skipped action that should be preserved
	 * @todo Give a better name
	 */
	let skipPreserve: Exclude<ValidAction, ValidAction[]> | undefined = undefined;
	/**
	 * Actions that are either considered user action or skipped during restore process
	 */
	const skip = new Set<Exclude<ValidAction, ValidAction[]>>()

	/**
	 * Cound of items of type `[null, int]`
	 */
	const max = path.reduce((acc, [type, val]) => {
		if (isNull(type) && isNumber(val)) {
			return acc + 1;
		}

		return acc;
	}, 0);

	const queue = [] as Exclude<ValidAction, ValidAction[]>[];
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

					const [action] = item;

					const last = index === max && i === val;
					const shouldSkip = isSkippedDuringRestore(action) || isUserRequiredAction(item);

					if (shouldSkip) {
						skip.add(item);
					}

					if (shouldSkip && last) {
						skipPreserve = item;
					}

					if (filter && shouldSkip && !last) {
						continue;
					} else {
						queue.push(item);
					}
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

	return {
		queue,
		skip,
		skipPreserve
	};
}

type QueueProcessorOptions = {
	skip: Set<Exclude<ValidAction, ValidAction[]>>;
	skipPreserve?: Exclude<ValidAction, ValidAction[]> | undefined
}

const createQueueProcessor = (queue: Exclude<ValidAction, ValidAction[]>[], options: QueueProcessorOptions) => {
	const processedQueue: Exclude<ValidAction, ValidAction[]>[] = [];

	const keep = new Set();
	const characters = new Set();
	const audio = {
		music: new Set(),
		sound: new Set()
	};

	/**
	 * Get the next actions array.
	 */
	const next = (i: number) => queue.slice(i + 1);

	for (const [i, item] of queue.entries()) {
		const [action, ...params] = item;

		/**
		 * Clear method only works with things like `dialog` which can blink and etc
		 * So it's just easier to add everything in there
		 */
		keep.add(action);

		if (options.skip.has(item) && item !== options.skipPreserve) {
			continue;
		}

		if (action === 'function' || action === 'custom') {
			/**
			 * When `callOnlyLatest` is `true`
			 */
			if (action === 'custom' && (params[0] as CustomHandler).callOnlyLatest) {
				/**
				 * We'll calculate it is `latest` or not
				 */
				const notLatest = next(i).some(([, func]) => {
					if (!isFunction(func)) return false;

					const c0 = func as CustomHandler;
					const c1 = params[0] as CustomHandler;

					// Also check for `undefined` so if two id's were undefined it would not be true
					const isIdenticalID = Boolean(c0.id && c1.id && c0.id === c1.id);
					const isIdenticalByReference = c0 === c1;

					return isIdenticalID || isIdenticalByReference || str(c0) === str(c1);
				});

				if (notLatest) continue;
			}

			processedQueue.push(item);
		} else if (action === 'showCharacter' || action === 'playSound' || action === 'playMusic' || action === 'voice') {
			const closing = getOppositeAction(action);

			const skip = next(i).some(([_action, target]) => {
				if (target !== params[0]) {
					return false;
				}

				/**
				 * It either will be closed OR same action will be ran again
				 */
				return _action === closing || _action === action;
			});

			if (skip) continue;

			/**
			 * Actually, we do not need check above to add there things to keep because if something was hidden already we could not keep it visible
			 */
			if (action === 'showCharacter') {
				characters.add(params[0])
			} else if (action === 'playMusic') {
				audio.music.add(params[0])
			} else if (action === 'playSound') {
				audio.sound.add(params[0])
			}

			processedQueue.push(item);
		} else if (action === 'showBackground' || action === 'preload') {
			const skip = next(i).some(([_action]) => action === _action);

			if (skip) continue;

			processedQueue.push(item);
		} else if (action === 'animateCharacter') {
			const skip = next(i).some(([_action, character], j, array) => {
				/**
				 * Same character will be animated again. Ignore.
				 */
				if (action === _action && character === params[0]) {
					return true;
				}

				const next = array.slice(j);

				const characterWillAnimate = next.some(([__action, __character]) => action === __action);
				const hasBlockingActions = next.some((item) => options.skip.has(item))

				/**
				 * This is not a best check.
				 *
				 * @todo: make two animations for two different characters animate when not separeted by "blocking actions"
				 */
				return characterWillAnimate && hasBlockingActions
			});

			if (skip) continue;

			processedQueue.push(item);
		} else {
			processedQueue.push(item);
		}
	}

	const run = async (match: (action: keyof ActionProxy<Record<string, Character>, string, State>, props: any) => Thenable<void>) => {
		for await (const [action, ...params] of processedQueue) {
			const result = match(action, params);

			if (isPromise(result)) {
				await result;
			}
		}

		processedQueue.length = 0;
	}

	return {
		run,
		keep: {
			keep,
			characters,
			audio
		}
	}
}

const getStack = (ctx: Context) => {
	const { id } = ctx;
	const cached = STACK_MAP.get(id);

	if (cached) return cached;

	const stack = [] as unknown as StackHolder;

	STACK_MAP.set(id, stack);

	return stack;
}

const createUseStackFunction = (renderer: Renderer) => {
	const useStack = (context: Context | string): UseStackFunctionReturnType => {
		const ctx = typeof context === 'string' ? renderer.getContext(context) : context;
		const stack = getStack(ctx);

		return {
			get previous() {
				return stack.previous;
			},
			get value() {
				return stack.at(-1)!;
			},
			set value(value) {
				stack[stack.length - 1] = value;
			},

			back() {
				if (stack.length > 1) {
					stack.previous = stack.pop();
					ctx.meta.goingBack = true;
				}
			},
			push(value: Save) {
				stack.push(value);
			},
			clear() {
				stack.length = 0;
				stack.length = 1;
			}
		}
	}

	return useStack;
}

const mapSet = <T, K>(set: Set<T>, fn: (value: T, index: number, array: T[]) => K): K[] => {
	return [...set].map(fn);
}

const isImageAsset = (asset: unknown): asset is string => {
	return isString(asset) && isCSSImage(asset)
}

const getUrlFileExtension = (address: string) => {
	try {
		const { pathname } = new URL(address, location.href);

		/**
		 * By using pathname we remove search params from URL, but some things are still preserved
		 *
		 * Imagine pathname like `image.png!private:1230`
		 * Yes, very unlikely to happen, but it is possible
		 */
		return pathname.split('.').at(-1)!.split('!')[0].split(':')[0];
	} catch (error) {
		if (DEV) {
			console.error(new Error(`Could not construct URL "${address}".`, { cause: error }))
		}

		return ''
	}
}

const fetchContentType = async (request: typeof fetch, url: string) => {
	try {
		const response = await request(url, {
			method: 'HEAD'
		});

		return response.headers.get('Content-Type') || '';
	} catch (error) {
		if (DEV) {
			console.error(new Error(`Failed to fetch file at "${url}"`, { cause: error }))
		}

		return '';
	}
}

const getResourseType = async (request: typeof fetch, url: string) => {
	const extension = getUrlFileExtension(url);

	if (HOWLER_SUPPORTED_FILE_FORMATS.has(extension as any)) {
		return 'audio'
	}

	if (SUPPORTED_IMAGE_FILE_FORMATS.has(extension as any)) {
		return 'image'
	}

	/**
	 * If checks above didn't worked we will fetch content type
	 * This might not work because of CORS
	 */
	const contentType = await fetchContentType(request, url);

	if (contentType.includes('audio')) {
		return 'audio'
	}

	if (contentType.includes('image')) {
		return 'image'
	}

	return 'other'
}

export {
	matchAction,
	isNumber,
	isNull,
	isString,
	isPromise,
	isEmpty,
	isCSSImage,
	str,
	isUserRequiredAction,
	getLanguage,
	throttle,
	isFunction,
	findLastIndex,
	findLast,
	createControlledPromise,
	findLastPathItemBeforeItemOfType,
	isBlockStatement,
	isBlockExitStatement,
	isSkippedDuringRestore,
	noop,
	isAction,
	isAudioAction,
	flattenStory,
	once,
	isExitImpossible,
	getOppositeAction,
	getActionsFromPath,
	createQueueProcessor,
	getStack,
	createUseStackFunction,
	mapSet,
	isImageAsset,
	getUrlFileExtension,
	getResourseType
};

export type { MatchActionInit, ControlledPromise, MatchActionMapComplete }
