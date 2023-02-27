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

  t: RendererInit['t'];
}

const Saves: VoidComponent<SavesProps> = (props) => {
  const setScreen = (screen: "mainmenu" | "game" | "saves") => props.setState('screen', screen)

  const [saves, { mutate }] = createResource(props.storage.get.bind(props.storage));

  const removeSave = (date: number) => {
    const data = saves();

    if (!data) return;

    for (let i = 0; i < data.saves.length; i++) {
      const current = data.saves[i];

      if (current[2][0] === date) {
        data.saves.splice(i, 1);
      }
    }

    props.storage.set(data).then(() => {
      mutate(() => ({ ...data }));
    });
  }

  return (
    <div
      classList={{
        [style.root]: true,
        [style.saves]: true
      }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button, style.buttonSaves)} onClick={() => setScreen('mainmenu')}>
          {props.t('GoBack')}
        </button>
      </div>
      <Show when={saves.state === 'ready'} fallback={<>{props.t('AtTheMomentTheSavesAre')} {saves.state}</>}>
        <Show when={saves()} fallback={props.t('NoSaves')}>
          <ol class={style.list}>
            <For each={saves()!.saves}>
              {save => {
                const [date, type] = save[2];

                const stringDate = capitalize(new Date(date).toLocaleDateString('ru', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
                const stringType = props.t(type === 'auto' ? 'Automatic' : 'Manual');

                return (
                  <li>
                    <button type="button" class={join(style.button, style.buttonSaves)} onClick={props.set.bind(props.set, save)} aria-label={props.t('LoadASaveFrom') + ' ' + stringDate}>
                      {stringDate}
                      <span style={{ "margin-left": '1em' }}>{stringType}</span>
                    </button>
                    <button type="reset" class={join(style.button, style.buttonSavesDelete)} aria-label={props.t('DeleteASaveFrom') + ' ' + stringDate} onClick={[removeSave, date]}>
                      <span>{props.t('Remove')}</span>
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