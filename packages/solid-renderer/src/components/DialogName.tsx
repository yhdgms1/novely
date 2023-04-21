import type { Character } from '@novely/core'
import type { VoidComponent } from 'solid-js';
import { style } from '../styles/styles';

interface DialogNameProps {
  character?: string;
  characters: Record<string, Character>;
  lang: string;
}

const DialogName: VoidComponent<DialogNameProps> = (props) => {
  const color = () => {
    const c = props.character;
    const cs = props.characters;

    return c ? c in cs ? cs[c].color : '#000' : '#000';
  }

  const name = () => {
    const c = props.character;
    const cs = props.characters;

    return c ? c in cs ? typeof cs[c].name === 'string' ? cs[c].name as string : (cs[c].name as Record<string, string>)[props.lang] : c : '';
  }

  return (
    <span
      class={style.dialogName}
      style={{
        color: color(),
        opacity: props.character ? 1 : 0,
        visibility: props.character ? 'visible' : 'hidden',
      }}
    >
      {name() || <>ᅠ</>}
    </span>
  )
}

export { DialogName }