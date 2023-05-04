import type { BaseTranslationStrings } from './translations';
import { split } from './lib';

type PluralType = Intl.LDMLPluralRule;
type FunctionalSetupT9N = <LanguageKey extends string, PluralKey extends string, StringKey extends string, Actions extends string>(parameters: { [Lang in LanguageKey]: { pluralization: { [Plural in PluralKey]: Partial<Record<PluralType, string>> }; internal: { [Key in BaseTranslationStrings]: string }; strings: { [Str in StringKey]: string }; actions?: { [Action in Actions]?: (value: string) => string; } } }) => T9N<LanguageKey, StringKey>
type SetupT9N<LanguageKey extends string> = <PluralKey extends string, StringKey extends string, Actions extends string>(parameters: { [Lang in LanguageKey]: { pluralization: { [Plural in PluralKey]: Partial<Record<PluralType, string>> }; internal: { [Key in BaseTranslationStrings]: string }; strings: { [Str in StringKey]: string }; actions?: { [Action in Actions]?: (value: string) => string; } } }) => T9N<LanguageKey, StringKey>

type T9N<LanguageKey extends string, StringKey extends string> = {
  t(key: StringKey): (lang: LanguageKey | (string & {}), obj: Record<string, unknown>) => string;
  i(key: StringKey, lang: LanguageKey | (string & {})): string;
}

const RGX = /{{(.*?)}}/g;

const replace = (str: string, obj: Record<string, unknown>, pluralization?: Record<string, Record<string, PluralType>>, actions?: Partial<Record<string, (str: string) => string>>, pr?: Intl.PluralRules) => {
  return str.replace(RGX, (x: any, key: string, y: any) => {
    x = 0;
    y = obj;

    const [pathstr, plural, action] = split(key.trim(), ['@', '%']);

    let path = pathstr!.split('.');

    while (y && x < path.length) y = y[path[x++]];

    if (plural && pluralization && y && pr) {
      y = pluralization[plural][pr.select(y)];
    }

    const actionHandler = actions && action && actions[action];

    if (actionHandler) y = actionHandler(y);

    return y != null ? y : '';
  });
}

const createT9N: FunctionalSetupT9N = (parameters) => {
  let locale: string | undefined;
  let pr: Intl.PluralRules | undefined;

  return {
    t(key) {
      return (lang, obj) => {
        /**
         * At first run `locale` and `pr` are not defined.
         * When `locale` changes, `pr` should be updated`
         */
        if (!locale || !pr || lang != locale) {
          pr = new Intl.PluralRules(locale = lang);
        }

        // @ts-ignore `(string & {})` cannot be used to index type `LanguageKey`.
        return replace(parameters[lang]['strings'][key], obj, parameters[lang]['pluralization'], parameters[lang]['actions'], pr);
      }
    },
    i(key, lang) {
      // @ts-ignore `(string & {})` cannot be used to index type `LanguageKey`.
      return parameters[lang]['internal'][key] as string;
    }
  }
}

export { createT9N, replace }
export type { SetupT9N, T9N, FunctionalSetupT9N } 