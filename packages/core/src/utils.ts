import type { ActionProxyProvider, CustomHandler, Story, ValidAction, GetActionParameters } from './action';
import type { Character } from './character';
import type { Thenable, Path, PathItem } from './types';
import { BLOCK_STATEMENTS, BLOCK_EXIT_STATEMENTS, SKIPPED_DURING_RESTORE } from './constants';

type MatchActionMap = {
	[Key in keyof ActionProxyProvider<Record<string, Character>, string>]: (
		data: Parameters<ActionProxyProvider<Record<string, Character>, string>[Key]>,
	) => void;
};

type MatchActionMapComplete = Omit<MatchActionMap, 'custom'> & {
	custom: (value: [handler: CustomHandler]) => Thenable<void>;
};

const matchAction = <M extends MatchActionMapComplete>(values: M) => {
	return (action: keyof MatchActionMap, props: any) => {
		return values[action](props);
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

const findLastIndex = <T>(array: T[], fn: (item: T, next?: T) => boolean) => {
	for (let i = array.length - 1; i >= 0; i--) {
		if (fn(array[i], array[i + 1])) {
			return i;
		}
	}

	return -1;
};

const findLast = <T>(array: T[], fn: (item: T, next?: T) => boolean) => {
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

		// @ts-expect-error Types does not match and this is expected
		object.promise = promise;
	};

	return init(), object;
};

const findLastPathItemBeforeItemOfType = (path: Path, name: PathItem[0]) => {
	const index = findLastIndex(path, ([_name, _value], next) => {
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

const getActionsFromPath = (story: Story, path: Path) => {
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

	return {
		keep,
		queue
	}
}

const processQueue = async (queue: [any, any][], match: (action: keyof ActionProxyProvider<Record<string, Character>, string>, props: any) => Thenable<void>) => {
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
	flattenStory,
	once,
	isExitImpossible,
	getOppositeAction,
	getActionsFromPath,
	processQueue
};
