import type { TypewriterSpeed } from './types';

const SKIPPED_DURING_RESTORE = new Set(['dialog', 'choice', 'input', 'vibrate', 'text'] as const);

const BLOCK_EXIT_STATEMENTS = new Set(['choice:exit', 'condition:exit', 'block:exit'] as const);

const BLOCK_STATEMENTS = new Set(['choice', 'condition', 'block'] as const);

const EMPTY_SET = new Set<any>();

const DEFAULT_TYPEWRITER_SPEED: TypewriterSpeed = 'Medium';

export { SKIPPED_DURING_RESTORE, EMPTY_SET, DEFAULT_TYPEWRITER_SPEED, BLOCK_EXIT_STATEMENTS, BLOCK_STATEMENTS };
