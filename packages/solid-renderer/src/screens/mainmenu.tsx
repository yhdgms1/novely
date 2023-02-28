import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'
import { join } from '../utils'
import { useData } from '../context'

import { style } from '../styles/styles';

interface MainMenuProps {
  setState: SetStoreFunction<State>;
}

const MainMenu: VoidComponent<MainMenuProps> = (props) => {
  const data = useData()!;

  return (
    <div
      classList={{
        [style.root]: true,
        [style.mainMenu]: true
      }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={data.options.newGame}>
          {data.t('NewGame')}
        </button>
        <button type="button" class={join(style.button, style.buttonMainMenu)} onClick={() => data.options.restore()}>
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