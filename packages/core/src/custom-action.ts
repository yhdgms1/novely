import type { CustomHandler, CustomHandlerFunctionGetFn, CustomHandlerGetResult, TextContent } from './action';
import type { Context, CustomActionHandle } from './renderer';
import type { Derived } from './store';
import { CUSTOM_ACTION_CLEANUP_MAP, CUSTOM_ACTION_MAP } from './shared';
import type { Data, Lang, Stack, State, StateFunction } from './types';
import { noop } from './utilities';
import { immutable } from './store';
import { once } from 'es-toolkit/function';

type CleanupFn = () => void;

type CustomActionCleanupHolderItem = {
	fn: CustomHandler;
	list: CleanupFn[];
	node: CleanupFn;
};

type CustomActionCleanupHolder = CustomActionCleanupHolderItem[];

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
		node: null,
		fn: fn,
		localData: {},
	} satisfies CustomActionHolder;

	CUSTOM_ACTION_MAP.set(ctx.id + fn.key, holder);

	return holder;
};

const getCustomActionCleanupHolder = (ctx: Context) => {
	const existing = CUSTOM_ACTION_CLEANUP_MAP.get(ctx.id);

	if (existing) {
		return existing;
	}

	const holder: CustomActionCleanupHolder = [];

	CUSTOM_ACTION_CLEANUP_MAP.set(ctx.id, holder);

	return holder;
};

const cleanCleanupSource = ({ list }: CustomActionCleanupHolderItem) => {
	while (list.length) {
		try {
			list.pop()!();
		} catch (e) {
			console.error(e);
		}
	}
};

const handleCustomAction = (
	ctx: Context,
	fn: CustomHandler,
	{
		lang,
		state,
		setMountElement,
		remove: renderersRemove,
		getStack,
		templateReplace,
		paused,
	}: HandleCustomActionOptions,
) => {
	const holder = getCustomActionHolder(ctx, fn);
	const cleanupHolder = getCustomActionCleanupHolder(ctx);

	const cleanupNode = () => {
		if (!cleanupHolder.some((item) => item.fn.id === fn.id && item.fn.key === fn.key)) {
			holder.node = null;
			setMountElement(null);
		}
	};

	const cleanupSource: CustomActionCleanupHolderItem = {
		fn,
		list: [],
		node: cleanupNode,
	};

	cleanupHolder.push(cleanupSource);

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
		cleanupSource.list.push(once(func));
	};

	const data = (updatedData?: any) => {
		if (updatedData) {
			return (holder.localData = updatedData);
		}

		return holder.localData;
	};

	const remove = () => {
		cleanCleanupSource(cleanupSource);
		cleanupSource.node();

		renderersRemove();
	};

	const stack = getStack(ctx);

	const getSave = () => {
		return stack.value;
	};

	return fn({
		flags: ctx.meta,

		lang,

		state,
		data,

		dataAtKey: (key) => CUSTOM_ACTION_MAP.get(ctx.id + key)?.localData || null,

		templateReplace,

		clear,
		remove,

		rendererContext: ctx,

		getDomNodes: getDomNodes as CustomHandlerFunctionGetFn,

		getSave,

		contextKey: ctx.id,

		paused: ctx.meta.preview ? immutable(false) : paused,
	});
};

export { getCustomActionHolder, handleCustomAction, getCustomActionCleanupHolder, cleanCleanupSource };
export type { CustomActionHolder, CustomActionCleanupHolder, HandleCustomActionOptions, CleanupFn };
