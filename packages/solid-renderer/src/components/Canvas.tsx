import type { JSX, VoidComponent } from 'solid-js';
import { createEffect, createMemo, createSignal, onCleanup, onMount, splitProps, untrack } from 'solid-js';

type NativeCanvasProps = JSX.CanvasHTMLAttributes<HTMLCanvasElement>;
type CanvasProps = Omit<NativeCanvasProps, 'ref'> & {
  resize?: boolean;

  render: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, signal: AbortSignal) => void;
};

const Canvas: VoidComponent<CanvasProps> = (props) => {
  const [local, rest] = splitProps(props, ['resize', 'render']);

  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();
  const ctx = createMemo(() => canvas()?.getContext('2d'));

  let abortController = new AbortController();

  createEffect(() => {
    const canvasElement = canvas();
    const canvasContext = ctx();

    if (canvasElement && canvasContext) {
      abortController.abort();
      abortController = new AbortController();

      try {
        local.render(canvasElement, canvasContext, abortController.signal)
      } catch {}
    }
  })

  const onResize = () => {
    if (!local.resize) return;

    const canvasElement = untrack(canvas);
    const canvasContext = untrack(ctx);

    if (canvasElement) {
      canvasElement.width = window.innerWidth * devicePixelRatio;
      canvasElement.height = window.innerHeight * devicePixelRatio;

      if (canvasContext) {
        untrack(() => {
          abortController.abort();
          abortController = new AbortController();

          try {
            local.render(canvasElement, canvasContext, abortController.signal)
          } catch {}
        });
      }
    }
  }

  onMount(onResize);

  addEventListener('resize', onResize);

  onCleanup(() => {
    removeEventListener('resize', onResize)
  })

  return <canvas {...rest} ref={setCanvas} />;
}

export { Canvas }
