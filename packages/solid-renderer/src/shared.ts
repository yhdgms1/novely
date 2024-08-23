import type { SolidRendererStore } from './types'
import { createShared } from '@novely/renderer-toolkit'

const PRELOADED_IMAGE_MAP = new Map<string, HTMLImageElement>()
const PRELOADING_IMAGE_MAP = new Map<string, HTMLImageElement>()

const { useShared, removeShared } = createShared<SolidRendererStore>(() => {
  return {
    characters: {}
  }
})

export { PRELOADED_IMAGE_MAP, PRELOADING_IMAGE_MAP, useShared, removeShared }