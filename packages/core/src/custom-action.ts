import type { CustomHandler, CustomHandlerGetResult, CustomHandlerFunctionGetFn } from './action'
import type { Context, CustomActionHandle } from './renderer';
import type { Lang, State, StateFunction } from './types';
import { CUSTOM_ACTION_MAP } from './shared'
import { noop } from './utils';

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

const getCustomActionHolder = (ctx: Context, fn: CustomHandler) => {
  const cached = CUSTOM_ACTION_MAP.get(ctx.id + fn.key);

  if (cached) {
    return cached;
  }

  const holder = {
    cleanup: noop,
    node: null,
    fn: fn,
    localData: {}
  } satisfies CustomActionHolder;

  CUSTOM_ACTION_MAP.set(ctx.id + fn.key, holder);

  return holder;
}

const handleCustomAction = (ctx: Context, fn: CustomHandler, { lang, state, setMountElement, setClear, remove: renderersRemove }: HandleCustomActionOptions) => {
  const holder = getCustomActionHolder(ctx, fn);

  const flags = {
    ...ctx.meta
  };

  const getDomNodes = (insert = true): CustomHandlerGetResult<boolean> => {
    if (holder.node || !insert) {
      return {
        element: holder.node,
        root: ctx.root
      }
    }

    holder.node = insert ? createCustomActionNode(fn.key) : null;

    setMountElement(holder.node);

    return {
      element: holder.node,
      root: ctx.root
    }
  };

  const clear = (func: typeof noop) => {
    /**
     * We wrap original cleanup to achieve these goals:
     *
     * - when cleaned up function will not be called again
     * - when cleaned up renderer will get updated element
     */
    setClear(holder.cleanup = () => {
      func();

      holder.node = null;
      holder.cleanup = noop;

      setMountElement(null);
      setClear(noop);
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

export { getCustomActionHolder, handleCustomAction }
export type { CustomActionHolder, HandleCustomActionOptions }
