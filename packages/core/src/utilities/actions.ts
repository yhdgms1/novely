import { DEV } from "esm-env";
import type { ActionChoiceChoiceObject, DefaultActionProxy, ValidAction, VirtualActions } from "../action";
import { huntAssets, enqueueAssetForPreloading } from "../preloading";
import { flatActions } from "./story";
import { getLanguageFromStore, getVolumeFromStore } from "./ungrupped";
import type { AssetsPreloading, Data, Lang, State, StorageData } from "../types";
import type { Character } from "../character";
import type { Stored } from "../store";

type BuildActionObjectParams<$Lang extends Lang, $Data extends Data> = {
  rendererActions: Record<string, (...args: any[]) => ValidAction>;
  nativeActions: string[];

  characters: Record<string, Character>;

  preloadAssets: AssetsPreloading;
  storageData: Stored<StorageData<$Lang, $Data>>;
}

type VirtualActionsGlobal = VirtualActions<Record<string, Character>, Lang, State>;
type ActionsGlobal = DefaultActionProxy & VirtualActionsGlobal;

/**
 * In this case actions that get overwritten with another action
 */
const VIRTUAL_ACTIONS: (keyof VirtualActionsGlobal)[] = ['say'];

const buildActionObject = <$Lang extends Lang, $Data extends Data>({ rendererActions, nativeActions, characters, preloadAssets, storageData }: BuildActionObjectParams<$Lang, $Data>) => {
  const allActions = [...nativeActions, ...VIRTUAL_ACTIONS];
  const object = { ...rendererActions };

  for (let action of allActions) {
    object[action] = (...props: Parameters<ActionsGlobal[keyof ActionsGlobal]>) => {
      if (action === 'say') {
        action = 'dialog';

        const [character] = props as Parameters<VirtualActionsGlobal['say']>;

        if (DEV && !characters[character]) {
          throw new Error(`Attempt to call Say action with unknown character "${character}"`);
        }
      } else if (action === 'choice') {
        if (props.slice(1).every((choice) => !Array.isArray(choice))) {
          for (let i = 1; i < props.length; i++) {
            const choice = props[i] as ActionChoiceChoiceObject<Lang, State>

            (props as Parameters<DefaultActionProxy['choice']>)[i] = [
              choice.title,
              flatActions(choice.children),
              choice.active,
              choice.visible,
              choice.onSelect,
              choice.image,
            ];
          }
        } else {
          for (let i = 1; i < props.length; i++) {
            const choice = props[i];

            if (Array.isArray(choice)) {
              choice[1] = flatActions(choice[1]);
            }
          }
        }
      } else if (action === 'condition') {
        const actions = (props as Parameters<ActionsGlobal['condition']>)[1];

        for (const key in actions) {
          actions[key] = flatActions(actions[key]);
        }
      }

      if (preloadAssets === 'blocking') {
        huntAssets({
          action: action as any,
          props: props as any,

          mode: preloadAssets,
          characters,

          lang: getLanguageFromStore(storageData),
          volume: getVolumeFromStore(storageData),

          handle: enqueueAssetForPreloading,
        });
      }

      return [action, ...props] as ValidAction;
    }
  }

  return object;
}

export { buildActionObject }
