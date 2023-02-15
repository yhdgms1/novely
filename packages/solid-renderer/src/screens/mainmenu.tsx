import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { State } from '../renderer'
import type { RendererInit, Storage } from '@novely/core'

import { style } from '../styles/styles';

interface MainMenuProps {
  setState: SetStoreFunction<State>;

  restore: RendererInit['restore'];
  storage: Storage
}

const MainMenu: VoidComponent<MainMenuProps> = (props) => {
  const restore = props.restore.bind(props.restore, undefined);
  const setScreen = (screen: "mainmenu" | "game" | "saves") => props.setState('screen', screen);

  const newGame = () => {
    props.storage.get().then(prev => {
      /**
       * Новая пустая история
       */
      prev.push([[[null, 'start'], [null, 0]], {}, [Date.now(), 'manual']]);

      props.storage.set(prev).then(restore);
    });
  }

  return (
    <div
      classList={{
        [style.root]: true,
        [style.mainMenu]: true
      }}
      style={{ "background-image": `url(https://i.imgur.com/FKvy1SO.png)` }}
    >
      <div class={style.controls}>
        <button type="button" onClick={newGame}>
          Новая игра
        </button>
        <button type="button" onClick={restore}>
          Загрузить
        </button>
        <button type="button" onClick={() => setScreen('saves')}>
          Сохранения
        </button>
      </div>
    </div>
  )
}

export { MainMenu }