import type { CustomHandler, DefaultActionProxy } from './action';
import type { Character } from './character';
import { STACK_MAP, PRELOADED_ASSETS, ASSETS_TO_PRELOAD } from './shared';
import { getResourseType, mapSet, isImageAsset, isString, isAudioAction, handleImageAsset, toArray, handleAudioAsset } from './utils'

/**
 * Adds asset to `ASSETS_TO_PRELOAD` firstly checking if is was already preloaded
 */
const enqueueAssetForPreloading = (asset: string) => {
  if (!PRELOADED_ASSETS.has(asset)) {
    ASSETS_TO_PRELOAD.add(asset)
  }
}

type HandleAssetsPreloadingOptions = {
  request: typeof fetch;

  limiter: (fn: () => void | PromiseLike<void>) => Promise<void>;

  preloadAudioBlocking: (source: string) => Promise<void>;
  preloadImageBlocking: (source: string) => Promise<void>;
}

/**
 * Preloads assets
 */
const handleAssetsPreloading = async ({ request, limiter, preloadAudioBlocking, preloadImageBlocking }: HandleAssetsPreloadingOptions) => {
  const list = mapSet(ASSETS_TO_PRELOAD, (asset) => {
    return limiter(async () => {
      const type = await getResourseType(request, asset);

      switch (type) {
        case 'audio': {
          await preloadAudioBlocking(asset);
          break;
        }

        case 'image': {
          await preloadImageBlocking(asset);
          break;
        }
      }

      ASSETS_TO_PRELOAD.delete(asset);
      PRELOADED_ASSETS.add(asset);
    })
  });

  /**
   * `allSettled` is used because even if error happens game should run
   *
   * Ideally, there could be a notification for player, maybe developer could be also notified
   * But I don't think it's really needed
   */
  await Promise.allSettled(list);

  ASSETS_TO_PRELOAD.clear();
}

type HuntAssetsOptions = {
  /**
   * Characters object from user config
   */
  characters: Record<string, Character>;
  /**
   * Action name
   */
  action: keyof DefaultActionProxy;
  /**
   * Action props
   */
  props: Parameters<DefaultActionProxy[keyof DefaultActionProxy]>;
  /**
   * Function to handle found asset
   */
  handle: (asset: string) => void;
}

const huntAssets = ({ characters, action, props, handle }: HuntAssetsOptions) => {
  if (action === 'showBackground') {
    /**
     * There are two types of showBackground currently
     *
     * Parameter is a `string`
     * Parameter is a `Record<'CSS Media', string>`
     */
    if (isString(props[0])) {
      handle(handleAudioAsset(props[0]));
    }

    // todo: asset
    if (props[0] && typeof props[0] === 'object') {
      for (const value of Object.values(props[0])) {
        if (isImageAsset(value)) {
          handle(value)
        }
      }
    }

    return;
  }

  /**
   * Here "stop" action also matches condition, but because `ASSETS_TO_PRELOAD` is a Set, there is no problem
   */
  if (isAudioAction(action) && isString(props[0])) {
    handle(handleAudioAsset(props[0]))
    return;
  }

  /**
   * Load characters
   */
  if (action === 'showCharacter' && isString(props[0]) && isString(props[1])) {
    const images = toArray(characters[props[0]].emotions[props[1]]);

    for (const asset of images) {
      handle(handleImageAsset(asset));
    }

    return;
  }

  /**
   * Custom action assets
   */
  if (action === 'custom' && (props[0] as CustomHandler).assets && (props[0] as CustomHandler).assets!.length > 0) {
    for (const asset of (props[0] as CustomHandler).assets!) {
      handle(asset);
    }

    return;
  }
}

export { enqueueAssetForPreloading, handleAssetsPreloading, huntAssets }
