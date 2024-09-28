import type { Data, State } from './types';

type PluralType = Intl.LDMLPluralRule;
type Pluralization = Partial<Record<PluralType, string>>;
type AllowedContent =
	| string
	| ((state: State | Data) => string | string[])
	| string[]
	| (string | ((state: State | Data) => string | string[]))[];
type TranslationActions = Partial<Record<string, (str: string) => string>>;

const RGX = /{{(.*?)}}/g;

const split = (input: string, delimeters: string[]) => {
	const output: (string | undefined)[] = [];

	for (const delimeter of delimeters) {
		if (!input) break;

		const [start, end] = input.split(delimeter, 2);

		output.push(start);
		input = end;
	}

	output.push(input);

	return output;
};

/**
 * Turns any allowed content into string
 * @param c Content
 */
const flattenAllowedContent = (c: AllowedContent, state: State | Data): string => {
	if (Array.isArray(c)) {
		return c.map((item) => flattenAllowedContent(item, state)).join('<br>');
	}

	if (typeof c === 'function') {
		return flattenAllowedContent(c(state), state);
	}

	return c;
};

const replace = (
	input: string,
	data: Record<string, unknown>,
	pluralization?: Record<string, Pluralization>,
	actions?: TranslationActions,
	pr?: Intl.PluralRules,
) => {
	return input.replaceAll(RGX, (x: any, key: string, y: any) => {
		x = 0;
		y = data;

		const [pathstr, plural, action] = split(key.trim(), ['@', '%']);

		if (!pathstr) {
			return '';
		}

		const path = pathstr.split('.');

		while (y && x < path.length) y = y[path[x++]];

		if (plural && pluralization && y && pr) {
			y = pluralization[plural][pr.select(y)];
		}

		const actionHandler = actions && action ? actions[action] : void 0;

		if (actionHandler) y = actionHandler(y);

		return y == null ? '' : y;
	});
};

export { flattenAllowedContent, replace };
export type { AllowedContent, PluralType, Pluralization, TranslationActions };
