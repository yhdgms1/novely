import type { BaseTranslationStrings } from './translations';
import { split } from './lib';

type PluralType = Intl.LDMLPluralRule;
type FunctionalSetupT9N = <
	LanguageKey extends string,
	PluralKey extends string,
	StringKey extends string,
	Actions extends string,
>(parameters: {
	[Lang in LanguageKey]: {
		pluralization: {
			[Plural in PluralKey]: Partial<Record<PluralType, string>>;
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
			[Plural in PluralKey]: Partial<Record<PluralType, string>>;
		};
		internal: { [Key in BaseTranslationStrings]: string };
		strings: { [Str in StringKey]: string };
		actions?: { [Action in Actions]?: (value: string) => string };
	};
}) => T9N<LanguageKey, StringKey>;

type T9N<LanguageKey extends string, StringKey extends string> = {
	t(
		key: StringKey | Record<LanguageKey, AllowedContent>,
	): (lang: LanguageKey | (string & {}), obj: Record<string, unknown>) => string;
	i(key: StringKey, lang: LanguageKey | (string & {})): string;
};

const RGX = /{{(.*?)}}/g;

type AllowedContent = string | (() => string | string[]) | string[] | (string | (() => string | string[]))[];

/**
 * Unwraps any allowed content into string
 * @param c Content
 */
const unwrap = (c: AllowedContent): string => {
	if (Array.isArray(c)) {
		return c.map((item) => unwrap(item)).join('<br>');
	}

	if (typeof c === 'function') {
		return unwrap(c());
	}

	return c;
};

const replace = (
	str: AllowedContent,
	obj: Record<string, unknown>,
	pluralization?: Record<string, Record<string, PluralType>>,
	actions?: Partial<Record<string, (str: string) => string>>,
	pr?: Intl.PluralRules,
) => {
	return unwrap(str).replace(RGX, (x: any, key: string, y: any) => {
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
};

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
					pr = new Intl.PluralRules((locale = lang));
				}

				// @ts-ignore
				const str: string | string[] = typeof key === 'object' ? key[lang] : parameters[lang]['strings'][key];

				if (!str) return '';

				// @ts-ignore `(string & {})` cannot be used to index type `LanguageKey`.
				return replace(str, obj, parameters[lang]['pluralization'], parameters[lang]['actions'], pr);
			};
		},
		i(key, lang) {
			// @ts-ignore `(string & {})` cannot be used to index type `LanguageKey`.
			return parameters[lang]['internal'][key] as string;
		},
	};
};

export { createT9N, replace };
export type { SetupT9N, T9N, AllowedContent, FunctionalSetupT9N };
