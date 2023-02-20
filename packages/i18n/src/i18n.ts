import type { PluralType } from './plural';
import { transform } from './constants'

type Params<Value extends string> =
  Value extends `${infer _Head}{${infer Param}}${infer Tail}`
  ? Param extends `{${string}` ? [] : [Param, ...Params<Tail>]
  : []

type GetParamType<P extends string> = P extends `str:${string}` ? string : P extends `int:${string}` ? number : string | number;
type ClearParamType<P extends string> = P extends `str:${infer Clear}` ? Clear : P extends `int:${infer Clear}` ? Clear : P;

type PluralizeFunction = (args: Partial<Record<PluralType, string | number>>) => (count: number) => string;
type LabelFunction<T extends string> = (params: { [Param in Params<T>[number]as ClearParamType<Param>]: GetParamType<Param> } & { pluralize: PluralizeFunction }) => string;

const self = Symbol('novely-i18n-self');

const createI18N = <PluralizationKeys extends string, Label extends string>(pluralization: { [Key in PluralizationKeys]: (count: number) => PluralType }, translations: { [Lang in PluralizationKeys]: { [L in Label]: typeof self | string | LabelFunction<L> } }) => {
  return {
    t<L extends Label>(label: L) {
      return (lang: PluralizationKeys) => {
        const value = translations[lang][label];

        if (value === self) {
          return transform(label);
        } else if (typeof value === 'string') {
          return transform(value);
        } else {
          const pluralize = (args: Partial<Record<PluralType, string | number>>) => {
            return (count: number) => {
              return args[pluralization[lang](count)] || '';
            }
          }

          return (params = {}) => {
            return transform(value({ ...params, pluralize } as any));
          }
        }
      }
    },
    extend() {
      return null;
    }
  }
}

createI18N.self = self;

export { createI18N }