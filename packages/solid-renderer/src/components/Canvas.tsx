import type { JSX, VoidComponent } from 'solid-js';
import { createEffect, createMemo, createSignal, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import { throttle } from 'es-toolkit/function';

type NativeCanvasProps = JSX.CanvasHTMLAttributes<HTMLCanvasElement>;
type CanvasProps = Omit<NativeCanvasProps, 'ref'> & {
	resize?: boolean;
	throttle?: number;

	render: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
};

const Canvas: VoidComponent<CanvasProps> = (props) => {
	const [local, rest] = splitProps(props, ['resize', 'throttle', 'render']);

	const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();
	const ctx = createMemo(() => {
		const canvasElement = canvas();

		if (!canvasElement) {
			return null;
		}

		return canvasElement.getContext('2d');
	});

	createEffect(() => {
		const canvasElement = canvas();
		const canvasContext = ctx();

		if (canvasElement && canvasContext) {
			try {
				local.render(canvasElement, canvasContext);
			} catch {}
		}
	});

	const onResize = () => {
		if (!local.resize) return;

		const canvasElement = untrack(canvas);
		const canvasContext = untrack(ctx);

		if (canvasElement) {
			canvasElement.width = window.innerWidth * devicePixelRatio;
			canvasElement.height = window.innerHeight * devicePixelRatio;

			if (canvasContext) {
				untrack(() => {
					try {
						local.render(canvasElement, canvasContext);
					} catch {}
				});
			}
		}
	};

	const onResizeThrottled = local.throttle ? throttle(onResize, local.throttle) : onResize;

	onMount(onResize);

	addEventListener('resize', onResizeThrottled);

	onCleanup(() => {
		removeEventListener('resize', onResizeThrottled);
	});

	return <canvas {...rest} ref={setCanvas} />;
};

export { Canvas };
