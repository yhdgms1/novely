import type { VoidComponent, JSX } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'
import type { Storage, RendererInit } from '@novely/core'
import type { State } from '../renderer'

import { createResource, Show, For, createUniqueId } from 'solid-js'
import { capitalize } from '../utils'

import { join } from '../utils'
import { style } from '../styles/styles';

interface SettingsProps {
  setState: SetStoreFunction<State>;
  restore: RendererInit['restore'];

  storage: Storage;

  languages: string[];
}

const Settings: VoidComponent<SettingsProps> = (props) => {
  const setScreen = (screen: "mainmenu" | "game" | "saves" | "settings" | 'loading') => props.setState('screen', screen)

  const [saves] = createResource(props.storage.get.bind(props.storage));

  const onSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = (e) => {
    const selected = e.currentTarget.value;

    const data = saves()!;

    data[data.length - 1][2][2] = selected;

    setScreen('loading');
    props.storage.set(data).then(() => setScreen('settings'));
  }

  const id = createUniqueId();

  return (
    <div
      classList={{
        [style.root]: true,
        [style.settings]: true
      }}
    >
      <div class={style.controls}>
        <button type="button" class={join(style.button, style.buttonSettings)} onClick={() => setScreen('mainmenu')}>
          Главный экран
        </button>
        <button type="button" class={join(style.button, style.buttonSettings)} onClick={() => props.restore()}>
          К игре
        </button>
      </div>
      <Show when={saves.state === 'ready'} fallback={<>В данный момент сохранения {saves.state}</>}>
        <Show when={saves()} fallback={<>Сохранений нет</>}>
          {() => {
            const latest = saves()!.at(-1)!;
            const current = latest[2][2];

            const languageNames = new Intl.DisplayNames([current], {
              type: 'language'
            });

            return (
              <div class={style.content}>
                <label for={id}>Язык</label>
                <select id={id} onChange={onSelect}>
                  <For each={props.languages}>
                    {language => {
                      return <option value={language} selected={language === current}>{capitalize(languageNames.of(language) || language)}</option>
                    }}
                  </For>
                </select>
              </div>
            )
          }}
        </Show>
      </Show>
    </div>
  )
}

export { Settings }