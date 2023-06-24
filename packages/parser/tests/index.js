import { readFile } from 'fs/promises';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { parse, transform } from '../dist/index.js';

const input = await readFile('./tests/input.nvl', 'utf8');

test('parses', () => {
  assert.equal(
    parse(`start`),
    [
      {
        "type": "Property",
        "name": "start",
        "children": []
      }
    ]
  )

  assert.not.throws(() => parse(input))
})

test('transforms', () => {
  assert.equal(
    transform(parse(`start`)),
    `($values1) => ({start:[],})`
  )
})

console.log(transform(parse(input)))

test.run()