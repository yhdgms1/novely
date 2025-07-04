import type {
	CustomHandler,
	CustomHandlerFunctionGetFn,
	CustomHandlerGetResult,
	TextContent,
	OnForwardFn,
} from './action';
import type { Context, CustomActionHandle } from './renderer';
import type { Derived } from './store';
import { CUSTOM_ACTION_INSTANCES_MAP, CUSTOM_ACTION_MAP } from './shared';
import type { Data, Lang, Stack, State, StateFunction } from './types';
import { noop } from './utilities';
import { immutable } from './store';
import { once } from 'es-toolkit/function';
import type { Ticker } from './ticker';

type CleanupFn = () => void;

type CustomActionInstance = {
	fn: CustomHandler;
	disposed: boolean;

	list: CleanupFn[];
	node: CleanupFn;

	onBack: () => void;
	onForward: OnForwardFn;
};

type CustomActionInstances = CustomActionInstance[];

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
	/**
	 * Ticker
	 */
	ticker: Ticker;
	/**
	 * Fetching function
	 */
	request: typeof fetch;
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

const getCustomActionInstances = (ctx: Context) => {
	const existing = CUSTOM_ACTION_INSTANCES_MAP.get(ctx.id);

	if (existing) {
		return existing;
	}

	const array: CustomActionInstances = [];

	CUSTOM_ACTION_INSTANCES_MAP.set(ctx.id, array);

	return array;
};

const cleanInstance = ({ list }: CustomActionInstance) => {
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
		ticker,
		request,
	}: HandleCustomActionOptions,
) => {
	const holder = getCustomActionHolder(ctx, fn);
	const instances = getCustomActionInstances(ctx);

	const cleanupNode = () => {
		if (!instances.some((item) => item.fn.id === fn.id && item.fn.key === fn.key)) {
			holder.node = null;
			setMountElement(null);
		}
	};

	const dispose = () => {
		if (instance.disposed) return;

		ticker.detach();

		instance.onBack = noop;
		instance.onForward = noop;

		instance.disposed = true;
	};

	const instance: CustomActionInstance = {
		fn,
		disposed: false,

		list: [dispose],
		node: cleanupNode,

		onBack: noop,
		onForward: noop,
	};

	instances.push(instance);

	const getDomNodes = (insert = true): CustomHandlerGetResult<boolean> => {
		if (holder.node || !insert) {
			setMountElement(holder.node);

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
		instance.list.push(once(func));
	};

	const data = (updatedData?: any) => {
		if (updatedData) {
			return (holder.localData = updatedData);
		}

		return holder.localData;
	};

	const remove = () => {
		cleanInstance(instance);

		// When requested not hestitate
		holder.node = null;
		setMountElement(null);

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

		ticker,

		request,

		onBack: (fn) => {
			instance.onBack = fn;
		},
		onForward: (fn) => {
			instance.onForward = fn;
		},
	});
};

export { getCustomActionHolder, handleCustomAction, getCustomActionInstances, cleanInstance };
export type {
	CustomActionHolder,
	CustomActionInstance,
	CustomActionInstances,
	HandleCustomActionOptions,
	CleanupFn,
};
