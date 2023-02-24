import type { ActionProxyProvider, CustomHandler } from './action'
import type { Character } from './character'
import type { Thenable } from './types'

type MatchActionMap = {
  [Key in keyof ActionProxyProvider<Record<string, Character>>]: (data: Parameters<ActionProxyProvider<Record<string, Character>>[Key]>) => void;
}

type MatchActionMapComplete = Omit<MatchActionMap, 'custom'> & {
  custom: (value: [handler: CustomHandler]) => Thenable<void>;
}

const matchAction = <M extends MatchActionMapComplete>(values: M) => {
  return (action: keyof MatchActionMap, props: any) => {
    return values[action](props);
  }
}

const isNumber = (val: unknown): val is number => {
  return typeof val === 'number';
}

const isNull = (val: unknown): val is null => {
  return val === null;
}

const isString = (val: unknown): val is string => {
  return typeof val === 'string';
}

const isCSSImage = (str: string) => {
  const startsWith = String.prototype.startsWith.bind(str);

  return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
}

const str = (value: unknown) => {
  return String(value);
}

export { matchAction, isNumber, isNull, isString, isCSSImage, str }