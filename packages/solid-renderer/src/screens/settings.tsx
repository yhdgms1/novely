import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { Storage, RendererInit } from '@novely/core'
import type { State } from '../renderer'

import { createResource, Show, For } from 'solid-js'
import { capitalize } from '../utils'

import { join } from '../utils'
import { style } from '../styles/styles';

interface SettingsProps {
  setState: SetStoreFunction<State>;

  storage: Storage;
}

const Settings: VoidComponent<SettingsProps> = (props) => {
  const setScreen = (screen: "mainmenu" | "game" | "saves" | "settings") => props.setState('screen', screen)

  const [saves, { mutate }] = createResource(props.storage.get.bind(props.storage));

  return (
    <div
      classList={{
        [style.root]: true,
        [style.settings]: true
      }}
      style={{ "background-image": `url(https://i.imgur.com/FKvy1SO.png)` }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button)} onClick={() => setScreen('mainmenu')}>
          Главный экран
        </button>
        <button type="button" class={join(style.button)} onClick={() => setScreen('mainmenu')}>
          К игре
        </button>
        <Show when={saves.state === 'ready'} fallback={<>В данный момент сохранения {saves.state}</>}>
          <Show when={saves()} fallback={<>Сохранений нет</>}>
            {() => {
              const latest = saves()!.at(-1)!;

              return (
                <div>
                  <select name="" id="" onChange={e => {
                    // @ts-ignore
                    const val = e.target.value as string;


                    // mutate
                    const data = saves()!;

                    data[data.length - 1][2][2] = val;

                    props.storage.set(data).then(() => {
                      mutate(() => [...data]);
                    });
                  }}>
                    <option value="ru">Russian</option>
                    <option value="en">English</option>
                  </select>
                  <textarea name="" id="" cols="30" rows="10" readOnly>
                    {JSON.stringify(latest)}
                  </textarea>
                </div>
              )
            }}
          </Show>
        </Show>
      </div>
    </div>
  )
}

export { Settings }