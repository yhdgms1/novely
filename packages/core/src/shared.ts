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

export { PRELOADED_ASSETS, STACK_MAP, CUSTOM_ACTION_MAP }
