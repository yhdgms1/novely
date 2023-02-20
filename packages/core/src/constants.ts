import type { Save } from './types'

const USER_ACTION_REQUIRED_ACTIONS = new Set([
  'dialog',
  'input'
]);

const DEFAULT_SAVE: Save = [[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto', 'ru']];

export { USER_ACTION_REQUIRED_ACTIONS, DEFAULT_SAVE }