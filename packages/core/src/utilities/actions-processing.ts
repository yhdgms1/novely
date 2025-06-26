import type { Story, ValidAction, CustomHandler, GetActionParameters } from '../action';
import type { CloneFN, Path, PathItem, Thenable } from '../types';
import type { NovelyAsset } from '../types';
import {
	isNull,
	isNumber,
	isAction,
	isSkippedDuringRestore,
	isUserRequiredAction,
	isPromise,
	isBlockExitStatement,
	isBlockStatement,
	isBlockingAction,
} from './assertions';
import { unwrapAsset } from '../asset';
import { DEV } from 'esm-env';

// #region Is Exit Impossible
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

	return !blockExitStatements.every(([name], i) => name && name.startsWith(blockStatements[i][0]!));
};
// #endregion

// #region Refer
type CreateReferFunctionParams = {
	story: Story;
	onUnknownSceneHit: (scene: string) => Thenable<void>;
};

const createReferFunction = ({ story, onUnknownSceneHit }: CreateReferFunctionParams) => {
	const refer = async (path: Path) => {
		/**
		 * Are we ready to return a value.
		 * We need to know are there any "unknown" scenes or not
		 */
		const { promise: ready, resolve: setReady } = Promise.withResolvers<boolean>();

		let current: any = story;
		let precurrent: any = story;

		const blocks: any[] = [];

		const refer = async () => {
			for (const [type, val] of path) {
				if (type === 'jump') {
					if (!current[val]) {
						setReady(true);
						await onUnknownSceneHit(val);
					}

					if (DEV && !story[val]) {
						throw new Error(`Attempt to jump to unknown scene "${val}"`);
					}

					if (DEV && story[val].length === 0) {
						throw new Error(`Attempt to jump to empty scene "${val}"`);
					}

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

			setReady(false);

			return current as Exclude<ValidAction, ValidAction[]>;
		};

		const value = refer();
		const found = await ready;

		return {
			found,
			value,
		};
	};

	const referGuarded = async (path: Path) => {
		return await (await refer(path)).value;
	};

	return {
		refer,
		referGuarded,
	};
};

type GuardedReferFunction = ReturnType<typeof createReferFunction>['referGuarded'];

// #endregion

type ExitPathConfig = {
	path: Path;
	refer: GuardedReferFunction;

	onExitImpossible?: () => void;
};

// #region Exit Path
const exitPath = async ({ path, refer, onExitImpossible }: ExitPathConfig) => {
	const last = path.at(-1);
	const ignore: ('choice:exit' | 'condition:exit' | 'block:exit')[] = [];

	let wasExitImpossible = false;

	/**
	 * - should be an array
	 * - first element is action name
	 */
	if (!isAction(await refer(path))) {
		if (last && isNull(last[0]) && isNumber(last[1])) {
			last[1]--;
		} else {
			path.pop();
		}
	}

	if (isExitImpossible(path)) {
		const referred = await refer(path);

		if (isAction(referred) && isSkippedDuringRestore(referred[0])) {
			onExitImpossible?.();
		}

		wasExitImpossible = true;

		return {
			exitImpossible: wasExitImpossible,
		};
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
		if (!isAction(await refer(path))) {
			path.pop();
			continue;
		}

		break;
	}

	return {
		exitImpossible: wasExitImpossible,
	};
};
// #endregion

// #region Next Path
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
};
// #endregion

// #region Collect Actions Before Blocking Action
type CollectActionsBeforeBlockingActionOptions = {
	path: Path;
	refer: GuardedReferFunction;
	clone: CloneFN;
};

const collectActionsBeforeBlockingAction = async ({
	path,
	refer,
	clone,
}: CollectActionsBeforeBlockingActionOptions) => {
	const collection: Exclude<ValidAction, ValidAction[]>[] = [];

	let action = await refer(path);

	while (true) {
		if (action == undefined) {
			const { exitImpossible } = await exitPath({
				path,
				refer,
			});

			if (exitImpossible) {
				break;
			}
		}

		if (!action) {
			break;
		}

		if (isBlockingAction(action)) {
			const [name, ...props] = action;

			if (name === 'choice') {
				const choiceProps = props as unknown as GetActionParameters<'Choice'>;

				for (let i = 0; i < choiceProps.length; i++) {
					const branchContent = choiceProps[i];

					/**
					 * This is a title
					 */
					if (!Array.isArray(branchContent)) continue;

					const virtualPath = clone(path);

					virtualPath.push(['choice', i], [null, 0]);

					const innerActions = await collectActionsBeforeBlockingAction({
						path: virtualPath,
						refer,
						clone,
					});

					collection.push(...innerActions);
				}
			} else if (name === 'condition') {
				const conditionProps = props as unknown as GetActionParameters<'Condition'>;
				const conditions = Object.keys(conditionProps[1]);

				for (const condition of conditions) {
					const virtualPath = clone(path);

					virtualPath.push(['condition', condition], [null, 0]);

					const innerActions = await collectActionsBeforeBlockingAction({
						path: virtualPath,
						refer,
						clone,
					});

					collection.push(...innerActions);
				}
			}

			break;
		}

		collection.push(action);

		/**
		 * These special actions requires path change
		 */
		if (action[0] === 'jump') {
			path = [
				['jump', action[1]],
				[null, 0],
			];
		} else if (action[0] == 'block') {
			path.push(['block', action[1]], [null, 0]);
		} else {
			nextPath(path);
		}

		action = await refer(path);
	}

	return collection;
};
// #endregion

// #region Find Last Path Item Before Item Of Type
const findLastPathItemBeforeItemOfType = (path: Path, name: PathItem[0]) => {
	const item = path.findLast(([_name, _value], i, array) => {
		const next = array[i + 1];

		return isNull(_name) && isNumber(_value) && next != null && next[0] === name;
	});

	return item as undefined | [null, number];
};
// #endregion

// #region Get Opposite Action
const getOppositeAction = (action: 'showCharacter' | 'playSound' | 'playMusic' | 'voice' | any) => {
	const MAP = {
		showCharacter: 'hideCharacter',
		playSound: 'stopSound',
		playMusic: 'stopMusic',
		voice: 'stopVoice',
	} as const;

	return MAP[action as keyof typeof MAP];
};
// #endregion

// #region Get Actions From Path
type GetActionsFromPathParams = {
	/**
	 * A story object
	 */
	story: Story;
	/**
	 *  A path by that actions will be gathered
	 */
	path: Path;
	/**
	 * true — actions that should be skipped would not be returned
	 */
	filter: boolean;
	referGuarded: GuardedReferFunction;
};

const getActionsFromPath = async ({ story, path, filter, referGuarded }: GetActionsFromPathParams) => {
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
	let ignoreNestedBefore: null | PathItem[0] = null;
	/**
	 * Current item of type `[null, int]`
	 */
	let index = 0;
	/**
	 * Skipped action that should be preserved
	 */
	let skipPreserve: Exclude<ValidAction, ValidAction[]> | undefined = undefined;
	/**
	 * Actions that are either considered user action or skipped during restore process
	 */
	const skip = new Set<Exclude<ValidAction, ValidAction[]>>();

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

	// Will guard future usage
	await referGuarded(path);

	for (const [type, val] of path) {
		if (type === 'jump') {
			precurrent = story;
			current = current[val];
		} else if (type === null) {
			precurrent = current;

			if (isNumber(val)) {
				index++;

				let startIndex = 0;

				if (ignoreNestedBefore) {
					const prev = findLastPathItemBeforeItemOfType(path.slice(0, index), ignoreNestedBefore);

					if (prev) {
						startIndex = prev[1];
						ignoreNestedBefore = null;
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
			ignoreNestedBefore = type.slice(0, -5) as PathItem[0];
		}
	}

	return {
		queue,
		skip,
		skipPreserve,
	};
};
// #endregion

// #region Queue Processor
type QueueProcessorOptions = {
	skip: Set<Exclude<ValidAction, ValidAction[]>>;
	skipPreserve?: Exclude<ValidAction, ValidAction[]> | undefined;
};

const createQueueProcessor = (queue: Exclude<ValidAction, ValidAction[]>[], options: QueueProcessorOptions) => {
	const processedQueue: Exclude<ValidAction, ValidAction[]>[] = [];

	const keep = new Set();
	const characters = new Set();
	const audio = {
		music: new Set(),
		sounds: new Set(),
	};

	/**
	 * Get the next actions array.
	 */
	const next = (i: number) => queue.slice(i + 1);

	for (const [i, item] of queue.entries()) {
		const [action, ...params] = item;

		if (options.skip.has(item) && item !== options.skipPreserve) {
			continue;
		}

		keep.add(action);

		if (action === 'function' || action === 'custom') {
			if (action === 'custom') {
				const fn = params[0] as CustomHandler;

				if (fn.callOnlyLatest) {
					const notLatest = next(i).some(([name, func]) => {
						if (name !== 'custom') return;

						// Checks for `undefined`. In case two id's are undefined it would not be true
						const isIdenticalId = Boolean(func.id && fn.id && func.id === fn.id);
						const isIdenticalByReference = func === fn;
						const isIdenticalByCode = String(func) === String(fn);

						return isIdenticalId || isIdenticalByReference || isIdenticalByCode;
					});

					if (notLatest) continue;
				} else if (fn.skipOnRestore) {
					if (fn.skipOnRestore(next(i))) {
						continue;
					}
				}
			}

			processedQueue.push(item);
		} else if (action === 'playSound') {
			const closing = getOppositeAction(action);

			const skip = next(i).some((item) => {
				if (isUserRequiredAction(item) || isSkippedDuringRestore(item[0])) {
					return true;
				}

				const [_action, target] = item;

				if (target !== params[0]) {
					return false;
				}

				return _action === closing || _action === action;
			});

			if (skip) continue;

			audio.sounds.add(unwrapAsset(params[0] as NovelyAsset));
			processedQueue.push(item);
		} else if (action === 'showCharacter' || action === 'playMusic' || action === 'voice') {
			const closing = getOppositeAction(action);

			const skip = next(i).some(([_action, target]) => {
				if (target !== params[0] && action !== 'voice') {
					return false;
				}

				const musicWillBePaused = action === 'playMusic' && _action === 'pauseMusic';

				/**
				 * It either will be closed OR same action will be ran again
				 */
				return musicWillBePaused || _action === closing || _action === action;
			});

			if (skip) continue;

			/**
			 * Actually, we do not need check above to add there things to keep because if something was hidden already we could not keep it visible
			 */
			if (action === 'showCharacter') {
				characters.add(params[0]);
			} else if (action === 'playMusic') {
				audio.music.add(unwrapAsset(params[0] as NovelyAsset));
			}

			processedQueue.push(item);
		} else if (action === 'showBackground' || action === 'preload') {
			const skip = next(i).some(([_action]) => action === _action);

			if (skip) continue;

			processedQueue.push(item);
		} else if (action === 'animateCharacter') {
			const skip = next(i).some(([_action, character], j, array) => {
				// Same character will be animated again.
				if (action === _action && character === params[0]) {
					return true;
				}

				const next = array.slice(j);

				const characterWillAnimate = next.some(([__action, __character]) => action === __action);
				const hasBlockingActions = next.some((item) => options.skip.has(item));

				const differentCharacterWillAnimate =
					!hasBlockingActions &&
					next.some(([__action, __character]) => __action === action && __character !== params[0]);

				// todo
				return (characterWillAnimate && hasBlockingActions) || differentCharacterWillAnimate;
			});

			if (skip) continue;

			processedQueue.push(item);
		} else {
			processedQueue.push(item);
		}
	}

	const run = async (match: (item: Exclude<ValidAction, ValidAction[]>) => Thenable<void>) => {
		for (const item of processedQueue) {
			const result = match(item);

			if (isPromise(result)) {
				await result;
			}
		}

		processedQueue.length = 0;
	};

	return {
		run,
		keep: {
			keep,
			characters,
			audio,
		},
	};
};
// #endregion

export {
	findLastPathItemBeforeItemOfType,
	getActionsFromPath,
	getOppositeAction,
	createQueueProcessor,
	createReferFunction,
	exitPath,
	collectActionsBeforeBlockingAction,
	nextPath,
	isExitImpossible,
};

export type { GuardedReferFunction };
