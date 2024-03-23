import type { NovelyScreen } from '@novely/core';
import { map } from 'nanostores'

/**
 * State which is related to whole renderer
 */
interface RendererState {
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
const createRendererState = <Extension extends Record<PropertyKey, string | boolean | number | symbol>>(extension: Extension = {} as Extension) => {
  const rendererState = map<RendererState & Extension>({
    screen: 'mainmenu',
    loadingShown: false,
    exitPromptShown: false,
    ...extension
  })

  return rendererState;
}

export { createRendererState }
export type { RendererState }
