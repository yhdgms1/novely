import type { PluralType } from './types'

export const match = (count: number): PluralType => {
  if (!count) return 'none';
  if (count === 1) return 'one';

  return 'some';
}