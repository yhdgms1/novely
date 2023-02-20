/**
 * Our regex
 */
const rx = /{(.*?)}/g;
/**
 * Rosetta's regex, except the last `}` is ignored
 */
const rrx = /{{(.*?)}/g;

/**
 * Changes `{str:var}` to `{{var}}`
 */
const transform = (value: string) => {
  return value.replace(rx, (val) => {
    if (rrx.test(val)) return val;

    return '{{' + val.slice(1, -1).split(':').slice(1).join(':') + '}}'
  });
}

export { transform }