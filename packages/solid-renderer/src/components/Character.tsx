import type { CharacterHandle } from '@novely/core'
import type { State } from '../renderer';
import type { VoidComponent } from 'solid-js';

import { createEffect } from 'solid-js';

interface CharacterProps {
  character: string;
  characters: Record<string, CharacterHandle>;
  data: State['characters'][keyof State['characters']]
}

const Character: VoidComponent<CharacterProps> = (props) => {
  const canvas = () => props.characters[props.character].canvas;

  createEffect(() => {
    void canvas().offsetWidth;

    if (props.data.className) canvas().classList.value = props.data.className;
    if (props.data.style) canvas().style.cssText = props.data.style;
  });

  return canvas()
}

export { Character }