export { computed } from 'nanostores'
export type { MapStore, DeepMapStore, Atom, WritableAtom, ReadableAtom } from 'nanostores';

export { memo } from './atoms/memo'
export { deepAtom } from './atoms/deep-atom'

export { createContextStateRoot } from './state/context-state'
export type { ContextStateStore, ContextState, ContextStateCharacter } from './state/context-state'

export { createRendererState } from './state/renderer-state'
export type { RendererState, RendererStateStore } from './state/renderer-state'

export { noop } from './utils'

export { createStartFunction } from './renderer/start'
export type { StartFunctionMountFn, StartFunctionUnMountFn } from './renderer/start'

export { createAudio, createAudioMisc, Howl } from './audio/audio'
export type { AudioStore } from './audio/types'

export { createShared } from './shared/create-shared'

export { createGetContext } from './context/create-get-context'

export { createRootSetter } from './root/root-setter'

export {
  handleBackgroundAction,
  handleDialogAction,
  handleChoiceAction,
  handleClearAction,
  handleCustomAction,
  handleClearCustomAction,
  handleTextAction,
  handleInputAction,
  handleVibrateAction
} from './context/actions'
