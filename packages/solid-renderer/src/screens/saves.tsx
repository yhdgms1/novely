import type { VoidComponent } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { Storage, RendererInit } from '@novely/core'
import type { State } from '../renderer'

import { createResource, Show, For } from 'solid-js'
import { capitalize } from '../utils'

import { join } from '../utils'
import { style } from '../styles/styles';

interface SavesProps {
  setState: SetStoreFunction<State>;

  storage: Storage;
  set: RendererInit['set'];
}

const Saves: VoidComponent<SavesProps> = (props) => {
  const setScreen = (screen: "mainmenu" | "game" | "saves") => props.setState('screen', screen)

  const [saves, { mutate }] = createResource(props.storage.get.bind(props.storage));

  const removeSave = (date: number) => {
    const data = saves();

    if (!data) return;

    for (let i = 0; i < data.length; i++) {
      const current = data[i];

      if (current[2][0] === date) {
        data.splice(i, 1);
      }
    }

    props.storage.set(data).then(() => {
      mutate(() => [...data]);
    });
  }

  return (
    <div
      classList={{
        [style.root]: true,
        [style.saves]: true
      }}
      style={{ "background-image": `url(https://i.imgur.com/FKvy1SO.png)` }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button, style.buttonSaves)} onClick={() => setScreen('mainmenu')}>
          Назад
        </button>
      </div>
      <Show when={saves.state === 'ready'} fallback={<>В данный момент сохранения {saves.state}</>}>
        <Show when={saves()} fallback={<>Сохранений нет</>}>
          <ol class={style.list}>
            <For each={saves()}>
              {save => {
                const [date, type] = save[2];

                const stringDate = capitalize(new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
                const stringType = type === 'auto' ? <>Автоматическое</> : <>Ручное</>;

                return (
                  <li>
                    <button type="button" class={join(style.button, style.buttonSaves)} onClick={props.set.bind(props.set, save)} aria-label={"Загрузить сохранение от " + stringDate}>
                      {stringDate}
                      <span style={{ "margin-left": '1em' }}>{stringType}</span>
                    </button>
                    <button type="reset" class={join(style.button, style.buttonSavesDelete)} aria-label={'Удалить сохранение от ' + stringDate} onClick={[removeSave, date]}>
                      <span>Удалить</span>
                    </button>
                  </li>
                )
              }}
            </For>
          </ol>
        </Show>
      </Show>
    </div>
  )
}

export { Saves }