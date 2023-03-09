const SKIPPED_DURING_RESTORE = new Set([
  'dialog',
  'input',
  'vibrate',
  'text'
] as const);

export { SKIPPED_DURING_RESTORE }