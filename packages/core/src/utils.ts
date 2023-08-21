import type { ActionProxyProvider, CustomHandler, ValidAction } from './action';
import type { Character } from './character';
import type { Thenable, Path, PathItem } from './types';
import { BLOCK_STATEMENTS, BLOCK_EXIT_STATEMENTS, SKIPPED_DURING_RESTORE } from './constants';

type MatchActionMap = {
	[Key in keyof ActionProxyProvider<Record<string, Character>>]: (
		data: Parameters<ActionProxyProvider<Record<string, Character>>[Key]>,
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

const vibrate = (pattern: VibratePattern) => {
	try {
		if ('vibrate' in navigator) {
			navigator.vibrate(pattern);
		}
	} catch {}
};

const findLastIndex = <T>(array: T[], fn: (item: T, next?: T) => boolean) => {
	for (let i = array.length - 1; i >= 0; i--) {
		if (fn(array[i], array[i + 1])) {
			return i;
		}
	}

	return -1;
};

const preloadImagesBlocking = (images: Set<string>) => {
	return Promise.allSettled([...images].map(src => {
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
	}));
}

const createDeferredPromise = <T = void>() => {
	let resolve!: (value: T | PromiseLike<T>) => void, reject!: (reason?: any) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res; reject = rej;
	});

	return { resolve, reject, promise }
}

const findLastPathItemBeforeItemOfType = (path: Path, name: PathItem[0]) => {
	const index = findLastIndex(path, ([_name, _value], next) => {
		return isNull(_name) && isNumber(_value) && next != null && next[0] === name;
	});

	return path[index] as undefined | [
		null,
		number
	];
}

const isBlockStatement = (statement: unknown): statement is 'choice' | 'condition' | 'block' => {
	return BLOCK_STATEMENTS.has(statement as any);
}

const isBlockExitStatement = (statement: unknown): statement is "choice:exit" | "condition:exit" | "block:exit" => {
	return BLOCK_EXIT_STATEMENTS.has(statement as any);
}

const isSkippedDurigRestore = (item: unknown): item is "vibrate" | "dialog" | "input" | "choice" | "text" => {
	return SKIPPED_DURING_RESTORE.has(item as any);
}

const noop = () => {}

const isAction = (element: unknown): element is [keyof MatchActionMapComplete, ...Parameters<MatchActionMapComplete[keyof MatchActionMapComplete]>] => {
	return Array.isArray(element) && isString(element[0]);
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
	vibrate,
	findLastIndex,
	preloadImagesBlocking,
	createDeferredPromise,
	findLastPathItemBeforeItemOfType,
	isBlockStatement,
	isBlockExitStatement,
	isSkippedDurigRestore,
	noop,
	isAction
};
