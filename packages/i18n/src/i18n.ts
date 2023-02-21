import type { PluralType } from "./plural";

type Params<Value extends string> = Value extends `${infer _Head}{{${infer Param}}}${infer Tail}`
  ? [Param, ...Params<Tail>]
  : [];

type PluralizeFunction<PluralKeys extends string> = (
  key: PluralKeys,
  count: string | number
) => string;
type LabelFunction<T extends string, PK extends string> = (
  params: { [Param in Params<T>[number]]: string | number } & { pluralize: PluralizeFunction<PK> }
) => string;

const self = Symbol();

// [Lang in LK | LangKeys]: {
//   [PluralKey in PK]?: Partial<Record<PluralType, string>>;
// } & {
//   [PluralKey in PluralKeys]: Partial<Record<PluralType, string>>;
// };

type I18N<LangKeys extends string, PluralKeys extends string, Label extends string> = {
  t<L extends Label>(label: L): () => string | ((params?: Record<string, unknown>) => string);
  pluralize(key: PluralKeys, count: string | number): string;
  lang(locale?: PluralKeys | (string & {})): void;
  extend<LK extends string, PK extends string, Lab extends string>(
    plural:
      {
        [Lang in LangKeys | LK]:
        {
          [PluralKey in PluralKeys | PK]?: Partial<Record<PluralType, string>>;
        }
      },
    translations: {
      [Lang in LK | LangKeys]?: {
        [L in Lab | Label]?: typeof self | string | LabelFunction<L, PK | PluralKeys>;
      };
    }
  ): I18N<LangKeys | LK, PluralKeys | PK, Label | Lab>;
};

const createI18N = <LangKeys extends string, PluralKeys extends string, Label extends string>(
  plural: {
    [Lang in LangKeys]: { [PluralKey in PluralKeys]: Partial<Record<PluralType, string>> };
  },
  translations: {
    [Lang in LangKeys]: { [L in Label]: typeof self | string | LabelFunction<L, PluralKeys> };
  }
): I18N<LangKeys, PluralKeys, Label> => {
  let lang: string;
  let pr: Intl.PluralRules;

  return {
    t(label) {
      if (!lang) this.lang();

      return () => {
        const value = translations[lang as LangKeys][label];

        if (value === self) {
          return label;
        } else if (typeof value === "string") {
          return value;
        } else {
          return (params) => {
            return value({ ...params, pluralize: this.pluralize } as any);
          };
        }
      };
    },
    pluralize(key, count) {
      return String(plural[lang as LangKeys][key][pr.select(Number(count))]);
    },
    lang(locale = navigator.language) {
      (lang = locale), (pr = new Intl.PluralRules(lang));
    },
    extend(pl, tr) {
      return createI18N({ ...plural, ...pl }, { ...translations, ...tr });
    },
  };
};

export { createI18N, self };
