import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'
import type { RendererInit, Storage } from '@novely/core'
import { join } from '../utils'
import { useData } from '../context'

import { style } from '../styles/styles';

interface MainMenuProps {
  setState: SetStoreFunction<State>;

  restore: RendererInit['restore'];
  storage: Storage
  t: RendererInit['t'];
}

const MainMenu: VoidComponent<MainMenuProps> = (props) => {
  const data = useData()!;

  const newGame = () => {
    data.storeDataUpdate(prev => {
      /**
       * Новая пустая история
       * todo: брать из констат
       */
      prev.saves.push([[[null, 'start'], [null, 0]], {}, [Date.now(), 'manual']]);

      return props.restore(prev.saves.at(-1)), prev;
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
          {data.t('NewGame')}
        </button>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={() => props.restore()}>
          {data.t('LoadSave')}
        </button>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={() => props.setState('screen', 'saves')}>
          {data.t('Saves')}
        </button>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={() => props.setState('screen', 'settings')}>
          {data.t('Settings')}
        </button>
      </div >
    </div >
  )
}

export { MainMenu }