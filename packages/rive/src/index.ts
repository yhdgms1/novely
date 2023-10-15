import type { CustomHandler } from '@novely/core';

import * as rive from '@rive-app/canvas';
import { createCanvas2D } from './helpers';
import { hideNativeCharactersElement, insertCanvas } from './utils';

/**
 * Buffer is omited here because using it is not optimal
 */
type RiveOptions = Omit<rive.RiveParameters, 'buffer'> & { src: string };

/**
 * Callbacks for init method
 */
type Callbacks = {
  onResize: () => void;
}

/**
 * Unique ID for each rive instance
 */
type Id = string;

type SetupProvided = {
  module: typeof rive;
  canvas: HTMLCanvasElement;
  init: (options: RiveOptions, callbacks?: Partial<Callbacks>) => rive.Rive;
}

type Setup = (provided: SetupProvided) => void;

type Data = Record<
  Id,
  {
    canvas: HTMLCanvasElement;
    instance: rive.Rive;

    /**
     * Is currently shown
     */
    active: boolean;

    /**
     * Promise to know the loading state
     */
    loaded: Promise<rive.Rive>;
  }
>;

const show = (id: Id, setup: Setup) => {
  const handler: CustomHandler = async (get) => {
    const { data: dataChannel, root, element, clear } = get('rive', true);

    const data = dataChannel() as unknown as Data;

    if (id in data) {
      /**
       * Purpose of `show` is to activate the Rive, not to
       */
      return;
    }

    const canvas = createCanvas2D();

    let inited = false;

    let resolve: (instance: rive.Rive) => void;

    const loaded = new Promise<rive.Rive>(res => {
      resolve = res;
    });

    setup({
      module: rive,
      canvas,
      init(options, callbacks) {
        if (inited) return data[id].instance;

        inited = true;

        /**
         * Best for characters
         */
        if (!options.layout) {
          options.layout = new rive.Layout({
            fit: rive.Fit.Contain,
            alignment: rive.Alignment.BottomCenter,
          })
        }

        /**
         * Now Rive is inited
         */
        const instance = new rive.Rive({
          ...options,
          onLoad(event) {
            instance.resizeDrawingSurfaceToCanvas();

            if (options.onLoad) options.onLoad(event);

            resolve(instance);
          }
        });

        const updated = {
          ...data,
          [id]: {
            canvas,
            instance,
            loaded,

            active: true,
          }
        } satisfies Data;

        dataChannel(updated);

        const listener = () => {
          if (updated[id].active) {
            updated[id].instance.resizeDrawingSurfaceToCanvas();
            if (callbacks?.onResize) callbacks.onResize();
          }
        };

        addEventListener("resize", listener, false);
        clear(() => removeEventListener('resize', listener));

        return instance;
      }
    });

    hideNativeCharactersElement(root);
    insertCanvas(element, canvas);

    /**
     * Стоит ли ожидать пока загрузится? С одной стороны да, потому что иначе оно будет не вовремя появлятся, но ожидать это долго.
     * Ещё стоит подумать над тем чтобы загруза включала в себя и эти ассеты.
     */
    // await loaded;
  }

  handler.id = 'rive-control-' + id;
  handler.callOnlyLatest = true;
  handler.skipClearOnGoingBack = true;

  return ['custom', handler] as unknown as ['custom', [CustomHandler]];
}

show.pure = (id: Id, setup: Setup) => {
  return show(id, setup)[1] as unknown as CustomHandler;
}

const animate = (id: Id, name: string) => {
  const handler: CustomHandler = async (get) => {
    const { data: dataChannel } = get('rive', true);

    const data = dataChannel() as unknown as Data;

    if (!(id in data)) {
      throw new Error('before using `animate` first call the `show` and make sure same ID is used')
    }

    data[id].loaded.then(rive => {
      data[id].active = true;

      rive.play(name);

      const parent = data[id].canvas.parentElement;

      if (!parent) return;

      parent.style.display = 'block';
    })
  }

  handler.id = 'rive-change-' + id;
  handler.callOnlyLatest = true;
  handler.skipClearOnGoingBack = true;

  return ['custom', handler] as unknown as ['custom', [CustomHandler]]
}

const hide = (id: Id) => {
  const handler: CustomHandler = async (get) => {
    const { data: dataChannel } = get('rive', true);

    const data = dataChannel() as unknown as Data;

    if (!(id in data)) {
      throw new Error('before using `hide` first call the `show` and make sure same ID is used')
    }

    data[id].loaded.then(rive => {
      data[id].active = false;

      rive.stop();

      const parent = data[id].canvas.parentElement;

      if (!parent) return;

      parent.style.display = 'none';
    });
  }

  handler.id = 'rive-control-' + id;
  handler.callOnlyLatest = true;
  handler.skipClearOnGoingBack = true;

  return ['custom', handler] as unknown as ['custom', [CustomHandler]]
}

const remove = () => {}

export { show, animate, hide, remove }
