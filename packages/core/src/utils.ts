import type { ActionProxyProvider, DefaultActionProxyProvider, CustomHandler, Story, ValidAction, GetActionParameters } from './action';
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
	[Key in keyof DefaultActionProxyProvider]: (params: MatchActionParams, data: Parameters<DefaultActionProxyProvider[Key]>) => void;
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

const isUserRequiredAction = (
	action: keyof MatchActionMapComplete,
	meta: Parameters<MatchActionMapComplete[keyof MatchActionMapComplete]>,
) => {
	return action === 'custom' && meta[0] && (meta[0] as unknown as CustomHandler).requireUserAction;
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

const isAction = (
	element: unknown,
): element is [
	keyof MatchActionMapComplete,
	...Parameters<MatchActionMapComplete[keyof MatchActionMapComplete]>,
] => {
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

const getActionsFromPath = (story: Story, path: Path, raw: boolean = false) => {
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
	const max = path.reduce((acc, [type, val]) => {
		if (isNull(type) && isNumber(val)) {
			return acc + 1;
		}

		return acc;
	}, 0);

	const queue = [] as [any, any][];
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
						queue.push([action, meta]);
					};

					/**
					 * In case we want pure data then just add it
					 */
					if (raw) {
						push();
						continue;
					}

					/**
					 * Экшены, для закрытия которых пользователь должен с ними взаимодействовать
					 * Также в эту группу входят экшены, которые не должны быть вызваны при восстановлении
					 */
					if (isSkippedDuringRestore(action) || isUserRequiredAction(action, meta)) {
						if (index === max && i === val) {
							push();
						}

						continue;
					} else {
						push();
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

	return queue;
}

const createQueueProcessor = (queue: [any, any][]) => {
	const processedQueue: [any, any][] = [];

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

	for (const [i, [action, meta]] of queue.entries()) {
		/**
		 * Keep actually does not keep any actions, clear method only works with things like `dialog` which can blink and etc
		 * So it's just easies to add everything in there
		 */
		keep.add(action);

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

			processedQueue.push([action, meta]);
		} else if (action === 'showCharacter' || action === 'playSound' || action === 'playMusic' || action === 'voice') {
			const closing = getOppositeAction(action);

			const skip = next(i).some(([_action, _meta]) => {
				if (!_meta || !meta) return false;
				if (_meta[0] !== meta[0]) return false;

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
				characters.add(meta[0])
			} else if (action === 'playMusic') {
				audio.music.add(meta[0])
			} else if (action === 'playSound') {
				audio.sound.add(meta[0])
			}

			processedQueue.push([action, meta]);
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
			const skip = next(i).some(([_action], i, array) => action === _action);

			if (skip) continue;

			processedQueue.push([action, meta]);
		} else {
			processedQueue.push([action, meta]);
		}
	}

	const run = async (match: (action: keyof ActionProxyProvider<Record<string, Character>, string, State>, props: any) => Thenable<void>) => {
		for await (const [action, meta] of processedQueue) {
			const result = match(action, meta);

			if (isPromise(result)) {
				await result;
			}
		}

		processedQueue.length = 0;
	}

	const getKeep = () => {
		return {
			keep,
			characters,
			audio
		}
	}

	return {
		run,
		getKeep
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
