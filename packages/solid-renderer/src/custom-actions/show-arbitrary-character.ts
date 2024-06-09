import type { CustomHandler, ValidAction, Character, Lang } from "@novely/core";
import { PRELOADED_IMAGE_MAP } from '../shared';
import { canvasDrawImages, createImage } from "$utils";

const SHOW_ARBITARY_CHARACTER = Symbol();

type ShowArbitraryCharacterParams<$Characters extends Record<string, Character<Lang>>, $Character extends keyof $Characters> = {
  id: $Character & string;
  emotion: keyof $Characters[$Character]['emotions'] & string;

  extendWith: () => string | string[];

  classes?: string;
  style?: string;
}

const createShowArbitraryCharacterAction = <$Characters extends Record<string, Character>>(_: $Characters) => {
  const showArbitraryCharacter = <$Character extends keyof $Characters>(params: ShowArbitraryCharacterParams<$Characters, $Character>) => {
    const handler: CustomHandler = ({ rendererContext }) => {
      const handle = rendererContext.character(params.id);

      handle.append(params.classes, params.style, rendererContext.meta.restoring);
      handle.emotion(params.emotion, true);

      const extension = (e => Array.isArray(e) ? e : [e])(params.extendWith());

      canvasDrawImages(handle.canvas, handle.ctx, extension.map((src) => PRELOADED_IMAGE_MAP.get(src) || createImage(src)));
    }

    handler.id = SHOW_ARBITARY_CHARACTER;
    handler.key = params.id;
    handler.callOnlyLatest = true;

    return ['custom', handler] as ValidAction;
  }

  return showArbitraryCharacter;
}

export { createShowArbitraryCharacterAction }
