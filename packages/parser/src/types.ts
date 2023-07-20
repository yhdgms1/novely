type AstNode =
	| {
			type: 'Property';
			name: string;
			children: Exclude<AstNode, { type: 'Property' | 'MapItem' }>[];
	  }
	| {
			type: 'Action';
			name: string;
			children: Extract<AstNode, { type: 'JSValue' | 'Value' | 'Map' }>[];
	  }
	| {
			type: 'JSValue';
			content: string;
	  }
	| {
			type: 'Value';
			content: string;
	  }
	| {
			type: 'Map';
			children: Extract<AstNode, { type: 'MapItem' }>[];
	  }
	| {
			type: 'MapItem';
			name: string;
			children: Exclude<AstNode, { type: 'Property' | 'MapItem' }>[];
	  }
	| {
			type: 'Array';
			children: Exclude<AstNode, { type: 'Property' | 'MapItem' }>[];
	  };

type Ast = Extract<AstNode, { type: 'Property' }>[];

type TransformOptions = {
	rewrites?: Record<string, string>;
};

export type { AstNode, Ast, TransformOptions };
