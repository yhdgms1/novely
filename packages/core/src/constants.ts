import type { Save } from './types'

const SKIPPED_DURING_RESTORE = new Set([
  'dialog',
  'input',
  'vibrate'
] as const);

const DEFAULT_SAVE: Save = [[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto', 'ru']];

export { SKIPPED_DURING_RESTORE, DEFAULT_SAVE }