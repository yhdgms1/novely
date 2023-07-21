import { readFile } from 'fs/promises';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { parse, transform } from '../dist/index.js';

const input = await readFile('./tests/input.nvl', 'utf8');

test('parses', () => {
	assert.equal(parse(`start`), [
		{
			type: 'Property',
			name: 'start',
			children: [],
		},
	]);

	assert.not.throws(() => parse(input));
});

test('transforms', () => {
	assert.equal(transform(parse(`start`)), `($values1) => ({start:[],})`);
});

console.log(transform(parse(input)));

test('with works', async () => {
	const code = transform(parse(await readFile('./tests/with.nvl', 'utf8')), {
		useWith: true
	});

	// Code is valid
	assert.throws(() => eval(code), { message: "Strict mode code may not include a with statement" })
})

test.run();
