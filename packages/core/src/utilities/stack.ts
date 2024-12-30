import { memoize } from 'es-toolkit/function';
import type { Context, Renderer } from '../renderer';
import type { Save, StackHolder, UseStackFunctionReturnType } from '../types';
import { STACK_MAP } from '../shared';

const getStack = memoize(
	(_: Context) => {
		return [] as unknown as StackHolder;
	},
	{
		cache: STACK_MAP,
		getCacheKey: (ctx) => ctx.id,
	},
);

const createUseStackFunction = (renderer: Renderer) => {
	const useStack = (context: Context | string): UseStackFunctionReturnType => {
		const ctx = typeof context === 'string' ? renderer.getContext(context) : context;
		const stack = getStack(ctx);

		return {
			get previous() {
				return stack.previous;
			},
			get value() {
				return stack.at(-1)!;
			},
			set value(value) {
				stack[stack.length - 1] = value;
			},

			back() {
				stack.previous = stack.length > 1 ? stack.pop() : this.value;
				ctx.meta.goingBack = true;
			},
			push(value: Save) {
				stack.push(value);
			},
			clear() {
				stack.previous = undefined;

				stack.length = 0;
				stack.length = 1;
			},
		};
	};

	return useStack;
};

export { getStack, createUseStackFunction };
