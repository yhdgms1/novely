import { deepmerge } from '../dist/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('no prototype poisoning', () => {
	const o0 = {};
	const o1 = { __proto__: { admin: true } };

	const merged = deepmerge(o0, o1);

	assert.not(merged.__proto__.admin);
	assert.not(merged.admin);
});

test('all test are written', () => {
	assert.equal(true, false);
});

test.run();
