export type { MapStore, DeepMapStore } from 'nanostores';

// // createRenderer((options) => {

// // })

export { createRendererState } from './state/renderer-state'
export type { RendererState, RendererStateStore } from './state/renderer-state'

export { noop, storeUpdate } from './utils'

export { createStartFunction } from './renderer/start'
export type { StartFunctionMountFn, StartFunctionUnMountFn } from './renderer/start'
