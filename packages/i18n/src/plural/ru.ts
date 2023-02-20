import type { PluralType } from './types'

export const match = (count: number): PluralType => {
  const lastNumber = count % 10;
  const lastNumbers = count % 100;

  if (!count) return 'none';
  if (lastNumber === 1 && lastNumbers !== 11) return 'one';
  if (lastNumber >= 2 && lastNumber <= 4 && lastNumbers !== 12 && lastNumbers !== 13 && lastNumbers !== 14) return 'some'
  return 'many'
}