import type { NovelyScreen } from '@novely/core';
import type { BaseDeepMap } from 'nanostores';
import { deepAtom } from '../atoms/deep-atom';

/**
 * State which is related to whole renderer
 */
type RendererState = {
  /**
   * Current screen that should be rendered
   */
  screen: NovelyScreen;
  /**
   * Is loading shown. Unlike screen 'loading', it does not change screen and shown above all layers
   */
  loadingShown: boolean;
  /**
   * Is exit prompt should be shown
   */
  exitPromptShown: boolean;
}

const defaultEmpty = {} satisfies BaseDeepMap;

type RendererStateStore<Extension extends BaseDeepMap = typeof defaultEmpty> = RendererState & Extension;

/**
 * Helper to make renderer state with default recommended values
 * @param extension Additional object to be merged with default values
 * @returns Store
 * @example
 * ```ts
 * createRenderer(() => {
 *   const rendererState = createRendererState();
 *
 *   return {
 *     ui: {
 *       showScreen(name) {
 *         rendererState.setKey('screen', name)
 *       },
 *       getScreen() {
 *         return rendererState.get().screen;
 *       }
 *     }
 *   }
 * })
 * ```
 */
const createRendererState = <Extension extends BaseDeepMap = typeof defaultEmpty>(extension = defaultEmpty as Extension) => {
  const rendererState = deepAtom<RendererStateStore<Extension>>({
    screen: 'mainmenu',
    loadingShown: false,
    exitPromptShown: false,
    ...extension
  } as RendererStateStore<Extension>)

  return rendererState;
}

export { createRendererState }
export type { RendererState, RendererStateStore }
