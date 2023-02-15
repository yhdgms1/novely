import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { Storage } from '@novely/core'
import type { State } from '../renderer'

import { createResource, Show, For } from 'solid-js'

import { style } from '../styles/styles';

interface SavesProps {
  setState: SetStoreFunction<State>;

  storage: Storage;
}

const Saves: VoidComponent<SavesProps> = (props) => {
  const { setState, storage } = props;

  const setScreen = (screen: "mainmenu" | "game" | "saves") => setState('screen', screen)

  const [saves] = createResource(storage.get.bind(storage));

  return (
    <div
      classList={{
        [style.root]: true,
        [style.saves]: true
      }}
      style={{ "background-image": `url(https://i.imgur.com/FKvy1SO.png)` }}
    >
      <div class={style.controls}>
        <button type="button" onClick={() => setScreen('mainmenu')}>
          Назад
        </button>
      </div>
      <Show when={saves.state === 'ready'} fallback={<>В данный момент сохранения {saves.state}</>}>
        <Show when={saves().length > 0} fallback={<>Сохранений нет</>}>
          <div class={style.list}>
            <For each={saves()}>
              {save => {
                console.log(save);

                /**
                 * В данный момент сохранение одно, а должен быть массив
                 */
                return (
                  <>{JSON.stringify(save)}</>
                )
              }}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}

export { Saves }