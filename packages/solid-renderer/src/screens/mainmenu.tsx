import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State, SolidRendererStore } from '../renderer'

import { style } from '../styles/styles';

interface MainMenuProps {
  setState: SetStoreFunction<State>;
}

const MainMenu: VoidComponent<MainMenuProps> = (props) => {
  const { setState } = props;

  // todo: заменить всю эту чепуху

  return (
    <div
      classList={{
        [style.root]: true,
        [style.mainMenu]: true
      }}
      style={{ "background-image": `url(https://i.imgur.com/FKvy1SO.png)` }}
    >
      <div class={style.controls}>
        <button type="button" onClick={() => {
          localStorage.setItem('novely-', JSON.stringify([[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto']]));
          // setState('screen', 'game');
          window.restore();
        }}>
          Новая игра
        </button>
        <button type="button" onClick={() => {
          // боже

          window.restore();
          // setState('screen', 'game')
        }}>
          Загрузить
        </button>
      </div>
    </div>
  )
}

export { MainMenu }