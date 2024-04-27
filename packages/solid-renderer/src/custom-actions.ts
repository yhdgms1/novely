import type { CustomHandler, ValidAction, ActionProxy, Character, Lang, State } from "@novely/core";
import { PRELOADED_IMAGE_MAP } from './shared';
import { canvasDrawImages, createImage } from "$utils";

const SHOW_ARBITARY_CHARACTER = Symbol();

type ShowArbitraryCharacterParams<$Characters extends Record<string, Character<Lang>>, $Character extends keyof $Characters> = {
  id: $Character & string;
  emotion: keyof $Characters[$Character]['emotions'] & string;

  extendWith: () => string | string[];

  classes?: string;
  style?: string;
}

const getActions = <$Lang extends Lang, $Characters extends Record<string, Character<$Lang>>, $State extends State>(_: ActionProxy<$Characters, $Lang, $State>) => {
  const showArbitraryCharacter = <$Character extends keyof $Characters>(params: ShowArbitraryCharacterParams<$Characters, $Character>) => {
    const handler: CustomHandler = ({ get }) => {
      const { clear, __internals } = get(false);
      const { ctx } = __internals;

      const handle = ctx.character(params.id);

      handle.append(params.classes, params.style, ctx.meta.restoring);
      handle.emotion(params.emotion, true);

      const extension = (e => Array.isArray(e) ? e : [e])(params.extendWith());

      canvasDrawImages(handle.canvas, handle.ctx, extension.map((src) => PRELOADED_IMAGE_MAP.get(src) || createImage(src)));

      // idk
      clear(() => handle.ctx.clearRect(0, 0, handle.canvas.width, handle.canvas.height));
    }

    handler.id = SHOW_ARBITARY_CHARACTER;
    handler.key = params.id;
    handler.callOnlyLatest = true;

    return ['custom', handler] as ValidAction;
  }

  return {
    showArbitraryCharacter
  }
}

export { getActions }
