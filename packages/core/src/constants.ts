import type { Save } from './types'
import { klona } from 'klona';

const SKIPPED_DURING_RESTORE = new Set([
  'dialog',
  'input',
  'vibrate'
] as const);

const DEFAULT_SAVE: Save = [[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto']];

const getDefaultSave = () => {
  return klona(DEFAULT_SAVE);
}

export { SKIPPED_DURING_RESTORE, DEFAULT_SAVE, getDefaultSave }