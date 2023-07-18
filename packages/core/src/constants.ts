const SKIPPED_DURING_RESTORE = new Set([
  'dialog',
  'choice',
  'input',
  'vibrate',
  'text'
] as const);

const EMPTY_SET = new Set<any>();

export { SKIPPED_DURING_RESTORE, EMPTY_SET }