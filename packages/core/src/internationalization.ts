type PluralType = Intl.LDMLPluralRule;
type FunctionalSetupI18N = <LanguageKey extends string, PluralKey extends string, StringKey extends string>(parameters: { [Lang in LanguageKey]: { pluralization: { [Plural in PluralKey]: Partial<Record<PluralType, string>> }; strings: { [Str in StringKey]: string } } }) => I18N<LanguageKey, PluralKey, StringKey>
type SetupI18N<LanguageKey extends string> = <PluralKey extends string, StringKey extends string>(parameters: { [Lang in LanguageKey]: { pluralization: { [Plural in PluralKey]: Partial<Record<PluralType, string>> }; strings: { [Str in StringKey]: string } } }) => I18N<LanguageKey, PluralKey, StringKey>

type I18N<LanguageKey extends string, _PluralKey extends string, StringKey extends string> = {
  t(key: StringKey): (lang: LanguageKey | (string & {}), obj: Record<string, unknown>) => string;
}

const RGX = /{{(.*?)}}/g;

const createI18N: FunctionalSetupI18N = (parameters) => {
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
        const str = parameters[lang]['strings'][key] as string;

        return str.replace(RGX, (x: any, key: any, y: any) => {
          x = 0;
          y = obj;

          key = (key as string).trim();

          let at = (key as string).split('@');
          let plural: string | undefined;

          if (at.length > 1) {
            ([key, plural] = at);
          }

          key = (key as string).split('.');

          while (y && x < key.length) {
            y = y[key[x++]];
          }

          if (plural && y) {
            // @ts-ignore `(string & {})` cannot be used to index type `LanguageKey`.
            y = parameters[lang]['pluralization'][plural][pr!.select(y)];
          }

          return y != null ? y : '';
        });
      }
    }
  }
}

export { createI18N }
export type { SetupI18N, I18N, FunctionalSetupI18N } 