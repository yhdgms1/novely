import { readFile } from 'fs/promises';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { parse, print, transform, traverse } from '../dist/index.js';

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
		useWith: true,
	});

	// Code is valid
	assert.throws(() => eval(code), { message: 'Strict mode code may not include a with statement' });
});

test('print', () => {
	assert.not.throws(() => print(parse(input)));

	let temp = print(parse(input));

	for (let i = 0; i < 10; i++) {
		const res = print(parse(temp));

		assert.equal(temp, res);

		temp = res;
	}
});

test('traverse', async () => {
	const ast = parse(await readFile('./tests/ru.nvl', 'utf8'));

	traverse(ast, (node) => {
		if (node.type === 'Action' && node.name === 'dialog') {
			if (node.children.length >= 2) {
				const text = node.children[1];

				if (text.type === 'Value') {
					node.children[1] = {
						type: 'Map',
						children: [
							{
								type: 'MapItem',
								name: 'ru',
								children: [text],
							},
							{
								type: 'MapItem',
								name: 'en',
								children: [
									{
										type: 'Value',
										content: 'En',
									},
								],
							},
						],
					};
				}
			}
		}
	});

	assert.not.throws(() => print(ast));
});

test.run();
