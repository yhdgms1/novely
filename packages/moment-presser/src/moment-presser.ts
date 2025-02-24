import type { CustomHandler, Lang, State, StateFunction, EngineTypes } from '@novely/core';
import { createButton } from './button';
import { parseVariables } from './css-variables';
import { once } from './once';
import { startRender } from './render';

const MOMENT_PRESSER_ID = Symbol();

type MomentPresserOptions<$Lang extends Lang, $State extends State> = {
	translation?: {
		[L in $Lang & string]: {
			stop: string;
		};
	};

	onPressed?: (state: StateFunction<$State>, pressState: 'PERFECT' | 'PASS' | 'MISS') => void;
};

const momentPresser = (options: MomentPresserOptions<Lang, State> = {}) => {
	const fn: CustomHandler = ({ getDomNodes, clear, remove, state, paused, lang, flags: { preview } }) => {
		const { promise, resolve } = Promise.withResolvers<void>();

		const { element } = getDomNodes(true);

		const canvas = document.createElement('canvas');
		const staticCanvas = document.createElement('canvas');

		const ctx = canvas.getContext('2d');
		const staticCtx = staticCanvas.getContext('2d');

		if (!ctx || !staticCtx) return;

		canvas.width = staticCanvas.width = element.getBoundingClientRect().width * devicePixelRatio;
		canvas.height = staticCanvas.height = canvas.width / 2;

		/**
		 * Позиционируем так, чтобы не перекрывался бегунок
		 */
		staticCanvas.style.zIndex = '-1';

		const button = createButton({
			label: options.translation ? options.translation[lang].stop : 'Stop',
		});

		element.appendChild(canvas);
		element.appendChild(staticCanvas);
		element.appendChild(button);

		const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
		const variables = parseVariables(element);

		const { stop, start, getState } = startRender({
			variables,
			fontSize,

			preview,

			ctx,
			staticCtx,

			set: (start) => {
				state({ $$momentPresserStart: start });
			},
			get: () => {
				return state().$$momentPresserStart;
			},
		});

		const cleanup = once(() => {
			stop();

			button.removeEventListener('click', onButtonClick);

			canvas.remove();
			staticCanvas.remove();
			button.remove();
		});

		const onButtonClick = once(() => {
			if (preview) return;

			options.onPressed?.(state, getState());

			state({ $$momentPresserStart: undefined });

			cleanup();
			resolve();

			remove();
		});

		button.addEventListener('click', onButtonClick);

		const unsub = paused.subscribe((paused) => {
			if (paused) {
				stop();
			} else {
				start();
			}
		});

		clear(() => {
			cleanup();
			unsub();
		});

		if (preview) {
			resolve();
		}

		return promise;
	};

	fn.id = MOMENT_PRESSER_ID;
	fn.key = 'moment-presser';
	fn.requireUserAction = true;
	fn.callOnlyLatest = true;

	return fn;
};

type CreateMomentPresserOptions<T> = T extends EngineTypes<infer $Lang, infer $State, any, any>
	? MomentPresserOptions<$Lang, $State>
	: never;

const createMomentPresser = <T>(options: CreateMomentPresserOptions<T>) => {
	return momentPresser(options);
};

export { createMomentPresser, momentPresser };
export type { MomentPresserOptions, CreateMomentPresserOptions };
