import type { AllowedContent, FunctionalSetupT9N, Pluralization } from './types';
import { split } from './lib';

const RGX = /{{(.*?)}}/g;

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
	pluralization?: Record<string, Pluralization>,
	actions?: Partial<Record<string, (str: string) => string>>,
	pr?: Intl.PluralRules,
) => {
	return unwrap(str).replaceAll(RGX, (x: any, key: string, y: any) => {
		x = 0;
		y = obj;

		const [pathstr, plural, action] = split(key.trim(), ['@', '%']);

		if (!pathstr) {
			return '';
		}

		const path = pathstr.split('.');

		while (y && x < path.length) y = y[path[x++]];

		if (plural && pluralization && y && pr) {
			y = pluralization[plural][pr.select(y)];
		}

		const actionHandler = actions && action && actions[action];

		if (actionHandler) y = actionHandler(y);

		return y == null ? '' : y;
	});
};

const createT9N: FunctionalSetupT9N = (parameters) => {
	type LanguageKey = keyof typeof parameters;

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

				const language = lang as LanguageKey;
				const str = key[language];

				if (!str) return '';

				return replace(str, obj, parameters[language]['pluralization'], parameters[language]['actions'], pr);
			};
		},
	};
};

export { createT9N, replace };
export type { SetupT9N, T9N, AllowedContent, FunctionalSetupT9N } from './types';
