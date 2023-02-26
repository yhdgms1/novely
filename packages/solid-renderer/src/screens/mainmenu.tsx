import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'
import type { RendererInit, Storage } from '@novely/core'

import { join } from '../utils'
import { style } from '../styles/styles';

interface MainMenuProps {
  setState: SetStoreFunction<State>;

  restore: RendererInit['restore'];
  storage: Storage
  t: RendererInit['t'];
}

const MainMenu: VoidComponent<MainMenuProps> = (props) => {
  const restore = props.restore.bind(props.restore, undefined);
  const setScreen = (screen: "mainmenu" | "game" | "saves" | "settings") => props.setState('screen', screen);

  const newGame = () => {
    props.storage.get().then(prev => {
      /**
       * Новая пустая история
       * todo: брать из констат
       */
      prev.saves.push([[[null, 'start'], [null, 0]], {}, [Date.now(), 'manual']]);

      props.storage.set(prev).then(restore);
    });
  }

  return (
    <div
      classList={{
        [style.root]: true,
        [style.mainMenu]: true
      }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={newGame}>
          {props.t('NewGame')}
        </button>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={restore}>
          {props.t('LoadSave')}
        </button>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={() => setScreen('saves')}>
          {props.t('Saves')}
        </button>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={() => setScreen('settings')}>
          {props.t('Settings')}
        </button>
      </div>
    </div>
  )
}

export { MainMenu }