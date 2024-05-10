import type { CustomHandler, StateFunction, State, TypeEssentials, Lang } from '@novely/core';
import { startRender } from './render'
import { createButton } from './button';
import { once } from './once';
import { parseVariables } from './css-variables';

const MOMENT_PRESSER_ID = Symbol();

type MomentPresserOptions<$Lang extends Lang, $State extends State> = {
  translation?: {
    [L in $Lang & string]: {
      stop: string;
    }
  }

  onPressed?: (state: StateFunction<$State>, pressState: 'PERFECT' | 'PASS' | 'MISS') => void;
}

const momentPresser = (options: MomentPresserOptions<Lang, State> = {}) => {
  const fn: CustomHandler = ({ get, lang, preview, state }) => {
    return new Promise(resolve => {
      const { element, clear, remove } = get(true);

      const canvas = document.createElement('canvas');
      const staticCanvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const staticCtx = staticCanvas.getContext('2d');

      canvas.width = staticCanvas.width = element.getBoundingClientRect().width * devicePixelRatio;
      canvas.height = staticCanvas.height = canvas.width / 2;

      /**
       * Позиционируем так, чтобы не перекрывался бегунок
       */
      staticCanvas.style.zIndex = '-1';

      if (!ctx || !staticCtx) return;

      const button = createButton({
        label: options.translation ? options.translation[lang].stop : 'Stop',
      })

      element.appendChild(canvas);
      element.appendChild(staticCanvas);
      element.appendChild(button);

      const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
      const variables = parseVariables(element);

      const { stop, getState } = startRender({
        variables,
        fontSize,

        preview,

        canvas,
        ctx,

        staticCanvas,
        staticCtx,

        set: (start) => {
          state({ $$momentPresserStart: start });
        },
        get: () => {
          return state().$$momentPresserStart;
        }
      });

      const cleanup = once(() => {
        stop();

        button.removeEventListener('click', onButtonClick)

        canvas.remove();
        staticCanvas.remove();
        button.remove();
      })

      const onButtonClick = once(() => {
        if (preview) return;

        options.onPressed?.(state, getState());

        state({ $$momentPresserStart: undefined });

        cleanup();
        resolve();

        remove();
      })

      button.addEventListener('click', onButtonClick)

      clear(cleanup)

      if (preview) {
        resolve();
      }
    })
  }

  fn.id = MOMENT_PRESSER_ID;
  fn.key = 'moment-presser';
  fn.requireUserAction = true;
  fn.callOnlyLatest = true;

  return fn;
}

type CreateMomentPresserOptions<T> = T extends TypeEssentials<infer $Lang, infer $State, any, any> ? MomentPresserOptions<$Lang, $State> : never;

const createMomentPresser = <T>(options: CreateMomentPresserOptions<T>) => {
  return momentPresser(options);
}

export { createMomentPresser, momentPresser }
export type { MomentPresserOptions, CreateMomentPresserOptions }
