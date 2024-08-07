import type { StackHolder } from './types';
import type { CustomActionHolder } from './custom-action';

/**
 * @internal
 */
const STACK_MAP = new Map<string, StackHolder>();

/**
 * @internal
 */
const CUSTOM_ACTION_MAP = new Map<string, CustomActionHolder>()

const PRELOADED_ASSETS = new Set<string>();
const ASSETS_TO_PRELOAD = new Set<string>();

const RESOURCE_TYPE_CACHE = new Map<string, "image" | "audio" | "other">();

export { PRELOADED_ASSETS, ASSETS_TO_PRELOAD, STACK_MAP, CUSTOM_ACTION_MAP, RESOURCE_TYPE_CACHE }
