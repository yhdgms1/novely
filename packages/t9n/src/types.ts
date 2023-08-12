import type { BaseTranslationStrings } from './translations';

type PluralType = Intl.LDMLPluralRule;
type Pluralization = Partial<Record<PluralType, string>>;
type EmptyObject = Record<never, never>;

type FunctionalSetupT9N = <
	LanguageKey extends string,
	PluralKey extends string,
	StringKey extends string,
	Actions extends string,
>(parameters: {
	[Lang in LanguageKey]: {
		pluralization: {
			[Plural in PluralKey]: Pluralization;
		};
		internal: { [Key in BaseTranslationStrings]: string };
		strings: { [Str in StringKey]: string };
		actions?: { [Action in Actions]?: (value: string) => string };
	};
}) => T9N<LanguageKey, StringKey>;

type SetupT9N<LanguageKey extends string> = <
	PluralKey extends string,
	StringKey extends string,
	Actions extends string,
>(parameters: {
	[Lang in LanguageKey]: {
		pluralization: {
			[Plural in PluralKey]: Pluralization;
		};
		internal: { [Key in BaseTranslationStrings]: string };
		strings: { [Str in StringKey]: string };
		actions?: { [Action in Actions]?: (value: string) => string };
	};
}) => T9N<LanguageKey, StringKey>;

type T9N<LanguageKey extends string, StringKey extends string> = {
	t(
		key: StringKey | Record<LanguageKey, AllowedContent>,
	): (lang: LanguageKey | (string & EmptyObject), obj: Record<string, unknown>) => string;
	i(key: BaseTranslationStrings, lang: LanguageKey | (string & EmptyObject)): string;
};

type AllowedContent = string | (() => string | string[]) | string[] | (string | (() => string | string[]))[];

export type { PluralType, FunctionalSetupT9N, SetupT9N, T9N, AllowedContent, Pluralization }
