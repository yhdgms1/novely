import type { TypewriterSpeed } from '@novely/core';

const TEXT_SPEED_MAP: Record<TypewriterSpeed, (() => number) | undefined> = {
  'Slow': () => 120,
  'Medium': () => 90,
  'Fast': () => 60,
  'Auto': undefined
}

export { TEXT_SPEED_MAP }