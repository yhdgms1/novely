import type { Ast, AstNode } from './types';
import { NEW_LINE } from './constants';

const parse_line = (str: string) => {
  let ident = 0;

  while ((str.slice(0, 2)) === '  ') {
    ident += 1;
    str = str.slice(2, str.length);
  }

  return { ident, content: str }
}

const push = <T>(list: unknown, item: T) => {
  if (list && typeof list === 'object' && 'children' in list && Array.isArray(list.children)) {
    list.children.push(item)
  } else if (Array.isArray(list)) {
    list.push(item);
  } else if (list && typeof list === 'object' && 'content' in list && typeof list.content === 'string' && item && typeof item === 'object' && 'content' in item && typeof item.content === 'string') {
    list.content += NEW_LINE + item.content;
  }

  return item;
}

const parse = (source: string) => {
  const lines = source.split(NEW_LINE);
  const ast: Ast = [];

  const elevator: AstNode[] = [];

  const parse_expression = (expression: string, parent: AstNode | undefined): AstNode => {
    if (expression.startsWith('!')) {
      const [name, ...items] = expression.slice(1).split(' ');

      const content = items.join(' ');

      const matches = Array.from(content.matchAll(/(?:"([^"]*)")|([^"\s]+)/gm)).map(([_, one, two]) => one || two).map(match => {
        if (match.startsWith('%')) {
          return {
            type: 'JSValue',
            content: match.slice(1)
          };
        }

        return {
          type: 'Value',
          content: match
        };
      }) as Extract<AstNode, { type: 'Value' | 'JSValue' }>[]

      return {
        type: 'Action',
        name: name,
        children: matches
      }
    } else if (expression === '*') {
      return {
        type: 'Map',
        children: []
      }
    } else if (expression.startsWith('%')) {
      return {
        type: 'JSValue',
        content: expression.slice(1)
      }
    } else if (expression.startsWith('\\')) {
      return {
        type: 'Value',
        content: expression.slice(1)
      }
    } else if (parent?.type === 'Map') {
      return {
        type: 'MapItem',
        name: expression,
        children: []
      }
    } else {
      return {
        type: 'Value',
        content: expression
      }
    }
  }

  for (const line of lines) {
    const { ident, content } = parse_line(line);

    if (ident === 0) {
      elevator[ident] = push(ast, {
        type: 'Property',
        name: content,
        children: []
      });

      continue;
    }

    const expression = parse_expression(content, elevator[ident - 1]);

    elevator[ident] = push(elevator[ident - 1], expression)
  }

  return ast;
}

export { parse }