import type { CustomHandler, DefaultActionProxy } from '../action';
import type { Thenable, State } from '../types';
import type { Context } from '../renderer';

type MatchActionParams = {
	data: State;
	ctx: Context;

	push: () => void;
	forward: () => void;
};

type MatchActionMap = {
	[Key in keyof DefaultActionProxy]: (
		params: MatchActionParams,
		data: Parameters<DefaultActionProxy[Key]>,
	) => void;
};

type MatchActionMapComplete = Omit<MatchActionMap, 'custom'> & {
	custom: (params: MatchActionParams, value: [handler: CustomHandler]) => Thenable<void>;
};

type MatchActionParameters = {
	/**
	 * Name of context or context
	 */
	ctx: string | Context;
	/**
	 * Data from the save
	 */
	data: State;
};

type OnBeforeActionCallPayload = {
	action: keyof MatchActionMapComplete;
	props: Parameters<DefaultActionProxy[keyof MatchActionMapComplete]>;
	ctx: Context;
};

type MatchActionHandlers = {
	push: (ctx: Context) => void;
	forward: (ctx: Context) => void;

	getContext: (name: string) => Context;

	onBeforeActionCall: (payload: OnBeforeActionCallPayload) => void;
};

const matchAction = (callbacks: MatchActionHandlers, values: MatchActionMapComplete) => {
	const { getContext, onBeforeActionCall, push, forward } = callbacks;

	const match = (action: keyof MatchActionMapComplete, props: any, { ctx, data }: MatchActionParameters) => {
		const context = typeof ctx === 'string' ? getContext(ctx) : ctx;

		onBeforeActionCall({
			action,
			props,
			ctx: context,
		});

		return values[action](
			{
				ctx: context,
				data,

				push() {
					if (context.meta.preview) return;

					push(context);
				},
				forward() {
					if (context.meta.preview) return;

					forward(context);
				},
			},
			props,
		);
	};

	return {
		match,
		nativeActions: Object.keys(values),
	};
};

export { matchAction };
export type { MatchActionHandlers, MatchActionMapComplete };
