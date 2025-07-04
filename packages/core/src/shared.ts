import type { CustomActionHolder, CustomActionInstances } from './custom-action';
import type { StackHolder } from './types';

/**
 * @internal
 */
const STACK_MAP = new Map<string, StackHolder>();

/**
 * @internal
 */
const CUSTOM_ACTION_MAP = new Map<string, CustomActionHolder>();

/**
 * @internal
 */
const CUSTOM_ACTION_INSTANCES_MAP = new Map<string, CustomActionInstances>();

const PRELOADED_ASSETS = new Set<string>();
const ASSETS_TO_PRELOAD = new Set<string>();

export { PRELOADED_ASSETS, ASSETS_TO_PRELOAD, STACK_MAP, CUSTOM_ACTION_MAP, CUSTOM_ACTION_INSTANCES_MAP };
