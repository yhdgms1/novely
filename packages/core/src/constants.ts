import type { Save } from './types'

const SKIPPED_DURING_RESTORE = new Set([
  'dialog',
  'input',
  'vibrate'
] as const);

const DEFAULT_SAVE: Save = [[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto']];

/**
 * Currently language system supports only 2-character values, like `en` or `ru`
 * 
 * todo: support language variations, such `en-GB`, `en-CA`, `en-AU`
 */
const getDefaultSave = (languages: string[], language = navigator.language) => {
  language = language.substring(0, 2);

  if (!languages.includes(language)) language = languages[0];

  return [[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto']] as Save;
}

export { SKIPPED_DURING_RESTORE, DEFAULT_SAVE, getDefaultSave }