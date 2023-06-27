import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'
import { useData } from '../context'

interface MainMenuProps {
  setState: SetStoreFunction<State>;
}

const MainMenu: VoidComponent<MainMenuProps> = (props) => {
  const data = useData();

  return (
    <div class="root main-menu">
      <button type="button" class="button main-menu__button" onClick={data.options.newGame}>
        {data.t('NewGame')}
      </button>
      <button type="button" class="button main-menu__button" onClick={() => data.options.restore()}>
        {data.t('LoadSave')}
      </button>
      <button type="button" class="button main-menu__button" onClick={() => props.setState('screen', 'saves')}>
        {data.t('Saves')}
      </button>
      <button type="button" class="button main-menu__button" onClick={() => props.setState('screen', 'settings')}>
        {data.t('Settings')}
      </button>
    </div>
  )
}

export { MainMenu }