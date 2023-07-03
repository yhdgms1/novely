import type { ActionProxyProvider, CustomHandler } from './action'
import type { Character } from './character'
import type { Save, Thenable } from './types'

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

const isFunction = (val: unknown): val is ((...parameters: any[]) => any) => {
  return typeof val === 'function';
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

const getTypewriterSpeed = () => {
  return 90;
}

const getLanguage = (languages: string[], language = navigator.language) => {
  if (languages.includes(language)) {
    return language;
  } else if (languages.includes((language = language.substring(0, 2)))) {
    return language;
  } else if ((language = languages.find((value) => navigator.languages.includes(value))!)) {
    return language
  }

  /**
   * We'v checked the `en-GB` format, `en` format, and maybe any second languages, but there were no matches
   */
  return languages[0];
}

/**
 * @copyright Techlead LLC
 * @see https://learn.javascript.ru/task/throttle
 */
const throttle = <Fn extends ((...args: any[]) => any)>(fn: Fn, ms: number) => {
  let throttled = false, savedArgs: any, savedThis: any;

  function wrapper(this: any) {
    if (throttled) {
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    fn.apply(this, arguments as unknown as any[]);

    throttled = true;

    setTimeout(function () {
      throttled = false;

      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper as unknown as (...args: Parameters<Fn>) => void;
}

const vibrate = (pattern: VibratePattern) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch { }
}

const findLastIndex = <T>(array: T[], fn: (item: T) => boolean) => {
  for (let i = array.length - 1; i > 0; i--) {
    if (fn(array[i])) {
      return i;
    }
  }

  return -1;
}

export { matchAction, isNumber, isNull, isString, isCSSImage, str, isUserRequiredAction, getTypewriterSpeed, getLanguage, throttle, isFunction, vibrate, findLastIndex }