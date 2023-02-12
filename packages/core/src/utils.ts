import type { ActionProxyProvider } from './action'
import type { DefaultDefinedCharacter } from './character'

type MatchActionMap = {
  [Key in keyof ActionProxyProvider<Record<string, DefaultDefinedCharacter>>]: (data: Parameters<ActionProxyProvider<Record<string, DefaultDefinedCharacter>>[Key]>) => void;
}

const matchAction = <M extends MatchActionMap>(values: M) => {
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

export { matchAction, isNumber, isNull, isString }