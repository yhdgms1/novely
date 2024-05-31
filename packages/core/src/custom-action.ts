import type { CustomHandler, CustomHandlerGetResult, CustomHandlerFunctionGetFn } from './action'
import type { Context, CustomActionHandle } from './renderer';
import type { Lang, State, StateFunction } from './types';
import { CUSTOM_ACTION_MAP } from './shared'
import { noop } from './utils';

type CustomActionHolder = {
  /**
   * Custom Actions has `get` function. It's return type should be cached
   */
  domNodes: CustomHandlerGetResult<boolean>
  /**
   * Custom Handler function itself
   */
  fn: CustomHandler;
  /**
   * Local Data
   */
  localData: any;
  /**
   * Cleanup function. Do not confuse with `clear`.
   */
  cleanup: () => void;
}

type HandleCustomActionOptions = CustomActionHandle & {
  /**
   * State Function
   */
  state: StateFunction<State>
  /**
   * Current Game Language
   */
  lang: Lang
}

const createCustomActionNode = (id: string) => {
  const div = document.createElement('div');

  div.setAttribute('data-id', id);

  return div;
}

const getHolderObject = (ctx: Context, fn: CustomHandler) => {
  const cached = CUSTOM_ACTION_MAP.get(ctx.id + fn.key);

  if (cached) {
    return cached;
  }

  const holder = {
    cleanup: noop,
    domNodes: {
      element: null,
      root: null as unknown as HTMLElement
    },
    fn: fn,
    localData: {}
  } satisfies CustomActionHolder;

  CUSTOM_ACTION_MAP.set(ctx.id + fn.key, holder);

  return holder;
}

const handleCustomAction = (ctx: Context, fn: CustomHandler, { lang, state, setDomNodes, setClear, remove: renderersRemove }: HandleCustomActionOptions) => {
  const holder = getHolderObject(ctx, fn);

  const getDomNodes = (insert = true) => {
    if (!holder.domNodes.root) {
      holder.domNodes.root = ctx.root;
    }

    if (holder.domNodes.element || !insert) {
      return holder.domNodes;
    }

    holder.domNodes.element = insert ? createCustomActionNode(fn.key) : null;

    setDomNodes(holder.domNodes);

    return holder.domNodes;
  };

  const flags = {
    ...ctx.meta
  };

  const clear = (func: typeof noop) => {
    setClear(holder.cleanup = () => {
      func();

      holder.domNodes = {
        element: null,
        root: ctx.root
      };

      holder.cleanup = noop;
    });
  }

  const data = (updatedData?: any) => {
    if (updatedData) {
      return holder.localData = updatedData;
    }

    return holder.localData;
  }

  const remove = () => {
    holder.cleanup();
    renderersRemove();
  }

  return fn({
    flags,

    lang,

    state,
    data,

    clear,
    remove,

    rendererContext: ctx,

    getDomNodes: getDomNodes as CustomHandlerFunctionGetFn
  });
}

export { getHolderObject as getCustomActionHolder, handleCustomAction }
export type { CustomActionHolder, HandleCustomActionOptions }
