type PluralType = Intl.LDMLPluralRule;
type Pluralization = Partial<Record<PluralType, string>>;
type AllowedContent = string | (() => string | string[]) | string[] | (string | (() => string | string[]))[];
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
	actions?: TranslationActions,
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

export { unwrap, replace };
export type { AllowedContent, PluralType, Pluralization, TranslationActions };
