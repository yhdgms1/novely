import type { Ast, AstNode, PrintOptions } from './types';

const NEW_LINE = '\n';
const DOUBLE_SPACE = '  ';

const to_number = (value: string) => {
	const numeralized = Number(value);
	const isString = isNaN(numeralized) || !isFinite(numeralized);

	return isString ? '' : numeralized;
}

const print = (ast: Ast, {}: PrintOptions = {}) => {
	let code = '';

	const print_js_value = (value: Extract<AstNode, { type: 'JSValue' }>, depth: number, short: boolean) => {
		return `${short ? '' : DOUBLE_SPACE.repeat(depth)}%${value.content}`;
	};

	const print_array = (value: Extract<AstNode, { type: 'Array' }>, depth: number): string => {
		const children = value.children.map((child) => print_with_unknown_printer(child, depth + 1));

		return `${DOUBLE_SPACE.repeat(depth)}=${NEW_LINE}${children.join(NEW_LINE)}`;
	};

	const print_value = (value: Extract<AstNode, { type: 'Value' }>, depth: number, short: boolean) => {
		const num = to_number(value.content);
		const start = DOUBLE_SPACE.repeat(depth);

		if (typeof num === 'number') {
			if (short) {
				return value.content;
			}

			return start + value.content;
		}

		const isMultiline = value.content.startsWith(NEW_LINE);

		if (isMultiline) {
			if (short) {
				throw new Error('Cannot be both `multiline` and `short`');
			}

			const offset = start + DOUBLE_SPACE;

			return `${start}\\${value.content.split(NEW_LINE).map((s, i) => i === 0 ? '' : offset + s).join(NEW_LINE)}`
		}

		if (short) {
			const has = String.prototype.includes.bind(value.content);
			const needToEscape = has(' ') || has('"');

			if (needToEscape) {
				return JSON.stringify(value.content)
			}

			return value.content;
		}

		return `${start}\\${value.content}`;
	};

	const print_map_item = (value: Extract<AstNode, { type: 'MapItem' }>, depth: number) => {
		const children = value.children.map((child) => print_with_unknown_printer(child, depth + 1)).join(NEW_LINE);

		return `${DOUBLE_SPACE.repeat(depth)}${value.name}${NEW_LINE}${children}`
	}

	const print_map = (value: Extract<AstNode, { type: 'Map' }>, depth: number): string => {
		const children = value.children.map((child) => print_map_item(child, depth + 1));

		return `${DOUBLE_SPACE.repeat(depth)}*${NEW_LINE}${children.join(NEW_LINE)}`
	};

	const print_action = (value: Extract<AstNode, { type: 'Action' }>, depth: number): string => {
		const all_is_number = value.children.every((item) => item.type !== 'Map' && item.type !== 'Array' && typeof to_number(item.content) === 'number') && value.children.length > 1;
		const has_map_or_array = value.children.some((item) => item.type === 'Map' || item.type === 'Array');
		const larger_than_80 = value.children.map((item) => (item.type === 'Map' || item.type === 'Array') ? '' : item.content).join('').length > 80;
		const is_starts_with_new_line = value.children.some((item) => item.type === 'Value' && item.content.startsWith('\n'));

		const long = all_is_number || has_map_or_array || larger_than_80 || is_starts_with_new_line;
		const short = !long;

		const children = value.children.map((child) => print_with_unknown_printer(child, depth + 1, short)).join(short ? ' ' : NEW_LINE);

		return `${DOUBLE_SPACE.repeat(depth)}!${value.name}${short ? ' ' : NEW_LINE}${children}`
	};

	const print_with_unknown_printer = (child: AstNode, depth: number, short = false) => {
		if (child.type === 'Value') {
			return print_value(child, depth, short);
		} else if (child.type === 'JSValue') {
			return print_js_value(child, depth, short);
		} else if (child.type === 'Map') {
			return print_map(child, depth);
		} else if (child.type === 'Action') {
			return print_action(child, depth);
		} else if (child.type === 'Array') {
			return print_array(child, depth);
		} else {
			return '';
		}
	};

	for (const top of ast) {
		code += `${top.name}${top.name ? NEW_LINE : ''}`

		for (const child of top.children) {
			code += print_with_unknown_printer(child, 1) + NEW_LINE;
		}
	}

	return code;
}

export { print }
export type { PrintOptions }
