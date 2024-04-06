import type { StackHolder } from './types';

/**
 * @internal
 */
const STACK_MAP = new Map<string, StackHolder>();

const PRELOADED_ASSETS = new Set<string>();

export { PRELOADED_ASSETS, STACK_MAP }
