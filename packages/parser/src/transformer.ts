import type { Ast, AstNode } from './types';

const transform = (ast: Ast) => {
  let code = '($values1) => ({';

  const print_js_value = (value: Extract<AstNode, { type: "JSValue" }>) => {
    if (['undefined', 'null', 'window', 'globalThis'].some(reserved => value.content.startsWith(reserved))) {
      return value.content;
    }

    return `$values1.${value.content}`
  }

  const print_value = (value: Extract<AstNode, { type: "Value" }>) => {
    const numeralized = Number(value.content);

    if (isNaN(numeralized) || !isFinite(numeralized)) {
      return JSON.stringify(value.content)
    } else {
      return value.content;
    }
  }

  const print_map = (value: Extract<AstNode, { type: "Map" }>) => {
    let result = '{';

    for (const child of value.children) {
      result += print_map_item(child) + ',';
    }

    return result + '}'
  }

  const print_action = (value: Extract<AstNode, { type: "Action" }>) => {
    const children = value.children.map(child => {
      if (child.type === 'Value') {
        return print_value(child)
      } else if (child.type === 'JSValue') {
        return print_js_value(child)
      } else if (child.type === 'Map') {
        return print_map(child);
      }

      return '';
    });

    return `["${value.name}", ${children.join(',')}],`
  }

  const print_with_unknown_printer = (child: AstNode) => {
    if (child.type === 'Value') {
      return print_value(child)
    } else if (child.type === 'JSValue') {
      return print_js_value(child)
    } else if (child.type === 'Map') {
      return print_map(child);
    } else if (child.type === 'Action') {
      return print_action(child)
    } else {
      return '';
    }
  }

  const print_map_item = (value: Extract<AstNode, { type: "MapItem" }>) => {
    let result = value.name + ':[';

    for (const child of value.children) {
      result += print_with_unknown_printer(child) + ','
    }

    return result + ']'
  }

  for (const top of ast) {
    if (top.name === '') continue;

    code += top.name + ':['

    for (const child of top.children) {
      code += print_with_unknown_printer(child);
    }

    code += '],'
  }

  return code + '})';
}

export { transform }