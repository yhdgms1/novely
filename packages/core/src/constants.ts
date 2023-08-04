import type { TypewriterSpeed } from './types';

const SKIPPED_DURING_RESTORE = new Set(['dialog', 'choice', 'input', 'vibrate', 'text'] as const);

const EMPTY_SET = new Set<any>();

const DEFAULT_TYPEWRITER_SPEED: TypewriterSpeed = 'Medium';

export { SKIPPED_DURING_RESTORE, EMPTY_SET, DEFAULT_TYPEWRITER_SPEED };
