const SKIPPED_DURING_RESTORE = new Set([
  'dialog',
  'input',
  'vibrate'
] as const);

export { SKIPPED_DURING_RESTORE }