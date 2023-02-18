import type { ActionProxyProvider } from './action'
import type { DefaultDefinedCharacter } from './character'
import type { Save } from './types'

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

const createStack = (current: Save, stack = [current]) => {
  return {
    get value() {
      return stack.at(-1)!;
    },
    set value(value: Save) {
      stack[stack.length - 1] = value;
    },
    back() {
      if (stack.length > 1) stack.pop();
    },
    push(value: Save) {
      stack.push(value);
    },
    clear() {
      stack = [[[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto']]];
    }
  }
}

export { matchAction, isNumber, isNull, isString, createStack }