import { readFile } from 'fs/promises';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { parse, print, transform } from '../dist/index.js';

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

// console.log(transform(parse(input)));

test('with works', async () => {
	const code = transform(parse(await readFile('./tests/with.nvl', 'utf8')), {
		useWith: true
	});

	// Code is valid
	assert.throws(() => eval(code), { message: "Strict mode code may not include a with statement" })
})

test('print', () => {
	assert.not.throws(() => print(parse(input)));

	let temp = print(parse(input));

	for (let i = 0; i < 10; i++) {
		assert.equal(temp, print(parse(temp)));
	}
})

console.log(print(parse(input)))

test.run();
