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

const isUserRequiredAction = (action: keyof MatchActionMapComplete, meta: Parameters<MatchActionMapComplete[keyof MatchActionMapComplete]>) => {
  return action === 'custom' && meta[0] && (meta[0] as unknown as CustomHandler).requireUserAction;
}

/**
 * Currently language system supports only 2-character values, like `en` or `ru`
 * todo: support language variations, such `en-GB`, `en-CA`, `en-AU`
 */
const getLanguage = (languages: string[], language = navigator.language) => {
  language = language.substring(0, 2);

  if (!languages.includes(language)) language = languages[0];

  return language;
}

/**
 * @copyright Techlead LLC
 * @see https://learn.javascript.ru/task/throttle
 */
const throttle = <Fn extends ((...args: any[]) => any)>(fn: Fn, ms: number) => {
  let throttled = false, savedArgs: any, savedThis: any;

  function wrapper() {
    if (throttled) {
      savedArgs = arguments;
      // @ts-ignore
      savedThis = this;

      return;
    }

    // @ts-ignore
    fn.apply(this, arguments);

    throttled = false;
  }

  setTimeout(function () {
    throttled = false;

    if (savedArgs) {
      wrapper.apply(savedThis, savedArgs);
      savedArgs = savedThis = null;
    }
  }, ms);

  return wrapper as unknown as (...args: Parameters<Fn>) => void;
}

export { matchAction, isNumber, isNull, isString, isCSSImage, str, isUserRequiredAction, getLanguage, throttle }