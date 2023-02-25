import * as CSS from 'csstype';

const createStyleSheet = () => {
  /**
   * Create `style` element
   */
  const style = document.createElement('style');

  /**
   * Append style element to the <head></head>
   */
  document.head.appendChild(style);

  return style;
}

let i = 0;

type StylePseudos = {
  [P in CSS.SimplePseudos as `&${P}`]?: CSS.Properties;
};

type StyleInherit = {
 [P in `&${string}`]?: CSS.Properties; 
}

type StyleAtRules = {
  [A in Extract<CSS.AtRules, '@media'> as `${A} ${string}`]?: StylePseudos & StyleInherit & StyleProperties;
};

type StyleProperties = CSS.Properties;

type Style = StyleProperties & StylePseudos & StyleInherit & StyleAtRules;

const css = (properties: Style, _c?: string, _m?: string) => { 
  let sh = createStyleSheet().sheet;

  let c = _c || 'n-' + i++;
  let s = '.' + c + '{';

  if (_m) sh!.media.appendMedium(_m);

  for (let _key in properties) {
    let value = properties[_key as any] as unknown as Style;

    if (/^@/.test(_key)) {
      css(value, c, _key.slice(6));
    } else if (/&/g.test(_key)) {
      css(value, _key.replace(/&/g, c));
    } else {
      s += _key.replace(/[A-Z]/g, (str) => '-' + str.toLowerCase()) + ':' + value + ';';
    }
  }

  s += '}';

  sh!.insertRule(s);

  return c;
}


export { css }