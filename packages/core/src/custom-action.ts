import type { CustomHandler, CustomHandlerFunctionGetFn, CustomHandlerGetResult, TextContent } from './action';
import type { Context, CustomActionHandle } from './renderer';
import type { Derived, Stored } from './store';
import { CUSTOM_ACTION_MAP } from './shared';
import type { CoreData, Data, Lang, Stack, State, StateFunction } from './types';
import { noop } from './utilities';
import { derive, immutable } from './store';

type CustomActionHolder = {
	/**
	 * Node in which custom action is rendered
	 */
	node: null | HTMLDivElement;
	/**
	 * Custom Handler function itself
	 */
	fn: CustomHandler;
	/**
	 * Local Data
	 */
	localData: any;
	/**
	 * Cleanup function. Provided by custom action.
	 */
	cleanup: () => void;
};

type HandleCustomActionOptions = CustomActionHandle & {
	/**
	 * State Function
	 */
	state: StateFunction<State>;
	/**
	 * Current Game Language
	 */
	lang: Lang;
	/**
	 * Function to get Stack
	 */
	getStack: (ctx: Context) => Stack;
	/**
	 * Template Replace Function
	 */
	templateReplace: (content: TextContent<Lang, Data>, values?: Data) => string;
	/**
	 * Paused Store
	 */
	paused: Derived<boolean>;
};

const createCustomActionNode = (id: string) => {
	const div = document.createElement('div');

	div.setAttribute('data-id', id);

	return div;
};

const getCustomActionHolder = (ctx: Context, fn: CustomHandler) => {
	const cached = CUSTOM_ACTION_MAP.get(ctx.id + fn.key);

	if (cached) {
		return cached;
	}

	const holder = {
		cleanup: noop,
		node: null,
		fn: fn,
		localData: {},
	} satisfies CustomActionHolder;

	CUSTOM_ACTION_MAP.set(ctx.id + fn.key, holder);

	return holder;
};

const handleCustomAction = (
	ctx: Context,
	fn: CustomHandler,
	{
		lang,
		state,
		setMountElement,
		setClear,
		remove: renderersRemove,
		getStack,
		templateReplace,
		paused,
	}: HandleCustomActionOptions,
) => {
	const holder = getCustomActionHolder(ctx, fn);

	const flags = {
		...ctx.meta,
	};

	const getDomNodes = (insert = true): CustomHandlerGetResult<boolean> => {
		if (holder.node || !insert) {
			return {
				element: holder.node,
				root: ctx.root,
			};
		}

		holder.node = insert ? createCustomActionNode(fn.key) : null;

		setMountElement(holder.node);

		return {
			element: holder.node,
			root: ctx.root,
		};
	};

	const clear = (func: typeof noop) => {
		/**
		 * We wrap original cleanup to achieve these goals:
		 *
		 * - when cleaned up function will not be called again
		 * - when cleaned up renderer will get updated element
		 */
		setClear(
			(holder.cleanup = () => {
				func();

				holder.node = null;
				holder.cleanup = noop;

				setMountElement(null);
				setClear(noop);
			}),
		);
	};

	const data = (updatedData?: any) => {
		if (updatedData) {
			return (holder.localData = updatedData);
		}

		return holder.localData;
	};

	const remove = () => {
		holder.cleanup();
		renderersRemove();
	};

	const stack = getStack(ctx);

	const getPath = () => {
		return stack.value[0];
	};

	return fn({
		flags,

		lang,

		state,
		data,

		templateReplace,

		clear,
		remove,

		rendererContext: ctx,

		getDomNodes: getDomNodes as CustomHandlerFunctionGetFn,

		getPath,

		contextKey: ctx.id,

		paused: flags.preview ? immutable(false) : paused,
	});
};

export { getCustomActionHolder, handleCustomAction };
export type { CustomActionHolder, HandleCustomActionOptions };
