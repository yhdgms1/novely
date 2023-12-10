import type { Ast, AstNode } from './types';

const traverse = (ast: Ast | AstNode, cb: (item: AstNode) => void) => {
	if ('type' in ast) {
		if (
			ast.type === 'Property' ||
			ast.type === 'Action' ||
			ast.type === 'Array' ||
			ast.type === 'Map' ||
			ast.type === 'MapItem'
		) {
			cb(ast);

			for (const child of ast.children) {
				traverse(child, cb);
			}
		} else if (ast.type === 'JSValue' || ast.type === 'Value') {
			cb(ast);
		}

		return;
	}

	for (const property of ast) {
		traverse(property, cb);
	}
};

export { traverse };
